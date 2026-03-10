import { getTodayDate, getWorkDay, saveWorkEntry, getUserProfile } from '../storage.js';
import { getCurrentWeekDates, getMonthDates, formatDuration, getDurationMins, aggregateWorkData, downloadFile } from '../utils.js';

let currentSubTab = 'journal';
let journalActiveDate = getTodayDate();
let showAddForm = false;

export function renderWork(container) {
  const tabsHtml = `
    <div class="view-tabs">
      <div class="view-tab ${currentSubTab === 'journal' ? 'active' : ''}" data-target="journal">Journal</div>
      <div class="view-tab ${currentSubTab === 'weekly' ? 'active' : ''}" data-target="weekly">Weekly View</div>
      <div class="view-tab ${currentSubTab === 'monthly' ? 'active' : ''}" data-target="monthly">Monthly Report</div>
    </div>
  `;

  let contentHtml = '';
  if (currentSubTab === 'journal') contentHtml = renderJournalView();
  else if (currentSubTab === 'weekly') contentHtml = renderWeeklyView();
  else if (currentSubTab === 'monthly') contentHtml = renderMonthlyView();

  container.innerHTML = `
    <div class="work-container">
      ${tabsHtml}
      <div id="work-content">${contentHtml}</div>
    </div>
  `;

  // Attach tab events
  container.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      currentSubTab = e.target.getAttribute('data-target');
      // reset form toggle on tab switch
      if (currentSubTab !== 'journal') showAddForm = false;
      renderWork(container);
    });
  });

  attachEvents(container);
}

function renderJournalView() {
  const dayData = getWorkDay(journalActiveDate);

  // Calculate day summary
  let totalMins = 0;
  let totalDistance = 0;
  dayData.forEach(task => {
    totalMins += getDurationMins(task.startTime, task.endTime);
    if (task.distance) totalDistance += parseFloat(task.distance);
  });
  const summaryHtml = `
    <div class="card" style="background-color: var(--border-color);">
      <div class="flex justify-between items-center text-sm">
        <div><strong>Tasks:</strong> ${dayData.length}</div>
        <div><strong>Hours:</strong> ${formatDuration(totalMins)}</div>
        <div><strong>Distance:</strong> ${totalDistance.toFixed(1)} km</div>
      </div>
    </div>
  `;

  const addFormHtml = showAddForm ? `
    <div class="card" style="border: 1px solid var(--primary);">
      <h3 class="text-h3">Add Activity</h3>
      <div class="form-group">
        <label>Task Title</label>
        <input type="text" id="wa-title" class="form-control" placeholder="What did you do?">
      </div>
      
      <div class="flex gap-4">
         <div class="form-group" style="flex:1;">
           <label>Start Time</label>
           <input type="time" id="wa-start" class="form-control" value="09:00">
         </div>
         <div class="form-group" style="flex:1;">
           <label>End Time</label>
           <input type="time" id="wa-end" class="form-control" value="10:00">
         </div>
      </div>
      
      <div class="form-group">
        <label>From Location</label>
        <input type="text" id="wa-from" class="form-control" placeholder="Where did you start?">
      </div>
      
      <div class="form-group">
        <label>To Location</label>
        <input type="text" id="wa-to" class="form-control" placeholder="Where did you go?">
      </div>
      
      <div class="flex gap-4">
        <div class="form-group" style="flex:1;">
          <label>Location / Type</label>
          <select id="wa-location" class="form-control">
             <option>Office</option>
             <option>Remote</option>
             <option>Client Site</option>
             <option>Field Work</option>
          </select>
        </div>
        <div class="form-group" style="flex:1;">
          <label>Distance (km)</label>
          <input type="number" id="wa-distance" class="form-control" placeholder="0">
        </div>
      </div>
      
      <div class="form-group">
         <label>Status</label>
         <select id="wa-status" class="form-control">
            <option>Done</option>
            <option>In Progress</option>
            <option>Planned</option>
         </select>
      </div>
      
      <div class="form-group">
         <label>Remarks</label>
         <textarea id="wa-remarks" class="form-control" rows="2" placeholder="Notes..."></textarea>
      </div>
      
      <div class="flex gap-4">
         <button id="btn-cancel-task" class="btn" style="flex:1; background:var(--border-color); color:var(--text-main);">Cancel</button>
         <button id="btn-save-task" class="btn btn-primary" style="flex:1;">Save</button>
      </div>
    </div>
  ` : `
    <button id="btn-toggle-form" class="btn btn-primary btn-block mb-4">
       <i class="ph ph-plus"></i> Add Work Activity
    </button>
  `;

  const listHtml = dayData.length > 0 ? dayData.map(task => `
    <div class="card" style="padding: 12px; margin-bottom: 8px; border-left: 4px solid var(${task.status === 'Done' ? '--success' : task.status === 'In Progress' ? '--warning' : '--border-color'})">
       <div class="flex justify-between items-center mb-2">
         <strong style="font-size:1rem;">${task.title}</strong>
         <span class="text-sm text-muted">${task.startTime} - ${task.endTime}</span>
       </div>
       <div class="text-sm text-muted mb-2">
         <span style="font-weight:600; color:var(--primary);"><i class="ph ph-map-pin"></i> ${task.fromLoc || '-'} &rarr; ${task.toLoc || '-'}</span> &bull; 
         <i class="ph ph-briefcase"></i> ${task.location} ${task.distance ? `(${task.distance}km)` : ''}
       </div>
       ${task.remarks ? `<p class="text-sm" style="background:var(--bg-color); padding:8px; border-radius:4px;">${task.remarks}</p>` : ''}
    </div>
  `).join('') : `<p class="text-muted text-center" style="margin:20px 0;">No activities logged for this day.</p>`;

  return `
    <!-- Top Date Selector -->
    <div class="card">
       <div class="flex justify-between items-center">
          <strong>Select Date</strong>
          <input type="date" id="journal-date" class="form-control" style="width: auto;" value="${journalActiveDate}">
       </div>
    </div>
    
    ${summaryHtml}
    ${addFormHtml}
    
    <div class="journal-list">
      <h3 class="text-h3 mb-2">Activities</h3>
      ${listHtml}
    </div>
  `;
}

