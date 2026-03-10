import { saveHealthData, getHealthData, getTodayDate, getHealthEntry, getHealthSettings } from '../storage.js';
import { getCurrentWeekDates, aggregateHealthData, getMonthDates } from '../utils.js';
import { Capacitor } from '@capacitor/core';
import { StepCounter } from '@dreiver1/capacitor-step-counter';

let currentSubTab = 'log';
let chartInstance = null;

export function renderHealth(container) {
  const tabsHtml = `
    <div class="view-tabs">
      <div class="view-tab ${currentSubTab === 'log' ? 'active' : ''}" data-target="log">Log</div>
      <div class="view-tab ${currentSubTab === 'history' ? 'active' : ''}" data-target="history">History</div>
      <div class="view-tab ${currentSubTab === 'weekly' ? 'active' : ''}" data-target="weekly">Weekly</div>
      <div class="view-tab ${currentSubTab === 'monthly' ? 'active' : ''}" data-target="monthly">Monthly</div>
    </div>
  `;

  let contentHtml = '';
  if (currentSubTab === 'log') contentHtml = renderLogView();
  else if (currentSubTab === 'history') contentHtml = renderHistoryView();
  else if (currentSubTab === 'weekly') contentHtml = renderWeeklyView();
  else if (currentSubTab === 'monthly') contentHtml = renderMonthlyView();

  container.innerHTML = `
    <div class="health-theme-dark">
      <div class="health-container">
        ${tabsHtml}
        <div id="health-content">${contentHtml}</div>
      </div>
    </div>
  `;

  // Attach tab events
  container.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      currentSubTab = e.target.getAttribute('data-target');
      renderHealth(container);
    });
  });

  // Attach specific events based on sub-tab
  attachEvents(container);
}

function renderLogView() {
  const today = getTodayDate();
  const entry = getHealthEntry(today);
  const settings = getHealthSettings();

  const stepTarget = settings.stepTarget;
  const currentSteps = entry.steps || 0;
  const stepPercent = Math.min(100, Math.round((currentSteps / stepTarget) * 100));
  const stepSuccessClass = currentSteps >= stepTarget ? 'success' : '';
  const stepStatus = currentSteps >= stepTarget ? 'Target Achieved! 🎉' : `${(stepTarget - currentSteps).toLocaleString()} steps to go! Keep Going!`;

  const waterTarget = settings.waterTarget;
  const currentWater = entry.water || 0;
  const MathWater = Math.round(currentWater * 10) / 10;
  const waterPercent = Math.min(100, Math.round((MathWater / waterTarget) * 100));
  const waterSuccessClass = MathWater >= waterTarget ? 'success' : '';
  const currentMl = Math.round(MathWater * settings.glassSize);

  return `
    <div class="mb-4 text-center">
       <div class="text-sm text-muted">Daily Health Log</div>
       <div class="text-h3">${today}</div>
    </div>

    <!-- Steps Tracker -->
    <div class="card mb-4 mt-2">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-h3" style="color:var(--primary-light); margin:0;">
          <i class="ph ph-footprints"></i> Steps
        </h3>
        <button id="btn-sync-steps" class="btn" style="padding: 4px 8px; font-size: 0.8rem; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-main);"><i class="ph ph-arrows-clockwise"></i> Sync</button>
      </div>
      
      <div class="text-center mb-4">
        <div style="font-size: 2.5rem; font-weight: 700; line-height: 1;"><span id="live-step-count">${currentSteps.toLocaleString()}</span></div>
        <div class="text-muted text-sm">/ ${stepTarget.toLocaleString()} goal</div>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar-fill ${stepSuccessClass}" style="width: ${stepPercent}%"></div>
      </div>
      
      <p class="text-center text-sm mb-4" style="color: ${currentSteps >= stepTarget ? 'var(--success)' : 'var(--warning)'}; font-weight:500;">
        ${stepStatus}
      </p>

      <div class="text-center text-xs text-muted">
         Steps are tracked automatically using your device's native pedometer.
      </div>
    </div>

    <!-- Water Tracker -->
    <div class="card mb-4 mt-2">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-h3" style="color:var(--primary-light); margin:0;">
          <i class="ph ph-drop"></i> Water Intake
        </h3>
      </div>
      
      <div class="circular-progress ${waterSuccessClass}" style="--progress: ${waterPercent};" id="water-circle">
        <div class="circular-progress-inner">
           <div style="font-size: 1.5rem; font-weight: 700;">${MathWater} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted)">/ ${waterTarget}</span></div>
           <div style="font-size: 0.75rem; color: var(--text-muted);">${currentMl} ml</div>
        </div>
      </div>
      
      <div class="water-quick-add">
         <button class="btn btn-primary" id="btn-water-glass" style="padding: 8px; font-size: 0.8rem;">+1 Glass</button>
         <button class="btn btn-primary" id="btn-water-250" style="padding: 8px; font-size: 0.8rem;">+250 ml</button>
         <button class="btn btn-primary" id="btn-water-500" style="padding: 8px; font-size: 0.8rem;">+500 ml</button>
      </div>
       <div class="mt-4 flex justify-center">
         <button class="btn" id="btn-water-minus" style="padding: 8px 16px; background-color: transparent; border: 1px solid var(--border-color); color: var(--text-main);">- 1 Glass</button>
      </div>
    </div>
  `;
}

