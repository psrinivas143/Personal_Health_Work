import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Date & Math Utilities

// Get array of YYYY-MM-DD for the current week (Monday to Sunday)
export function getCurrentWeekDates(dateObj = new Date()) {
    const currentDay = dateObj.getDay();
    // JS getDay() is 0 for Sunday, 1 for Monday. Convert so Monday is 0, Sunday is 6.
    const distance = currentDay === 0 ? 6 : currentDay - 1;

    const monday = new Date(dateObj);
    monday.setDate(dateObj.getDate() - distance);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        weekDates.push(`${yr}-${mo}-${day}`);
    }
    return weekDates;
}

// format minutes to "Xh Ym"
export function formatDuration(totalMins) {
    if (!totalMins) return '0h 0m';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
}

// calculate diff in minutes between "HH:MM" and "HH:MM"
export function getDurationMins(startStr, endStr) {
    if (!startStr || !endStr) return 0;
    const parseTime = str => {
        let [h, m] = str.split(':').map(Number);
        return h * 60 + m;
    };
    const m1 = parseTime(startStr);
    const m2 = parseTime(endStr);
    // handle overnight (rare for work, but just in case)
    return m2 >= m1 ? (m2 - m1) : ((24 * 60 - m1) + m2);
}

// aggregate health data over an array of date strings
export function aggregateHealthData(dateStrs, healthDataObj) {
    let steps = 0;
    let water = 0;
    let daysWithData = 0;

    dateStrs.forEach(dStr => {
        if (healthDataObj[dStr]) {
            steps += healthDataObj[dStr].steps || 0;
            water += healthDataObj[dStr].water || 0;
            if (healthDataObj[dStr].steps > 0 || healthDataObj[dStr].water > 0) {
                daysWithData++;
            }
        }
    });

    return {
        totalSteps: steps,
        totalWater: water,
        avgSteps: daysWithData ? Math.round(steps / daysWithData) : 0,
        avgWater: daysWithData ? +(water / daysWithData).toFixed(1) : 0
    };
}

// aggregate work data over an array of date strings
export function aggregateWorkData(dateStrs, workDataObj) {
    let totalTasks = 0;
    let totalDurationMins = 0;
    let completedTasks = 0;
    let totalDistance = 0;
    let daysWorked = 0;

    dateStrs.forEach(dStr => {
        const dayTasks = workDataObj[dStr];
        if (dayTasks && dayTasks.length > 0) {
            daysWorked++;
            dayTasks.forEach(task => {
                totalTasks++;
                if (task.status === 'Done') completedTasks++;
                totalDurationMins += getDurationMins(task.startTime, task.endTime);
                if (task.distance) totalDistance += parseFloat(task.distance);
            });
        }
    });

    return {
        totalTasks,
        completedTasks,
        totalDurationMins,
        totalHours: formatDuration(totalDurationMins),
        totalDistance: +totalDistance.toFixed(1),
        daysWorked
    };
}

// Get array of days in a given month (YYYY-MM)
export function getMonthDates(monthStr) {
    const [year, month] = monthStr.split('-');
    const numDays = new Date(year, month, 0).getDate();
    const dates = [];
    for (let i = 1; i <= numDays; i++) {
        const day = String(i).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }
    return dates;
}

// Robust Download Utility to force file extensions
export async function downloadFile(blob, filename) {
    const isCapacitor = Capacitor.isNativePlatform();

    if (isCapacitor) {
        try {
            // Convert blob to base64
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            // Write the file to device Cache directory
            const savedFile = await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: 'CACHE'
            });

            // Share the file
            await Share.share({
                title: filename,
                url: savedFile.uri,
                dialogTitle: 'Save or Share Export'
            });
            return;
        } catch (err) {
            alert("Native Download Failed: " + (err.message || err));
            // Let it fall through to browser methods as a desperate fallback
        }
    }

    // Traditional Browser Methods
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({ suggestedName: filename });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("SaveFilePicker fallback:", err);
            } else {
                return; // User aborted
            }
        }
    }

    // Traditional A-tag Fallback Method
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