function renderWeeklyView() {
  return `
    <div class="card">
      <div class="form-group">
        <label>Select Date in Week</label>
        <input type="date" id="week-selector" class="form-control" value="${getTodayDate()}">
      </div>
      <div id="weekly-report-container"></div>
    </div>
  `;
}

function renderMonthlyView() {
  const monthStr = getTodayDate().substring(0, 7);
  return `
    <div class="card">
      <div class="form-group">
        <label>Select Month for Report</label>
        <input type="month" id="month-selector" class="form-control" value="${monthStr}">
      </div>
      <div class="flex gap-4">
        <button id="btn-export-pdf" class="btn btn-primary" style="flex:1;"><i class="ph ph-download-simple"></i> Download PDF</button>
        <button id="btn-export-xls" class="btn" style="flex:1; background-color: var(--success); color: white;"><i class="ph ph-file-xls"></i> Download Excel (.xls)</button>
      </div>
    </div>
    
    <!-- PDF Container - PREVIEW -->
    <div id="pdf-report-container" style="background:white; color:black; padding:8px; font-size:10px; overflow-x: auto; border: 1px solid var(--border-color); border-radius: 8px;"></div>
  `;
}

function attachEvents(container) {
  if (currentSubTab === 'journal') {
    const dateInput = document.getElementById('journal-date');
    dateInput.addEventListener('change', (e) => {
      journalActiveDate = e.target.value;
      renderWork(container);
    });

    const toggleBtn = document.getElementById('btn-toggle-form');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        showAddForm = true;
        renderWork(container);
      });
    }

    const cancelBtn = document.getElementById('btn-cancel-task');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        showAddForm = false;
        renderWork(container);
      });
    }

    const saveBtn = document.getElementById('btn-save-task');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const entry = {
          title: document.getElementById('wa-title').value || 'Untitled Task',
          startTime: document.getElementById('wa-start').value,
          endTime: document.getElementById('wa-end').value,
          fromLoc: document.getElementById('wa-from').value,
          toLoc: document.getElementById('wa-to').value,
          location: document.getElementById('wa-location').value,
          distance: document.getElementById('wa-distance').value || 0,
          status: document.getElementById('wa-status').value,
          remarks: document.getElementById('wa-remarks').value
        };
        saveWorkEntry(journalActiveDate, entry);
        showAddForm = false;
        renderWork(container);
      });
    }
  }
  else if (currentSubTab === 'weekly') {
    const weekSelector = document.getElementById('week-selector');
    const updateWeeklyReport = () => {
      const d = new Date(weekSelector.value);
      if (isNaN(d.getTime())) return;
      const weekDates = getCurrentWeekDates(d);
      const summary = aggregateWorkData(weekDates, window.localStorage); // Actually we need getWorkData(), wait, utils accepts full objects.
      // Let's get the work object
      const workDataMap = JSON.parse(localStorage.getItem('pd_work_logs') || '{}');

      let tableRows = weekDates.map(dateStr => {
        const dayLogs = workDataMap[dateStr] || [];
        let tasks = dayLogs.length;
        let dist = 0;
        let mins = 0;
        let project = '-';
        let remarks = '-';

        if (tasks > 0) {
          const sortedLogs = [...dayLogs].sort((a, b) => a.startTime.localeCompare(b.startTime));
          project = `${sortedLogs[0].fromLoc || '-'} &rarr; ${sortedLogs[0].toLoc || '-'}`;
          remarks = sortedLogs.map(l => l.remarks || l.title).filter(Boolean).join('; ') || '-';
          dayLogs.forEach(l => {
            dist += parseFloat(l.distance || 0);
            mins += getDurationMins(l.startTime, l.endTime);
          });
        }
        // limit remarks length
        if (remarks.length > 50) remarks = remarks.substring(0, 47) + '...';

        return `
              <tr style="border-bottom: 1px solid var(--border-color);">
                 <td style="padding: 8px;">${dateStr.split('-')[2]}</td>
                 <td style="padding: 8px;">${project}</td>
                 <td style="padding: 8px;">${tasks}</td>
                 <td style="padding: 8px;">${formatDuration(mins)}</td>
                 <td style="padding: 8px;">${dist}</td>
                 <td style="padding: 8px; font-size:0.8em; color:var(--text-muted);">${remarks}</td>
              </tr>
            `;
      }).join('');

      const stats = aggregateWorkData(weekDates, workDataMap);

      document.getElementById('weekly-report-container').innerHTML = `
           <div style="overflow-x: auto;">
             <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                   <tr style="border-bottom: 2px solid var(--border-color); background: var(--bg-color);">
                     <th style="padding: 8px;">Date</th>
                     <th style="padding: 8px;">Route</th>
                     <th style="padding: 8px;">Tasks</th>
                     <th style="padding: 8px;">Time</th>
                     <th style="padding: 8px;">Km</th>
                     <th style="padding: 8px;">Remarks</th>
                   </tr>
                </thead>
                <tbody>${tableRows}</tbody>
             </table>
           </div>
           
           <div class="mt-4 p-2" style="background:var(--bg-color); border-radius:8px;">
              <h4 class="text-sm font-bold mb-2">Weekly Summary</h4>
              <div class="flex justify-between text-sm">
                 <span>Days Worked: ${stats.daysWorked}/7</span>
                 <span>Total Tasks: ${stats.completedTasks}</span>
                 <span>Total Hours: ${stats.totalHours}</span>
                 <span>Distance: ${stats.totalDistance}km</span>
              </div>
           </div>
         `;
    };
    weekSelector.addEventListener('change', updateWeeklyReport);
    updateWeeklyReport();
  }
  else if (currentSubTab === 'monthly') {
    const monthSelector = document.getElementById('month-selector');
    const updateMonthlyReport = () => {
      const dStr = monthSelector.value;
      if (!dStr) return;
      const monthDates = getMonthDates(dStr);
      const workDataMap = JSON.parse(localStorage.getItem('pd_work_logs') || '{}');
      const profile = getUserProfile();
      const reportMonthName = new Date(dStr + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });

      let totalDuty = 0;
      let totalTour = 0;

      let detailedTableRows = '';
      let exportTableRows = '';

      monthDates.forEach((dateStr, index) => {
        const dayLogs = workDataMap[dateStr] || [];
        const dateObj = new Date(dateStr);
        const sortedLogs = [...dayLogs].sort((a, b) => a.startTime.localeCompare(b.startTime));
        const isSunday = dateObj.getDay() === 0;

        // --- Build Screen Rows (Detailed) ---
        let screenRemarks = '';
        let screenTasksCount = dayLogs.length;
        let screenMins = 0;

        if (dayLogs.length > 0) {
          screenRemarks = sortedLogs.map(l => l.remarks || l.title).filter(Boolean).join('; ');
          dayLogs.forEach(l => screenMins += getDurationMins(l.startTime, l.endTime));
        } else if (isSunday) {
          screenRemarks = "Availed the public holiday Sunday";
        } else {
          screenRemarks = "No activities";
        }

        detailedTableRows += `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 8px;">${index + 1}</td>
            <td style="padding: 8px; white-space: nowrap;">${dateStr.split('-').reverse().join('-')}</td>
            <td style="padding: 8px;">${dayLogs.length > 0 ? (sortedLogs[0].fromLoc || profile.hq || '-') : '-'}</td>
            <td style="padding: 8px;">${dayLogs.length > 0 ? (sortedLogs[0].toLoc || '-') : '-'}</td>
            <td style="padding: 8px;">${dayLogs.reduce((acc, l) => acc + parseFloat(l.distance || 0), 0) || '-'}</td>
            <td style="padding: 8px;">${screenTasksCount}</td>
            <td style="padding: 8px;">${formatDuration(screenMins)}</td>
            <td style="padding: 8px; font-size: 0.85em; color: var(--text-muted);">${screenRemarks}</td>
          </tr>
        `;

        // --- Build Export Rows (Tour Format) ---
        let from = profile.hq || '-';
        let to = '';
        let dist = '';
        let dutyDays = '';
        let tourDays = '';
        let outDays = '';
        let exportRemarks = '';

        if (dayLogs.length > 0) {
          dutyDays = 1;
          totalDuty++;

          const hasField = dayLogs.some(l => l.location === 'Client Site' || l.location === 'Field Work');
          if (hasField) { tourDays = 1; totalTour++; }

          let totalDist = 0;
          dayLogs.forEach(l => { totalDist += parseFloat(l.distance || 0); });
          if (totalDist > 0) dist = totalDist;

          from = sortedLogs[0].fromLoc || profile.hq || '-';
          to = sortedLogs[0].toLoc || '-';
          exportRemarks = sortedLogs.map(l => l.remarks || l.title).filter(Boolean).join('; ');

          if (dutyDays === 1) outDays = '0';
        } else {
          if (isSunday) {
            exportRemarks = "Availed the public holiday Sunday";
            from = '';
          }
        }

        exportTableRows += `
              <tr>
                 <td style="border: 1px solid #000; padding: 4px;">${index + 1}</td>
                 <td style="border: 1px solid #000; padding: 4px; white-space: nowrap;">${dateStr.split('-').reverse().join('-')}</td>
                 <td style="border: 1px solid #000; padding: 4px;">${from}</td>
                 <td style="border: 1px solid #000; padding: 4px;">${to}</td>
                 <td style="border: 1px solid #000; padding: 4px; text-align: center;">${dist}</td>
                 <td style="border: 1px solid #000; padding: 4px; text-align: center;">${dutyDays}</td>
                 <td style="border: 1px solid #000; padding: 4px; text-align: center;">${tourDays}</td>
                 <td style="border: 1px solid #000; padding: 4px; text-align: center;">${outDays}</td>
                 <td style="border: 1px solid #000; padding: 4px; text-align: left;">${exportRemarks}</td>
              </tr>
            `;
      });

      const screenHtml = `
           <div style="overflow-x: auto;">
             <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                   <tr style="border-bottom: 2px solid var(--border-color); background: var(--bg-color);">
                     <th style="padding: 8px;">S.No</th>
                     <th style="padding: 8px;">Date</th>
                     <th style="padding: 8px;">From</th>
                     <th style="padding: 8px;">To</th>
                     <th style="padding: 8px;">Dist(km)</th>
                     <th style="padding: 8px;">Tasks</th>
                     <th style="padding: 8px;">Time</th>
                     <th style="padding: 8px;">Remarks</th>
                   </tr>
                </thead>
                <tbody>${detailedTableRows}</tbody>
             </table>
           </div>
      `;

      // Store massive PDF payload string to a detached DOM generation variable later
      window._cachedPdfHtml = `
            <div style="width: 1200px; font-family: sans-serif; font-size: 11px; padding: 10px; box-sizing: border-box; background: white; color: black;">
              <div style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 15px;">
                Tour Journal Of ${profile.name} ${profile.designation}, ${(profile.hq || '').toUpperCase()} for the Month of ${reportMonthName}
              </div>
              <div style="font-weight: bold; margin-bottom: 5px;">Designation: ${profile.designation}</div>
              <div style="font-weight: bold; margin-bottom: 15px;">Head Quarters: ${profile.hq}</div>

              <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 11px; table-layout: fixed; word-wrap: break-word;">
                <thead>
                  <tr style="background:#f9f9f9;">
                    <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 40px;">S.No</th>
                    <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 75px;">Date</th>
                    <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 100px;">From</th>
                    <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 100px;">To</th>
                    <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 60px;"><div style="writing-mode: vertical-rl; transform: rotate(180deg); margin: 0 auto; white-space: nowrap;">Distance in km</div></th>
                    <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 60px;"><div style="writing-mode: vertical-rl; transform: rotate(180deg); margin: 0 auto; white-space: nowrap;">No. of days on duty</div></th>
                    <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 60px;"><div style="writing-mode: vertical-rl; transform: rotate(180deg); margin: 0 auto; white-space: nowrap;">No. of days on tour</div></th>
                    <th style="border: 1px solid #000; padding: 4px; font-weight: bold; width: 60px;"><div style="writing-mode: vertical-rl; transform: rotate(180deg); margin: 0 auto; white-space: nowrap;">No.of days beyond jurisdiction</div></th>
                    <th style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align:left;">Remarks (Here enter abstract of the journey)</th>
                  </tr>
                  <tr style="background:#f9f9f9;">
                    <th style="border: 1px solid #000; padding: 4px;">1</th>
                    <th style="border: 1px solid #000; padding: 4px;">2</th>
                    <th style="border: 1px solid #000; padding: 4px;">3</th>
                    <th style="border: 1px solid #000; padding: 4px;">4</th>
                    <th style="border: 1px solid #000; padding: 4px;">5</th>
                    <th style="border: 1px solid #000; padding: 4px;">6</th>
                    <th style="border: 1px solid #000; padding: 4px;">7</th>
                    <th style="border: 1px solid #000; padding: 4px;">8</th>
                    <th style="border: 1px solid #000; padding: 4px;">9</th>
                  </tr>
                </thead>
                <tbody>
                  ${exportTableRows}
                  <tr>
                    <td style="border: 1px solid #000; padding: 4px;"></td>
                    <td colspan="3" style="border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold;">Total</td>
                    <td style="border: 1px solid #000; padding: 4px;"></td>
                    <td style="border: 1px solid #000; padding: 4px;"></td>
                    <td style="border: 1px solid #000; padding: 4px;"></td>
                    <td style="border: 1px solid #000; padding: 4px;"></td>
                    <td style="border: 1px solid #000; padding: 4px;"></td>
                  </tr>
                </tbody>
              </table>

              <div style="margin-top: 15px; text-align: left; margin-bottom: 5px;">
                Certified that I have actually toured ${totalTour} days in the month of ${reportMonthName}
              </div>
              <div style="text-align: left; margin-bottom: 40px;">
                Certified that no claim for fixed travelling allowance has been made for journey or halts within radius of ${profile.radius || 5} kms from the head quarters.
              </div>

              <div style="text-align: right; padding-right: 50px;">
                <div style="font-weight: bold; margin-bottom: 4px;">AUTHORIZED SIGNATURE</div>
                <div style="font-weight: bold;">${profile.designation}</div>
              </div>
              
              <div style="text-align: center; margin-top: 40px;">
                <p style="font-size: 11px; color: #6b7280; margin: 0;">Developed by PS AI Tech Solutions</p>
                <p style="font-size: 10px; color: #3b82f6; margin: 2px 0 0 0; text-decoration: none;">https://psaitechsolutions.com</p>
              </div>
            </div>
      `;
      // Render ONLY the screen-visible UI into the main dashboard tab DOM tree
      document.getElementById('pdf-report-container').innerHTML = screenHtml;
    };

    monthSelector.addEventListener('change', updateMonthlyReport);
    updateMonthlyReport();

    const exportPdfBtn = document.getElementById('btn-export-pdf');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => {
        // Construct a detached HTML tag out-of-bounds to prevent any visible viewport glitches
        const element = document.createElement('div');
        element.innerHTML = window._cachedPdfHtml;
        const filename = `Monthly_Report_${monthSelector.value}.pdf`;
        const opt = {
          margin: 10,
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: 1200 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        // Explicitly intercept the blob output and route through solid download handler
        html2pdf().set(opt).from(element).output('blob').then(async (blob) => {
          await downloadFile(blob, filename);
        });
      });
    }

    const exportXlsBtn = document.getElementById('btn-export-xls');
    if (exportXlsBtn) {
      exportXlsBtn.addEventListener('click', () => {
        const dStr = monthSelector.value;
        const monthDates = getMonthDates(dStr);
        const workDataMap = JSON.parse(localStorage.getItem('pd_work_logs') || '{}');
        const profile = getUserProfile();

        // Create raw json data array representing the table
        const exportData = [];
        const reportMonthName = new Date(dStr + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });

        // Build Rows strictly enforcing style via xlsx-js-style format
        exportData.push([`Tour Journal Of ${profile.name} ${profile.designation}, ${(profile.hq || '').toUpperCase()} for the Month of ${reportMonthName}`, '', '', '', '', '', '', '', '']);
        exportData.push([`Designation: ${profile.designation}`, '', '', '', '', '', '', '', '']);
        exportData.push([`Head Quarters: ${profile.hq}`, '', '', '', '', '', '', '', '']);
        exportData.push(['', '', '', '', '', '', '', '', '']); // Blank row
        exportData.push(['S.No', 'Date', 'From', 'To', 'Distance in km', 'No. of days on duty', 'No. of days on tour', 'No. of days beyond jurisdiction', 'Remarks (Here enter abstract of the journey)']);
        exportData.push(['1', '2', '3', '4', '5', '6', '7', '8', '9']);

        let totTour = 0;
        let dataStartRow = 6;
        let rowCount = 0;

        monthDates.forEach((dateStr, index) => {
          const dayLogs = workDataMap[dateStr] || [];
          let from = profile.hq || '';
          let to = '';
          let dist = '';
          let dutyDays = '';
          let tourDays = '';
          let outDays = '';
          let remarks = '';
          const isSunday = new Date(dateStr).getDay() === 0;

          if (dayLogs.length > 0) {
            dutyDays = 1;
            const sortedLogs = [...dayLogs].sort((a, b) => a.startTime.localeCompare(b.startTime));
            const hasField = dayLogs.some(l => l.location === 'Client Site' || l.location === 'Field Work');
            if (hasField) { tourDays = 1; totTour++; }

            let totalDist = 0;
            dayLogs.forEach(l => { totalDist += parseFloat(l.distance || 0); });
            if (totalDist > 0) dist = totalDist;

            from = sortedLogs[0].fromLoc || profile.hq || '';
            to = sortedLogs[0].toLoc || '';
            remarks = sortedLogs.map(l => l.remarks || l.title).filter(Boolean).join('; ');
            if (dutyDays === 1) outDays = 0;
          } else if (isSunday) {
            remarks = "Availed the public holiday Sunday";
            from = '';
          }

          exportData.push([index + 1, dateStr.split('-').reverse().join('-'), from, to, dist, dutyDays, tourDays, outDays, remarks]);
          rowCount++;
        });

        // Add Trailers
        exportData.push(['', 'Total', '', '', '', '', '', '', '']);
        exportData.push([`Certified that I have actually toured ${totTour} days in the month of ${reportMonthName}`, '', '', '', '', '', '', '', '']);
        exportData.push([`Certified that no claim for fixed travelling allowance has been made for journey or halts within radius of ${profile.radius || 5} kms from the head quarters.`, '', '', '', '', '', '', '', '']);
        exportData.push(['', '', '', '', '', '', '', '', '']);
        exportData.push(['', '', '', '', '', '', '', 'AUTHORIZED SIGNATURE', '']);
        exportData.push(['', '', '', '', '', '', '', profile.designation, '']);
        exportData.push(['', '', '', '', '', '', '', '', '']);
        exportData.push(['Developed by PS AI Tech Solutions', '', '', '', '', '', '', '', '']);

        const ws = XLSX.utils.aoa_to_sheet(exportData);

        // Apply Merges
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Title 
          { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Designation
          { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }, // Head Quarters
          { s: { r: dataStartRow + rowCount, c: 1 }, e: { r: dataStartRow + rowCount, c: 3 } }, // 'Total' label merge
          { s: { r: dataStartRow + rowCount + 1, c: 0 }, e: { r: dataStartRow + rowCount + 1, c: 8 } }, // Certification 1 merge across
          { s: { r: dataStartRow + rowCount + 2, c: 0 }, e: { r: dataStartRow + rowCount + 2, c: 8 } }, // Certification 2 merge across
          { s: { r: dataStartRow + rowCount + 7, c: 0 }, e: { r: dataStartRow + rowCount + 7, c: 8 } } // Branding footer merge
        ];

        // Apply Heavy Styling (Requires xlsx-js-style CDN)
        const borderAll = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        const centerStyle = { alignment: { horizontal: 'center', vertical: 'center', wrapText: true } };
        const leftStyle = { alignment: { horizontal: 'left', vertical: 'top', wrapText: true } };

        for (let R = 0; R < exportData.length; R++) {
          for (let C = 0; C < exportData[R].length; C++) {
            const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddr]) ws[cellAddr] = { v: '', t: 's' };

            let style = { font: {}, alignment: {}, border: {} };

            // Title
            if (R === 0) {
              style.font = { bold: true, sz: 16 };
              style.alignment = { horizontal: 'center', vertical: 'center' };
            }
            // User details
            else if (R === 1 || R === 2) {
              style.font = { bold: true };
            }
            // Table Headers
            else if (R === 4 || R === 5) {
              style.font = { bold: true };
              style.border = borderAll;
              style.alignment = centerStyle.alignment;
            }
            // Table Data & Total row
            else if (R >= dataStartRow && R <= dataStartRow + rowCount) {
              style.border = borderAll;
              if (C >= 4 && C <= 7) {
                style.alignment = centerStyle.alignment;
              } else {
                style.alignment = leftStyle.alignment;
              }
              if (R === dataStartRow + rowCount && C === 1) style.font = { bold: true }; // Total Text
            }
            // Certifications & Signature
            else if (R > dataStartRow + rowCount) {
              style.alignment = leftStyle.alignment;

              if (R === exportData.length - 4 || R === exportData.length - 3) { // Signature Block
                if (C === 7) {
                  style.font = { bold: true };
                  style.alignment = centerStyle.alignment;
                }
              }
              // Enforce generic centering across merged branding + certifications elements if needed
              else if (R === exportData.length - 1) { // Branding
                style.font = { color: { rgb: "6B7280" } };
                style.alignment = centerStyle.alignment;
              }
            }

            ws[cellAddr].s = style;
          }
        }

        // Adjust column widths for better readibility
        ws['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];

        // Initialize Workbook and append compiled Worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");

        // Write pure binary blob to array and route through solid download handler
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        downloadFile(blob, `Monthly_Report_${dStr}.xlsx`);
      });
    }
  }
}