function renderHistoryView() {
  const data = getHealthData();
  const settings = getHealthSettings();
  const dates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));

  if (dates.length === 0) {
    return `<div class="card"><p class="text-muted text-center">No health records found.</p></div>`;
  }

  let listHtml = dates.map(dPrefix => {
    const s = data[dPrefix].steps || 0;
    const w = data[dPrefix].water || 0;
    const sColor = s >= settings.stepTarget ? 'var(--success)' : 'var(--warning)';
    const wColor = w >= settings.waterTarget ? 'var(--primary-light)' : 'var(--text-muted)';

    return `
    <div class="card" style="padding: 12px; margin-bottom: 8px;">
      <div class="flex justify-between items-center">
        <strong style="font-size: 0.9rem;">${dPrefix}</strong>
        <div class="flex gap-4 text-sm">
           <span style="color:${sColor}; font-weight:600;"><i class="ph ph-footprints"></i> ${s.toLocaleString()}</span>
           <span style="color:${wColor}; font-weight:600;"><i class="ph ph-drop"></i> ${w} gl</span>
        </div>
      </div>
    </div>
  `}).join('');

  return `<div>${listHtml}</div>`;
}

function renderWeeklyView() {
  return `
    <div class="card">
      <div class="form-group">
        <label>Select Date in Week</label>
        <input type="date" id="week-selector" class="form-control" value="${getTodayDate()}">
      </div>
      <div id="weekly-stats" class="mb-4"></div>
      <div><canvas id="healthChart"></canvas></div>
    </div>
  `;
}

function renderMonthlyView() {
  const todayStr = getTodayDate();
  const monthStr = todayStr.substring(0, 7); // YYYY-MM
  return `
    <div class="card">
      <div class="form-group">
        <label>Select Month</label>
        <input type="month" id="month-selector" class="form-control" value="${monthStr}">
      </div>
      <div id="monthly-stats" class="mb-4"></div>
      <div><canvas id="healthChart"></canvas></div>
    </div>
  `;
}

