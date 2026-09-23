// src/webapp/public/app.js
/**
 * Open-Spider Web UI Client
 * Handles SPA navigation, real-time worker fleet tracking, model selection,
 * free/paid model tagging, task dispatch, and settings management.
 */

document.addEventListener('DOMContentLoaded', () => {
  let cachedModels = [];

  // Navigation Tabs
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(tabId) {
    navBtns.forEach((b) => b.classList.remove('active'));
    tabPanes.forEach((p) => p.classList.remove('active'));

    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) targetPane.classList.add('active');

    if (tabId === 'dashboard') loadMiniWorkers();
    if (tabId === 'fleet') loadFleet();
    if (tabId === 'skills') loadSkills();
    if (tabId === 'settings') loadSettings();
    if (tabId === 'history') loadHistory();
    if (tabId === 'ecosystem') loadEcosystem();
    if (tabId === 'health') loadHealth();
  }

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Task Form Dispatch
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const strategySelect = document.getElementById('strategySelect');
  const workerPin = document.getElementById('workerPin');
  const submitBtn = document.getElementById('submitBtn');
  const quickStatus = document.getElementById('quick-status');

  const executionSection = document.getElementById('executionSection');
  const execRunId = document.getElementById('execRunId');
  const planSummary = document.getElementById('planSummary');
  const planContainer = document.getElementById('planContainer');
  const summaryReport = document.getElementById('summaryReport');
  const execStatusBadge = document.getElementById('execStatusBadge');
  const logStream = document.getElementById('logStream');
  const clearLogBtn = document.getElementById('clearLogBtn');

  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', () => {
      logStream.textContent = '';
    });
  }

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const task = taskInput.value.trim();
    if (!task) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Orchestrating...';
    if (quickStatus) quickStatus.textContent = 'Executing company workflow...';

    executionSection.classList.remove('hidden');
    execStatusBadge.textContent = 'Running';
    execStatusBadge.className = 'badge working';
    planContainer.innerHTML = '<div class="placeholder-text">Decomposing goal and coordinating workers...</div>';
    summaryReport.innerHTML = '<div class="placeholder-text">Waiting for worker execution and synthesis...</div>';
    logStream.textContent = 'Starting multi-agent manager run...\n';

    const livePoll = setInterval(() => {
      loadMiniWorkers();
    }, 2000);

    try {
      const payload = {
        task,
        options: {
          strategy: strategySelect.value,
          worker: workerPin.value || undefined
        }
      };

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      clearInterval(livePoll);
      loadMiniWorkers();

      if (!res.ok) {
        throw new Error(data.error || 'Execution failed');
      }

      execRunId.textContent = data.runId || 'N/A';
      execStatusBadge.textContent = 'Completed';
      execStatusBadge.className = 'badge success';

      if (data.plan) {
        planSummary.textContent = data.plan.summary || 'Plan Decomposed';
        renderPlan(data.plan.tasks || []);
      }

      if (data.report) {
        summaryReport.textContent = data.report;
      }

      if (data.runId) {
        fetchLogs(data.runId);
      }

      if (quickStatus) quickStatus.textContent = 'Team task completed successfully';
    } catch (err) {
      clearInterval(livePoll);
      loadMiniWorkers();
      execStatusBadge.textContent = 'Failed';
      execStatusBadge.className = 'badge failed';
      summaryReport.textContent = `Error: ${err.message}`;
      if (quickStatus) quickStatus.textContent = `Error: ${err.message}`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">🚀</span> Dispatch to Team';
    }
  });

  function renderPlan(tasks) {
    if (!tasks || tasks.length === 0) {
      planContainer.innerHTML = '<div class="placeholder-text">No subtasks generated</div>';
      return;
    }
    planContainer.innerHTML = tasks.map((t) => `
      <div class="task-item">
        <div class="task-item-header">
          <span class="task-title">${escapeHtml(t.title || t.id)}</span>
          <span class="task-worker-tag">${escapeHtml(t.worker || t.suggested_worker || 'auto')}</span>
        </div>
        <div class="task-desc">${escapeHtml(t.instructions || '')}</div>
      </div>
    `).join('');
  }

  async function fetchLogs(runId) {
    try {
      const res = await fetch(`/api/logs/${runId}`);
      if (res.ok) {
        const text = await res.text();
        logStream.textContent = text;
        logStream.scrollTop = logStream.scrollHeight;
      }
    } catch {}
  }

  // Fetch all models for catalog & dropdowns
  async function fetchModels() {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        cachedModels = data.models || [];
      }
    } catch {}
  }

  // Mini Workers overview on Dashboard
  async function loadMiniWorkers() {
    const grid = document.getElementById('miniWorkersGrid');
    if (!grid) return;
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      const workers = data.workers || [];

      const workingCount = workers.filter((w) => w.status === 'working').length;
      const summaryElem = document.getElementById('fleetStatusSummary');
      if (summaryElem) {
        summaryElem.textContent = workingCount > 0 ? `${workingCount} Worker(s) Active` : 'All Workers Ready (Idle)';
      }

      grid.innerHTML = workers.map((w) => {
        let statusClass = w.status === 'working' ? 'working' : (w.status === 'disabled' ? 'disabled' : (w.status === 'limited' ? 'limited' : 'idle'));
        let statusLabel = w.status === 'working' ? '● Working' : (w.status === 'disabled' ? 'Disabled' : (w.status === 'limited' ? 'Limited' : '● Free / Idle'));
        const tierTag = w.modelTier === 'FREE' ? `<span class="tag-free">[FREE]</span>` : (w.modelTier === 'PAID' ? `<span class="tag-paid">[PAID]</span>` : '');

        return `
          <div class="mini-worker-card">
            <div class="mini-worker-head">
              <strong>${escapeHtml(w.name || w.id)}</strong>
              <span class="status-pill ${statusClass}">${statusLabel}</span>
            </div>
            <div class="mini-worker-model-row">
              <span class="mini-worker-model">${escapeHtml(w.model || 'default')}</span>
              ${tierTag}
            </div>
            ${w.currentTask ? `<div class="mini-worker-task">Task: ${escapeHtml(w.currentTask.taskTitle)}</div>` : `<div class="mini-worker-task">${escapeHtml(w.role || 'Ready')}</div>`}
          </div>
        `;
      }).join('');
    } catch (err) {
      grid.innerHTML = `<div class="placeholder-text">Unable to load worker status: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Full Fleet View
  async function loadFleet() {
    const container = document.getElementById('fleetCardsContainer');
    if (!container) return;
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      const workers = data.workers || [];

      container.innerHTML = workers.map((w) => {
        let statusClass = w.status === 'working' ? 'working' : (w.status === 'disabled' ? 'disabled' : (w.status === 'limited' ? 'limited' : 'idle'));
        let statusLabel = w.status === 'working' ? '● BUSY (WORKING)' : (w.status === 'disabled' ? 'DISABLED' : (w.status === 'limited' ? 'LIMITED (COOLDOWN)' : '● FREE (IDLE)'));
        const tierTag = w.modelTier === 'FREE' ? `<span class="tag-free">[FREE]</span>` : (w.modelTier === 'PAID' ? `<span class="tag-paid">[PAID]</span>` : '');

        return `
          <div class="fleet-card">
            <div class="fleet-card-header">
              <div>
                <div class="fleet-card-title">${escapeHtml(w.name)}</div>
                <div class="fleet-card-role">${escapeHtml(w.role)}</div>
              </div>
              <span class="status-pill ${statusClass}">${statusLabel}</span>
            </div>

            <div class="fleet-card-desc">${escapeHtml(w.description || '')}</div>

            ${w.currentTask ? `
              <div class="fleet-active-box">
                <strong>Current Task:</strong> ${escapeHtml(w.currentTask.taskTitle)}
              </div>
            ` : ''}

            <div class="fleet-meta-row">
              <span>Active Model:</span>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="code-pill">${escapeHtml(w.model || 'default')}</span>
                ${tierTag}
              </div>
            </div>

            <div class="fleet-meta-row">
              <span>CLI Detected:</span>
              <span style="color: ${w.detected ? 'var(--accent-matrix)' : 'var(--text-dim)'}; font-weight: 600;">
                ${w.detected ? `Yes (${escapeHtml(w.version)})` : 'Not on PATH'}
              </span>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = `<div class="placeholder-text">Failed to load fleet: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Settings & Model Selection View
  async function loadSettings() {
    const workerList = document.getElementById('workerSettingsList');
    try {
      await fetchModels();
      const [settingsRes, workersRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/workers')
      ]);
      const settingsData = await settingsRes.json();
      const workersData = await workersRes.json();

      const config = settingsData.config || {};
      const workers = workersData.workers || [];

      // Populate Manager Settings
      const mgrProvInput = document.getElementById('cfgManagerProvider');
      const mgrModelInput = document.getElementById('cfgManagerModel');
      const concurrencyInput = document.getElementById('cfgConcurrency');
      const failoverSelect = document.getElementById('cfgFailover');

      if (mgrProvInput) mgrProvInput.value = config.manager?.provider || 'openrouter';
      if (mgrModelInput) mgrModelInput.value = config.manager?.model || 'google/gemini-2.5-flash';
      if (concurrencyInput) concurrencyInput.value = config.routing?.concurrency || 2;
      if (failoverSelect) failoverSelect.value = config.routing?.failover || 'auto';

      // Build model options (Free First, then Paid)
      const freeModels = cachedModels.filter((m) => m.free);
      const paidModels = cachedModels.filter((m) => !m.free);

      // Populate Worker Models Selectors & Toggles
      if (workerList) {
        workerList.innerHTML = workers.map((w) => {
          const cfgWorker = config.workers?.[w.id] || {};
          const currentModel = cfgWorker.model || w.model || '';
          const isEnabled = cfgWorker.enabled !== false;

          const isKnownOption = cachedModels.some((m) => m.id === currentModel);

          return `
            <div class="settings-worker-row" data-worker-id="${escapeHtml(w.id)}">
              <div class="settings-worker-info">
                <strong>${escapeHtml(w.name)}</strong>
                <span>${escapeHtml(w.role)}</span>
              </div>
              <div class="settings-model-picker">
                <select class="worker-model-select model-select-element">
                  <optgroup label="--- 🟢 FREE TIER MODELS ---">
                    ${freeModels.map((m) => `<option value="${escapeHtml(m.id)}" ${m.id === currentModel ? 'selected' : ''}>[FREE] ${escapeHtml(m.name || m.id)} (${escapeHtml(m.provider)})</option>`).join('')}
                  </optgroup>
                  <optgroup label="--- 🟣 PAID TIER MODELS ---">
                    ${paidModels.map((m) => `<option value="${escapeHtml(m.id)}" ${m.id === currentModel ? 'selected' : ''}>[PAID] ${escapeHtml(m.name || m.id)} (${escapeHtml(m.provider)})</option>`).join('')}
                  </optgroup>
                  <option value="__custom__" ${!isKnownOption && currentModel ? 'selected' : ''}>✏️ Custom Model Identifier...</option>
                </select>
                <input type="text" class="worker-model-input model-custom-input ${isKnownOption || !currentModel ? 'hidden' : ''}" value="${escapeHtml(currentModel)}" placeholder="Enter custom model ID (e.g. gpt-4o)" />
              </div>
              <div>
                <label class="settings-toggle">
                  <input type="checkbox" class="worker-enable-check" ${isEnabled ? 'checked' : ''} />
                  <span>Enabled</span>
                </label>
              </div>
            </div>
          `;
        }).join('');

        // Wire change listeners on selects
        document.querySelectorAll('.worker-model-select').forEach((sel) => {
          sel.addEventListener('change', (e) => {
            const row = e.target.closest('.settings-worker-row');
            const customInput = row.querySelector('.worker-model-input');
            if (e.target.value === '__custom__') {
              customInput.classList.remove('hidden');
              customInput.focus();
            } else {
              customInput.classList.add('hidden');
              customInput.value = e.target.value;
            }
          });
        });
      }

      // Populate Master Models Catalog Table
      renderModelsCatalog();
    } catch (err) {
      if (workerList) workerList.innerHTML = `<div class="placeholder-text">Failed to load settings: ${escapeHtml(err.message)}</div>`;
    }
  }

  function renderModelsCatalog() {
    const statsElem = document.getElementById('catalogStats');
    const tbody = document.getElementById('modelsCatalogBody');
    if (!tbody) return;

    const freeCount = cachedModels.filter((m) => m.free).length;
    const paidCount = cachedModels.filter((m) => !m.free).length;
    if (statsElem) {
      statsElem.textContent = `${freeCount} Free Models • ${paidCount} Paid Models`;
      statsElem.className = 'badge matrix';
    }

    tbody.innerHTML = cachedModels.map((m) => `
      <tr>
        <td><span class="code-pill">${escapeHtml(m.id)}</span></td>
        <td>${escapeHtml(m.name)}</td>
        <td>${escapeHtml(m.providerName || m.provider)}</td>
        <td>${m.free ? '<span class="tag-free">[FREE]</span>' : '<span class="tag-paid">[PAID]</span>'}</td>
      </tr>
    `).join('');
  }

  // Save Settings
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const workerRows = document.querySelectorAll('.settings-worker-row');
      const workersConfig = {};

      workerRows.forEach((row) => {
        const workerId = row.getAttribute('data-worker-id');
        const modelSelect = row.querySelector('.worker-model-select');
        const modelInput = row.querySelector('.worker-model-input');
        const checkInput = row.querySelector('.worker-enable-check');
        if (workerId) {
          let selectedModel = modelSelect ? modelSelect.value : '';
          if (selectedModel === '__custom__' && modelInput) {
            selectedModel = modelInput.value.trim();
          }
          workersConfig[workerId] = {
            model: selectedModel,
            enabled: checkInput ? checkInput.checked : true
          };
        }
      });

      const mgrProvInput = document.getElementById('cfgManagerProvider');
      const mgrModelInput = document.getElementById('cfgManagerModel');
      const concurrencyInput = document.getElementById('cfgConcurrency');
      const failoverSelect = document.getElementById('cfgFailover');

      const payload = {
        manager: {
          provider: mgrProvInput ? mgrProvInput.value.trim() : undefined,
          model: mgrModelInput ? mgrModelInput.value.trim() : undefined
        },
        routing: {
          concurrency: concurrencyInput ? parseInt(concurrencyInput.value, 10) : 2,
          failover: failoverSelect ? failoverSelect.value : 'auto'
        },
        workers: workersConfig
      };

      try {
        saveSettingsBtn.disabled = true;
        saveSettingsBtn.textContent = 'Saving...';
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Settings saved successfully!');
          loadMiniWorkers();
        } else {
          showToast('Failed to save settings', true);
        }
      } catch (err) {
        showToast(`Error: ${err.message}`, true);
      } finally {
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.textContent = '💾 Save Settings';
      }
    });
  }

  function showToast(msg, isError = false) {
    const toast = document.getElementById('settingsToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = isError ? 'var(--accent-fail)' : 'var(--accent-matrix)';
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // History loader
  async function loadHistory() {
    const tbody = document.getElementById('runsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading runs...</td></tr>';
    try {
      const res = await fetch('/api/runs');
      const data = await res.json();
      const runs = data.runs || [];
      if (runs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No runs recorded yet.</td></tr>';
        return;
      }
      tbody.innerHTML = runs.map((r) => `
        <tr>
          <td><span class="code-pill">${escapeHtml(r.id)}</span></td>
          <td>${escapeHtml(r.goal || '')}</td>
          <td><span class="badge ${r.status === 'completed' ? 'success' : 'failed'}">${escapeHtml(r.status || 'unknown')}</span></td>
          <td>${new Date(r.createdAt).toLocaleString()}</td>
          <td>
            <button class="btn small-btn view-run-btn" data-id="${escapeHtml(r.id)}">Inspect</button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.view-run-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const runId = btn.getAttribute('data-id');
          inspectRun(runId);
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center">Failed to load runs: ${escapeHtml(err.message)}</td></tr>`;
    }
  }

  async function inspectRun(runId) {
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) return;
      const data = await res.json();
      
      switchTab('dashboard');
      executionSection.classList.remove('hidden');
      execRunId.textContent = data.id;
      execStatusBadge.textContent = data.status || 'completed';
      execStatusBadge.className = `badge ${data.status === 'completed' ? 'success' : 'failed'}`;

      if (data.plan) {
        planSummary.textContent = data.plan.summary || '';
        renderPlan(data.plan.tasks || []);
      }
      if (data.summary) {
        summaryReport.textContent = data.summary;
      }
      fetchLogs(runId);
    } catch {}
  }

  // Ecosystem loader
  async function loadEcosystem() {
    const mcpList = document.getElementById('mcpList');
    const pluginList = document.getElementById('pluginList');

    try {
      const [mcpRes, pluginRes] = await Promise.all([
        fetch('/api/mcp'),
        fetch('/api/plugins')
      ]);
      const mcpData = await mcpRes.json();
      const pluginData = await pluginRes.json();

      const servers = mcpData.servers || [];
      if (servers.length === 0) {
        mcpList.innerHTML = '<div class="placeholder-text">No external MCP servers configured</div>';
      } else {
        mcpList.innerHTML = servers.map((s) => `
          <div class="eco-item">
            <strong>${escapeHtml(s.id)}</strong>
            <span class="code-pill">${escapeHtml(s.url || '')}</span>
          </div>
        `).join('');
      }

      const plugins = pluginData.plugins || [];
      if (plugins.length === 0) {
        pluginList.innerHTML = '<div class="placeholder-text">No custom plugins installed</div>';
      } else {
        pluginList.innerHTML = plugins.map((p) => `
          <div class="eco-item">
            <strong>${escapeHtml(p)}</strong>
            <span class="badge matrix">Installed</span>
          </div>
        `).join('');
      }
    } catch (err) {
      mcpList.innerHTML = `<div class="placeholder-text">Error loading ecosystem: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Health loader
  async function loadHealth() {
    const grid = document.getElementById('workerHealthGrid');
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const workerHealth = data.workerHealth || {};
      const workers = data.workers || [];

      grid.innerHTML = workers.map((w) => {
        const info = workerHealth[w.id] || { status: 'healthy', lastChecked: null };
        const statusClass = `status-${info.status || 'healthy'}`;
        const tierTag = w.modelTier === 'FREE' ? `[FREE]` : (w.modelTier === 'PAID' ? `[PAID]` : '');
        return `
          <div class="health-card">
            <div class="health-card-header">
              <strong>${escapeHtml(w.name || w.id)}</strong>
              <div class="health-status-dot ${statusClass}"></div>
            </div>
            <div class="subtitle" style="font-size: 0.8rem;">Health: ${escapeHtml(info.status || 'healthy')}</div>
            <div class="subtitle" style="font-size: 0.8rem;">Model: ${escapeHtml(w.model || 'default')} ${tierTag}</div>
            ${info.lastError ? `<div style="font-size: 0.75rem; color: var(--accent-fail); margin-top: 0.25rem;">Last error: ${escapeHtml(info.lastError)}</div>` : ''}
          </div>
        `;
      }).join('');
    } catch (err) {
      grid.innerHTML = `<div class="placeholder-text">Error loading health: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Skills & Self-Learning System
  let cachedSkills = [];

  async function loadSkills() {
    const container = document.getElementById('skillsCardsContainer');
    const badge = document.getElementById('skillsCountBadge');
    if (!container) return;

    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      cachedSkills = data.skills || [];
      renderSkills(cachedSkills);
    } catch (err) {
      container.innerHTML = `<div class="placeholder-text">Failed to load skills: ${escapeHtml(err.message)}</div>`;
    }
  }

  function renderSkills(skillsList) {
    const container = document.getElementById('skillsCardsContainer');
    const badge = document.getElementById('skillsCountBadge');
    if (!container) return;

    if (badge) {
      badge.textContent = `${skillsList.length} Active Skills`;
    }

    if (skillsList.length === 0) {
      container.innerHTML = `<div class="placeholder-text">No skills found matching your search.</div>`;
      return;
    }

    container.innerHTML = skillsList.map((s) => {
      let sourceBadgeClass = 'matrix';
      let sourceLabel = 'Builtin';
      if (s.source === 'hermes') {
        sourceBadgeClass = 'cyan';
        sourceLabel = 'Hermes Replicated';
      } else if (s.source === 'self-learned') {
        sourceBadgeClass = 'success';
        sourceLabel = 'Self-Learned';
      }

      const tagsHtml = (s.tags || []).map((t) => `<span class="skill-tag">#${escapeHtml(t)}</span>`).join('');

      return `
        <div class="skill-card">
          <div class="skill-card-header">
            <h3 class="skill-title">${escapeHtml(s.name)}</h3>
            <span class="badge ${sourceBadgeClass}">${sourceLabel}</span>
          </div>
          <p class="skill-desc">${escapeHtml(s.description || 'No description provided')}</p>
          <div class="skill-tags-row">${tagsHtml}</div>
          <div class="skill-card-actions">
            <button class="btn small-btn view-skill-btn" data-id="${escapeHtml(s.id)}">📖 View Instructions</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to view skill detail buttons
    document.querySelectorAll('.view-skill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const skill = cachedSkills.find((s) => s.id === id);
        if (skill) openViewSkillModal(skill);
      });
    });
  }

  // Filter skills by search query
  const skillsSearchInput = document.getElementById('skillsSearchInput');
  if (skillsSearchInput) {
    skillsSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderSkills(cachedSkills);
        return;
      }
      const filtered = cachedSkills.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(q))) ||
        (s.instructions && s.instructions.toLowerCase().includes(q))
      );
      renderSkills(filtered);
    });
  }

  // Import Hermes Skills
  const importHermesBtn = document.getElementById('importHermesBtn');
  if (importHermesBtn) {
    importHermesBtn.addEventListener('click', async () => {
      try {
        importHermesBtn.disabled = true;
        importHermesBtn.innerHTML = '⏳ Importing...';
        const res = await fetch('/api/skills/import-hermes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`Successfully imported ${data.count || 0} skill(s) from Hermes!`);
          loadSkills();
        } else {
          showToast(data.error || 'Failed to import Hermes skills', true);
        }
      } catch (err) {
        showToast(`Import error: ${err.message}`, true);
      } finally {
        importHermesBtn.disabled = false;
        importHermesBtn.innerHTML = '📥 Import Hermes Skills';
      }
    });
  }

  // Learn Skill Modal
  const learnModal = document.getElementById('learnSkillModal');
  const openLearnModalBtn = document.getElementById('openLearnModalBtn');
  const closeLearnModalBtn = document.getElementById('closeLearnModalBtn');
  const cancelLearnBtn = document.getElementById('cancelLearnBtn');
  const learnSkillForm = document.getElementById('learnSkillForm');

  if (openLearnModalBtn) {
    openLearnModalBtn.addEventListener('click', () => {
      if (learnModal) learnModal.classList.remove('hidden');
    });
  }

  function closeLearnModal() {
    if (learnModal) learnModal.classList.add('hidden');
    if (learnSkillForm) learnSkillForm.reset();
  }

  if (closeLearnModalBtn) closeLearnModalBtn.addEventListener('click', closeLearnModal);
  if (cancelLearnBtn) cancelLearnBtn.addEventListener('click', closeLearnModal);

  if (learnSkillForm) {
    learnSkillForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('skillNameInput').value.trim();
      const description = document.getElementById('skillDescInput').value.trim();
      const tagsStr = document.getElementById('skillTagsInput').value.trim();
      const instructions = document.getElementById('skillInstructionsInput').value.trim();

      if (!name || !instructions) return;

      const tags = tagsStr ? tagsStr.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : ['learned'];

      try {
        const res = await fetch('/api/skills/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, tags, instructions, learnedFrom: 'self-learned' })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`Skill [${name}] learned and indexed!`);
          closeLearnModal();
          loadSkills();
        } else {
          showToast(data.error || 'Failed to record skill', true);
        }
      } catch (err) {
        showToast(`Error: ${err.message}`, true);
      }
    });
  }

  // View Skill Details Modal
  const viewModal = document.getElementById('viewSkillModal');
  const closeViewModalBtn = document.getElementById('closeViewSkillModalBtn');

  function openViewSkillModal(skill) {
    if (!viewModal) return;
    document.getElementById('viewSkillTitle').textContent = skill.name;
    const srcElem = document.getElementById('viewSkillSource');
    srcElem.textContent = skill.source || 'builtin';
    srcElem.className = `badge ${skill.source === 'hermes' ? 'cyan' : (skill.source === 'self-learned' ? 'success' : 'matrix')}`;

    const tagsElem = document.getElementById('viewSkillTags');
    tagsElem.innerHTML = (skill.tags || []).map((t) => `<span class="skill-tag">#${escapeHtml(t)}</span>`).join(' ');

    document.getElementById('viewSkillDesc').textContent = skill.description || '';
    document.getElementById('viewSkillInstructions').textContent = skill.instructions || 'No instructions';

    viewModal.classList.remove('hidden');
  }

  if (closeViewModalBtn) {
    closeViewModalBtn.addEventListener('click', () => {
      if (viewModal) viewModal.classList.add('hidden');
    });
  }

  // Refresh buttons
  const refreshRunsBtn = document.getElementById('refreshRunsBtn');
  if (refreshRunsBtn) refreshRunsBtn.addEventListener('click', loadHistory);

  const refreshFleetBtn = document.getElementById('refreshFleetBtn');
  if (refreshFleetBtn) refreshFleetBtn.addEventListener('click', loadFleet);

  const refreshWorkersMiniBtn = document.getElementById('refreshWorkersMiniBtn');
  if (refreshWorkersMiniBtn) refreshWorkersMiniBtn.addEventListener('click', loadMiniWorkers);

  const refreshEcosystemBtn = document.getElementById('refreshEcosystemBtn');
  if (refreshEcosystemBtn) refreshEcosystemBtn.addEventListener('click', loadEcosystem);

  const refreshHealthBtn = document.getElementById('refreshHealthBtn');
  if (refreshHealthBtn) refreshHealthBtn.addEventListener('click', loadHealth);

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial load
  loadMiniWorkers();
});
