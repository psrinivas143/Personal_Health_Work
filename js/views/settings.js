import { clearAllData, getUserProfile, saveUserProfile, getHealthSettings, saveHealthSettings, getAppTheme, saveAppTheme } from '../storage.js';

export function renderSettings(container) {
  const profile = getUserProfile();

  container.innerHTML = `
    <h2 class="text-h2 mb-4">Settings</h2>
    
    <div class="card mb-4">
      <h3 class="text-h3">User Profile (For Reports)</h3>
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="prof-name" class="form-control" value="${profile.name || ''}" placeholder="e.g. Smt P.S Himabindhu">
      </div>
      <div class="form-group">
        <label>Designation</label>
        <input type="text" id="prof-desig" class="form-control" value="${profile.designation || ''}" placeholder="e.g. Agricultural Officer">
      </div>
      <div class="form-group">
        <label>Head Quarters Location</label>
        <input type="text" id="prof-hq" class="form-control" value="${profile.hq || ''}" placeholder="e.g. Chejerla">
      </div>
      <div class="form-group mb-4">
        <label>HQ Radius Limit (km)</label>
        <input type="number" id="prof-radius" class="form-control" value="${profile.radius || 5}" placeholder="Default: 5">
        <small class="text-muted" style="display:block; margin-top:4px;">Used for report allowance certification</small>
      </div>
      <button id="btn-save-profile" class="btn btn-primary btn-block">
        Save Profile
      </button>
    </div>

    <div class="card mb-4">
      <h3 class="text-h3">Health Goals</h3>
      <div class="form-group">
        <label>Daily Step Target</label>
        <input type="number" id="hs-steps" class="form-control" value="${getHealthSettings().stepTarget}" placeholder="e.g. 10000">
      </div>
      <div class="form-group">
        <label>Daily Water Target (Glasses)</label>
        <input type="number" id="hs-water" class="form-control" value="${getHealthSettings().waterTarget}" placeholder="e.g. 8">
      </div>
      <div class="form-group">
        <label>Glass Size (ml)</label>
        <input type="number" id="hs-glass" class="form-control" value="${getHealthSettings().glassSize}" placeholder="e.g. 250">
      </div>
      <button id="btn-save-health-settings" class="btn btn-primary btn-block">
        Save Health Goals
      </button>
    </div>

    <div class="card mb-4">
      <h3 class="text-h3">App Theme</h3>
      <div class="form-group">
        <label>Select Appearance</label>
        <select id="app-theme" class="form-control">
          <option value="light" ${getAppTheme() === 'light' ? 'selected' : ''}>Light (Default)</option>
          <option value="dark" ${getAppTheme() === 'dark' ? 'selected' : ''}>Dark</option>
          <option value="blue" ${getAppTheme() === 'blue' ? 'selected' : ''}>Blue</option>
          <option value="green" ${getAppTheme() === 'green' ? 'selected' : ''}>Green</option>
        </select>
      </div>
      <button id="btn-save-theme" class="btn btn-primary btn-block">
        Apply Theme
      </button>
    </div>

    <div class="card">
      <h3 class="text-h3">Data Management</h3>
      <p class="text-muted mb-4">All data is stored locally on this device. Clearing data will erase all health and work logs permanently.</p>
      
      <button id="btn-clear-data" class="btn btn-primary btn-block" style="background-color: var(--danger);">
        Clear All Data
      </button>
    </div>

    <!-- Branding Footer -->
    <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
      <p style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 6px;">
        <i class="ph ph-code" style="font-size: 1rem;"></i>
        <span>Developed by <a href="https://psaitechsolutions.com" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 500;">PS AI Tech Solutions</a></span>
      </p>
    </div>
  `;

  document.getElementById('btn-save-profile').addEventListener('click', () => {
    const name = document.getElementById('prof-name').value;
    const desig = document.getElementById('prof-desig').value;
    const hq = document.getElementById('prof-hq').value;
    const radius = document.getElementById('prof-radius').value;
    saveUserProfile(name, desig, hq, radius);
    alert('Profile saved successfully.');
  });

  document.getElementById('btn-save-health-settings').addEventListener('click', () => {
    const steps = document.getElementById('hs-steps').value;
    const water = document.getElementById('hs-water').value;
    const glass = document.getElementById('hs-glass').value;
    saveHealthSettings(steps, water, glass);
    alert('Health goals saved successfully.');
  });

  document.getElementById('btn-save-theme').addEventListener('click', () => {
    const theme = document.getElementById('app-theme').value;
    saveAppTheme(theme);
    document.body.className = `theme-${theme}`;
  });

  document.getElementById('btn-clear-data').addEventListener('click', () => {
    if (confirm("Are you sure you want to permanently delete all health and work data? This cannot be undone.")) {
      clearAllData();
      alert("All data cleared successfully.");
      window.location.hash = '#dashboard';
    }
  });
}