function attachEvents(container) {
  if (currentSubTab === 'log') {
    const today = getTodayDate();
    const settings = getHealthSettings();
    const entry = getHealthEntry(today);
    let currentStepsVal = entry.steps || 0;
    let currentWaterVal = entry.water || 0;

    const saveAndRefresh = () => {
      saveHealthData(today, currentStepsVal, currentWaterVal);
      renderHealth(container);
    };

    document.getElementById('btn-sync-steps').addEventListener('click', async () => {
      const isCapacitor = Capacitor.isNativePlatform();
      if (!isCapacitor) {
        alert("Native step counter is only available on mobile devices.");
        return;
      }
      try {
        if (!StepCounter) {
          alert("StepCounter plugin not found.");
          return;
        }

        // Start the sensor (prompts for ACTIVITY_RECOGNITION permission)
        await StepCounter.start();

        // Android pedometer needs a brief moment to register the first event
        await new Promise(resolve => setTimeout(resolve, 500));

        const data = await StepCounter.getCurrentSteps();

        // Stop the sensor to save battery since we only sync on demand
        await StepCounter.stop();

        // Pedometer sensors return steps since boot
        // We track the boot baseline per day to get daily steps
        const bootKey = 'boot_steps_' + today;
        let baseline = localStorage.getItem(bootKey);

        if (!baseline) {
          baseline = data.steps;
          localStorage.setItem(bootKey, baseline);
        }

        const startOfTodayBaseline = parseInt(baseline, 10);

        // If device was rebooted, the lifetime steps might reset to 0 (or lower than baseline)
        if (data.steps < startOfTodayBaseline) {
          localStorage.setItem(bootKey, data.steps);
          // In this edge-case, just let it start from 0 for the remainder of the day
          currentStepsVal = data.steps;
        } else {
          currentStepsVal = (data.steps - startOfTodayBaseline);
        }
        saveAndRefresh();
      } catch (err) {
        console.error("StepCounter error:", err);
        alert("Could not sync steps: " + err.message);
      }
    });

    document.getElementById('btn-water-glass').addEventListener('click', () => { currentWaterVal += 1; saveAndRefresh(); });
    document.getElementById('btn-water-250').addEventListener('click', () => {
      const glasses = 250 / settings.glassSize;
      currentWaterVal = Math.round((currentWaterVal + glasses) * 10) / 10;
      saveAndRefresh();
    });
    document.getElementById('btn-water-500').addEventListener('click', () => {
      const glasses = 500 / settings.glassSize;
      currentWaterVal = Math.round((currentWaterVal + glasses) * 10) / 10;
      saveAndRefresh();
    });
    document.getElementById('btn-water-minus').addEventListener('click', () => { currentWaterVal = Math.max(0, currentWaterVal - 1); saveAndRefresh(); });
  }

  if (currentSubTab === 'weekly') {
    const weekSelector = document.getElementById('week-selector');
    const updateWeekChart = () => {
      const selectedDate = new Date(weekSelector.value);
      if (isNaN(selectedDate.getTime())) return;
      const weekDates = getCurrentWeekDates(selectedDate);
      const stats = aggregateHealthData(weekDates, getHealthData());

      document.getElementById('weekly-stats').innerHTML = `
         <div class="flex justify-between bg-color p-2" style="background:var(--bg-color); padding:12px; border-radius:8px; margin-bottom:16px;">
           <div class="text-center">
             <div class="text-sm text-muted">Total Steps</div>
             <strong>${stats.totalSteps.toLocaleString()}</strong>
           </div>
           <div class="text-center">
             <div class="text-sm text-muted">Avg Steps</div>
             <strong>${stats.avgSteps.toLocaleString()}</strong>
           </div>
           <div class="text-center">
             <div class="text-sm text-muted">Water</div>
             <strong>${stats.totalWater}gl</strong>
           </div>
         </div>
       `;
      drawChart(weekDates, 'day');
    };
    weekSelector.addEventListener('change', updateWeekChart);
    updateWeekChart();
  }
  else if (currentSubTab === 'monthly') {
    const monthSelector = document.getElementById('month-selector');
    const updateMonthChart = () => {
      const monthDates = getMonthDates(monthSelector.value);
      const stats = aggregateHealthData(monthDates, getHealthData());

      document.getElementById('monthly-stats').innerHTML = `
         <div class="flex justify-between bg-color p-2" style="background:var(--bg-color); padding:12px; border-radius:8px; margin-bottom:16px;">
           <div class="text-center">
             <div class="text-sm text-muted">Total Steps</div>
             <strong>${stats.totalSteps.toLocaleString()}</strong>
           </div>
           <div class="text-center">
             <div class="text-sm text-muted">Avg Steps</div>
             <strong>${stats.avgSteps.toLocaleString()}</strong>
           </div>
           <div class="text-center">
             <div class="text-sm text-muted">Avg Water</div>
             <strong>${stats.avgWater}gl</strong>
           </div>
         </div>
       `;
      drawChart(monthDates, 'date'); // label format just date part
    };
    monthSelector.addEventListener('change', updateMonthChart);
    updateMonthChart();
  }
}

function drawChart(dates, labelFormat) {
  const canvas = document.getElementById('healthChart');
  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  const data = getHealthData();

  let labels = [];
  if (labelFormat === 'day') {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    labels = dayNames;
  } else {
    labels = dates.map(d => d.split('-')[2]); // just the date number
  }

  const stepsData = dates.map(d => data[d]?.steps || 0);
  const waterData = dates.map(d => data[d]?.water || 0);
  const settings = getHealthSettings();

  const stepBgColors = stepsData.map(s => s >= settings.stepTarget ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)');
  const waterBorderColors = waterData.map(w => w >= settings.waterTarget ? 'rgba(96, 165, 250, 1)' : 'rgba(148, 163, 184, 1)');

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Steps',
          data: stepsData,
          backgroundColor: stepBgColors,
          yAxisID: 'y',
          borderRadius: 4
        },
        {
          label: 'Water (gl)',
          data: waterData,
          type: 'line',
          borderColor: 'rgba(96, 165, 250, 1)',
          backgroundColor: 'rgba(96, 165, 250, 0.2)',
          borderWidth: 2,
          yAxisID: 'y1',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Steps' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Water' }
        }
      }
    }
  });
}
