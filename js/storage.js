// Storage utility functions for health and work logs
const HEALTH_KEY = 'pd_health_logs';
const WORK_KEY = 'pd_work_logs';

// Get today's date in YYYY-MM-DD format
export function getTodayDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getMonthYear(dateString) {
    // Returns YYYY-MM format from YYYY-MM-DD
    return dateString.substring(0, 7);
}

// ----- HEALTH DATA -----
// Health data schema: { "YYYY-MM-DD": { steps: number, water: number } }
export function getHealthData() {
    return JSON.parse(localStorage.getItem(HEALTH_KEY) || '{}');
}

export function saveHealthData(dateStr, steps, water) {
    const data = getHealthData();
    if (!data[dateStr]) {
        data[dateStr] = { steps: 0, water: 0 };
    }

    if (steps !== undefined && steps !== null) {
        data[dateStr].steps = parseInt(steps, 10);
    }
    if (water !== undefined && water !== null) {
        data[dateStr].water = parseInt(water, 10);
    }

    localStorage.setItem(HEALTH_KEY, JSON.stringify(data));
}

export function getHealthEntry(dateStr) {
    const data = getHealthData();
    return data[dateStr] || { steps: 0, water: 0 };
}

// ----- WORK DATA -----
// Work data schema: { "YYYY-MM-DD": [ { id, title, startTime, endTime, project, location, distance, status, remarks } ] }
export function getWorkData() {
    return JSON.parse(localStorage.getItem(WORK_KEY) || '{}');
}

export function getWorkDay(dateStr) {
    const data = getWorkData();
    return data[dateStr] || [];
}

export function saveWorkEntry(dateStr, entry) {
    const data = getWorkData();
    if (!data[dateStr]) {
        data[dateStr] = [];
    }

    // Use timestamp as ID if not provided
    if (!entry.id) {
        entry.id = Date.now().toString();
    }

    data[dateStr].push(entry);
    localStorage.setItem(WORK_KEY, JSON.stringify(data));
}

// Helper to update an existing entry or add it
export function updateWorkEntry(dateStr, updatedEntry) {
    const data = getWorkData();
    if (!data[dateStr]) return;
    const index = data[dateStr].findIndex(w => w.id === updatedEntry.id);
    if (index !== -1) {
        data[dateStr][index] = updatedEntry;
        localStorage.setItem(WORK_KEY, JSON.stringify(data));
    }
}

// ----- USER PROFILE -----
export function getUserProfile() {
    return JSON.parse(localStorage.getItem('pd_user_profile') || '{"name":"","designation":"","hq":"","radius":5}');
}

export function saveUserProfile(name, designation, hq, radius) {
    const profile = {
        name,
        designation,
        hq,
        radius: parseInt(radius, 10) || 5
    };
    localStorage.setItem('pd_user_profile', JSON.stringify(profile));
}

// ----- HEALTH SETTINGS -----
export function getHealthSettings() {
    return JSON.parse(localStorage.getItem('pd_health_settings') || '{"stepTarget":10000,"waterTarget":8,"glassSize":250}');
}

export function saveHealthSettings(stepTarget, waterTarget, glassSize) {
    const settings = {
        stepTarget: parseInt(stepTarget, 10) || 10000,
        waterTarget: parseInt(waterTarget, 10) || 8,
        glassSize: parseInt(glassSize, 10) || 250
    };
    localStorage.setItem('pd_health_settings', JSON.stringify(settings));
}

// Settings
export function clearAllData() {
    localStorage.removeItem(HEALTH_KEY);
    localStorage.removeItem(WORK_KEY);
    localStorage.removeItem('pd_user_profile');
    localStorage.removeItem('pd_health_settings');
    localStorage.removeItem('pd_theme');
}

// ----- THEME SETTINGS -----
export function getAppTheme() {
    return localStorage.getItem('pd_theme') || 'light';
}

export function saveAppTheme(theme) {
    localStorage.setItem('pd_theme', theme);
}
