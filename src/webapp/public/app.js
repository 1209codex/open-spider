// src/webapp/public/app.js

/**
 * Open-Spider Web UI Client
 * Handles SPA navigation, real-time log polling, task dispatch, history, and ecosystem views.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      navBtns.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`tab-${tabId}`);
      if (targetPane) targetPane.classList.add('active');

      if (tabId === 'history') loadHistory();
      if (tabId === 'ecosystem') loadEcosystem();
      if (tabId === 'health') loadHealth();
    });
  });

  // Task Form Dispatch
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const strategySelect = document.getElementById('strategySelect');
  const workerPin = document.getElementById('workerPin');
  const submitBtn = document.getElementById('submitBtn');
  const quickStatus = document.getElementById('quickStatus') || document.getElementById('quick-status');

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
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Running...';
    if (quickStatus) quickStatus.textContent = 'Executing task...';

    executionSection.classList.remove('hidden');
    execStatusBadge.textContent = 'Running';
    execStatusBadge.className = 'badge matrix';
    planContainer.innerHTML = '<div class="placeholder-text">Planning and decomposing goal...</div>';
    summaryReport.innerHTML = '<div class="placeholder-text">Waiting for worker execution...</div>';
    logStream.textContent = 'Starting manager run...\n';

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

      if (!res.ok) {
        throw new Error(data.error || 'Execution failed');
      }

      // Populate Run UI
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

      // Fetch latest logs
      if (data.runId) {
        fetchLogs(data.runId);
      }

      if (quickStatus) quickStatus.textContent = 'Task completed successfully';
    } catch (err) {
      execStatusBadge.textContent = 'Failed';
      execStatusBadge.className = 'badge failed';
      summaryReport.textContent = `Error: ${err.message}`;
      if (quickStatus) quickStatus.textContent = `Error: ${err.message}`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">🚀</span> Dispatch Task';
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
          <span class="task-worker-tag">${escapeHtml(t.suggested_worker || t.worker || 'auto')}</span>
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
    } catch {
      // Ignore
    }
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
      
      // Switch to dashboard tab
      document.querySelector('[data-tab="dashboard"]').click();
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
    } catch {
      // Ignore
    }
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
      const workers = ['codex', 'opencode', 'hermes', 'antigravity', 'custom'];

      grid.innerHTML = workers.map((w) => {
        const info = workerHealth[w] || { status: 'healthy', lastChecked: null };
        const statusClass = `status-${info.status || 'healthy'}`;
        return `
          <div class="health-card">
            <div class="health-card-header">
              <strong>${escapeHtml(w)}</strong>
              <div class="health-status-dot ${statusClass}"></div>
            </div>
            <div class="subtitle" style="font-size: 0.8rem;">Status: ${escapeHtml(info.status || 'healthy')}</div>
            ${info.lastError ? `<div style="font-size: 0.75rem; color: var(--accent-fail); margin-top: 0.25rem;">Last error: ${escapeHtml(info.lastError)}</div>` : ''}
          </div>
        `;
      }).join('');
    } catch (err) {
      grid.innerHTML = `<div class="placeholder-text">Error loading health: ${escapeHtml(err.message)}</div>`;
    }
  }

  // Refresh buttons
  const refreshRunsBtn = document.getElementById('refreshRunsBtn');
  if (refreshRunsBtn) refreshRunsBtn.addEventListener('click', loadHistory);

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
});
