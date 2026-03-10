import { getTodayDate, getHealthEntry, getWorkDay, getHealthData, getWorkData } from '../storage.js';
import { getCurrentWeekDates, aggregateHealthData, aggregateWorkData, getDurationMins, formatDuration } from '../utils.js';

export function renderDashboard(container) {
  const today = getTodayDate();

  // Today's Data
  const healthToday = getHealthEntry(today) || { steps: 0, water: 0 };
  const workToday = getWorkDay(today) || [];

  let todayTasks = workToday.length || 0;
  let todayCompleted = workToday.filter(w => w.status === 'Done').length || 0;
  let todayMins = 0;
  workToday.forEach(w => todayMins += getDurationMins(w.startTime, w.endTime));

  // Week's Data
  const weekDates = getCurrentWeekDates();
  const healthWeek = aggregateHealthData(weekDates, getHealthData()) || { totalSteps: 0, avgSteps: 0, totalWater: 0 };
  const workWeek = aggregateWorkData(weekDates, getWorkData()) || { completedTasks: 0, totalHours: '0h 0m' };

  // Profile Greeting
  const profile = JSON.parse(localStorage.getItem('pd_user_profile') || '{}');
  const displayName = profile.name || 'User';

  const hour = new Date().getHours();
  let greeting = 'Good Evening';
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 17) greeting = 'Good Afternoon';

  container.innerHTML = `
    <!-- Greeting Section -->
    <div class="flex items-center gap-3 mb-4" style="background: var(--bg-color); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color);">
       <div style="width:40px; height:40px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
         <i class="ph ph-user text-h3"></i>
       </div>
       <div>
         <h2 class="text-h3" style="margin:0;">${greeting}, <span style="color:var(--primary);">${displayName}</span></h2>
         <p class="text-xs text-muted" style="margin:0;" id="dashboard-date">${today}</p>
       </div>
    </div>
    
    <h2 class="text-h2">Today's Overview</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
      <!-- Health Card -->
      <div class="card" style="margin-bottom: 0;">
         <div class="flex items-center gap-2 mb-2" style="color: var(--danger);">
           <i class="ph ph-heartbeat text-h3"></i>
           <h3 class="text-h3" style="margin:0;">Health</h3>
         </div>
         <p><strong>Steps:</strong> ${healthToday.steps.toLocaleString()}</p>
         <p><strong>Water:</strong> ${healthToday.water} gl</p>
      </div>

      <!-- Work Card -->
      <div class="card" style="margin-bottom: 0;">
         <div class="flex items-center gap-2 mb-2" style="color: var(--blue);">
           <i class="ph ph-briefcase text-h3"></i>
           <h3 class="text-h3" style="margin:0;">Work</h3>
         </div>
         <p><strong>Tasks:</strong> ${todayCompleted} / ${todayTasks}</p>
         <p><strong>Time:</strong> ${formatDuration(todayMins)}</p>
      </div>
    </div>

    <!-- Weekly Summary -->
    <h2 class="text-h2">This Week's Snapshot</h2>
    <div class="card" style="background-color: var(--primary); color: white;">
       <h3 class="text-h3" style="color:white; margin-bottom:16px;">Health & Activity</h3>
       
       <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <p style="font-size: 0.8rem; opacity: 0.8;">Total/Avg Steps</p>
            <p style="font-size: 1.1rem; font-weight:600;">${healthWeek.totalSteps.toLocaleString()} / ${healthWeek.avgSteps.toLocaleString()}</p>
          </div>
          <div>
            <p style="font-size: 0.8rem; opacity: 0.8;">Total Water</p>
            <p style="font-size: 1.1rem; font-weight:600;">${healthWeek.totalWater} gl</p>
          </div>
       </div>
       
       <div style="height:1px; background:rgba(255,255,255,0.2); margin-bottom:16px;"></div>
       
       <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <p style="font-size: 0.8rem; opacity: 0.8;">Tasks Completed</p>
            <p style="font-size: 1.1rem; font-weight:600;">${workWeek.completedTasks}</p>
          </div>
          <div>
             <p style="font-size: 0.8rem; opacity: 0.8;">Hours Worked</p>
             <p style="font-size: 1.1rem; font-weight:600;">${workWeek.totalHours}</p>
          </div>
       </div>
    </div>
  `;
}
