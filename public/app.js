'use strict';

(() => {
  const $ = selector => document.querySelector(selector);
  const form = $('#plannerForm');
  const generateButton = $('#generateButton');
  const generateLabel = $('#generateLabel');
  const formError = $('#formError');
  const resultsSection = $('#resultsSection');
  const toast = $('#toast');
  const STORAGE_KEY = 'gatherly-ai-saved-plans-v1';
  const COLOR_ROTATION = ['#cc9d8d', '#aab6a0', '#b9addb', '#d7c16f', '#8eacc9'];
  let currentPlan = null;
  let toastTimeout = null;

  $('#year').textContent = String(new Date().getFullYear());
  setMinimumDate();
  renderSavedPlans();
  refreshAiStatus();

  function setMinimumDate() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    $('#date').min = localDate;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function readSavedPlans() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter(item => item && item.id && item.input && item.plan) : [];
    } catch {
      return [];
    }
  }

  function writeSavedPlans(plans) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      return true;
    } catch {
      showToast('Browser storage is full or unavailable. Export your plan instead.');
      return false;
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove('show'), 2800);
  }

  async function refreshAiStatus() {
    const dot = $('#statusDot');
    const label = $('#statusLabel');
    try {
      const response = await fetch('/api/status', { cache: 'no-store' });
      const data = await response.json();
      if (data.aiConfigured) {
        dot.classList.add('live');
        label.textContent = 'Gemini AI ready';
        label.title = `Live AI model: ${data.model}`;
      } else {
        dot.classList.remove('live');
        label.textContent = 'Demo mode';
        label.title = 'Add GEMINI_API_KEY to your .env file to enable live AI.';
      }
    } catch {
      dot.classList.remove('live');
      label.textContent = 'Local mode';
      label.title = 'The server status could not be checked.';
    }
  }

  function getFormData() {
    const data = new FormData(form);
    return {
      eventName: String(data.get('eventName') || '').trim(),
      eventType: String(data.get('eventType') || 'Birthday'),
      date: String(data.get('date') || ''),
      location: String(data.get('location') || '').trim() || 'Location not decided',
      budget: Number(data.get('budget')),
      currency: String(data.get('currency') || 'INR'),
      guests: Number(data.get('guests')),
      vibe: String(data.get('vibe') || 'Warm and memorable'),
      duration: String(data.get('duration') || '4 hours'),
      priorities: String(data.get('priorities') || '').trim() || 'Stay within budget and make guests feel included',
      preferences: String(data.get('preferences') || '').trim() || 'No special requirements'
    };
  }

  function validateInput(input) {
    if (!input.eventName) return 'Add a name for your event before creating a plan.';
    if (!Number.isFinite(input.budget) || input.budget < 100 || input.budget > 1000000000) return 'Budget must be between 100 and 1,000,000,000.';
    if (!Number.isFinite(input.guests) || input.guests < 1 || input.guests > 10000) return 'Guest count must be between 1 and 10,000.';
    return '';
  }

  function setLoading(isLoading) {
    generateButton.disabled = isLoading;
    generateButton.style.opacity = isLoading ? '.76' : '1';
    if (isLoading) {
      generateLabel.textContent = 'Putting your plan together…';
      $('.button-sparkle').classList.add('loading-spinner');
      $('.button-sparkle').textContent = '';
      $('#generateButton .button-arrow').style.display = 'none';
    } else {
      generateLabel.textContent = 'Create my event plan';
      $('.button-sparkle').classList.remove('loading-spinner');
      $('.button-sparkle').textContent = '✦';
      $('#generateButton .button-arrow').style.display = '';
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    formError.hidden = true;
    const input = getFormData();
    const validationMessage = validateInput(input);
    if (validationMessage) {
      formError.textContent = validationMessage;
      formError.hidden = false;
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not create your plan. Check the details and try again.');
      currentPlan = { id: null, createdAt: new Date().toISOString(), input, plan: data };
      renderPlan(currentPlan);
      resultsSection.hidden = false;
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      formError.textContent = error.message || 'Could not connect to the local server. Start the app with npm start and try again.';
      formError.hidden = false;
      showToast('Your plan could not be generated.');
    } finally {
      setLoading(false);
    }
  });

  function money(value, currency) {
    const number = Number(value) || 0;
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(number);
    } catch {
      return `${currency || ''} ${Math.round(number).toLocaleString('en-IN')}`.trim();
    }
  }

  function renderPlan(record) {
    const { input, plan } = record;
    $('#resultTitle').textContent = plan.title || input.eventName;
    $('#resultTagline').textContent = plan.tagline || `${input.eventType} · ${input.guests} guests`;
    $('#resultSummary').textContent = plan.summary || 'Your event blueprint is ready.';
    $('#statBudget').textContent = money(input.budget, input.currency);
    $('#statGuests').textContent = Number(input.guests).toLocaleString('en-IN');
    $('#statDuration').textContent = input.duration;
    $('#budgetTotal').textContent = money(input.budget, input.currency);
    $('#planNoticeText').textContent = plan.notice || (plan.mode === 'ai' ? 'Generated with Gemini AI. Budget allocations are estimates.' : 'Built-in demo plan. Add a Gemini API key to generate a live AI plan.');
    $('#savePlanButton').textContent = record.id ? '✓ Saved plan' : '♡ Save plan';
    renderBudget(plan.budgetPlan || [], input);
    renderIdeas(plan.personalizedIdeas || []);
    renderSavingTips(plan.savingTips || []);
    renderTimeline(plan.eventDayTimeline || []);
    renderMilestones(plan.milestones || []);
    renderVendors(plan.vendorChecklist || []);
    renderChecklist(plan.checklist || []);
  }

  function renderBudget(rows, input) {
    const total = Number(input.budget) || 1;
    $('#budgetBars').innerHTML = rows.map((row, index) => {
      const amount = Math.max(0, Number(row.amount) || 0);
      const percent = Math.max(0, Math.min(100, amount / total * 100));
      const statedPercent = Number.isFinite(Number(row.percent)) ? Math.max(0, Math.min(100, Math.round(Number(row.percent)))) : Math.round(percent);
      return `<div class="budget-row">
        <div class="budget-row-head"><strong>${escapeHtml(row.category || 'Other costs')}</strong><span>${money(amount, input.currency)}</span></div>
        <div class="budget-row-foot"><span>${escapeHtml(row.tip || '')}</span><span>${statedPercent}%</span></div>
        <div class="budget-track"><span style="width:${percent}%;background:${COLOR_ROTATION[index % COLOR_ROTATION.length]}"></span></div>
      </div>`;
    }).join('') || '<p class="tiny-note">Budget categories will appear here after the plan is created.</p>';
  }

  function renderIdeas(ideas) {
    $('#ideasList').innerHTML = ideas.map((idea, index) => `<article class="idea-item"><span class="idea-bullet">${['✦', '♡', '✧'][index % 3]}</span><div><h4>${escapeHtml(idea.title)}</h4><p>${escapeHtml(idea.description)}</p><span class="idea-cost">Estimated cost: ${escapeHtml(idea.estimatedCost || 'Confirm locally')}</span></div></article>`).join('') || '<p class="tiny-note">Personalized ideas will appear here.</p>';
  }

  function renderSavingTips(tips) {
    $('#savingTips').innerHTML = tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('') || '<li>Get itemized quotes and keep a contingency reserve.</li>';
  }

  function renderTimeline(rows) {
    $('#eventTimeline').innerHTML = rows.map(row => `<div class="timeline-item"><div class="timeline-time">${escapeHtml(row.time)}</div><div class="timeline-content"><strong>${escapeHtml(row.activity)}</strong><p>${escapeHtml(row.details)}</p></div></div>`).join('') || '<p class="tiny-note">Your event-day timeline will appear here.</p>';
  }

  function renderMilestones(rows) {
    $('#milestonesList').innerHTML = rows.map(row => `<div class="milestone-item"><span class="milestone-marker"></span><div><strong>${escapeHtml(row.when)}</strong><p>${escapeHtml(row.task)}</p></div></div>`).join('') || '<p class="tiny-note">Add a few milestones before the event day.</p>';
  }

  function renderVendors(groups) {
    $('#vendorList').innerHTML = groups.map(group => `<section class="vendor-group"><div class="vendor-head"><h4>${escapeHtml(group.vendor)}</h4><span class="priority-pill">${escapeHtml(group.priority || 'Confirm early')}</span></div><ul>${(group.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`).join('') || '<p class="tiny-note">Supplier prompts will appear here.</p>';
  }

  function renderChecklist(tasks) {
    $('#taskList').innerHTML = tasks.map((task, index) => `<label class="task-item ${task.done ? 'checked' : ''}"><input type="checkbox" data-task-index="${index}" ${task.done ? 'checked' : ''}><span class="custom-check" aria-hidden="true">✓</span><span class="task-text">${escapeHtml(task.task)}</span></label>`).join('') || '<p class="tiny-note">Your action list will appear here.</p>';
    updateChecklistProgress();
  }

  function updateChecklistProgress() {
    if (!currentPlan) return;
    const tasks = currentPlan.plan.checklist || [];
    const completed = tasks.filter(task => task.done).length;
    const percent = tasks.length ? completed / tasks.length * 100 : 0;
    $('#checklistProgressBar').style.width = `${percent}%`;
    $('#checklistProgressText').textContent = `${completed} of ${tasks.length} complete`;
  }

  $('#taskList').addEventListener('change', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return;
    if (!currentPlan) return;
    const index = Number(input.dataset.taskIndex);
    const task = currentPlan.plan.checklist?.[index];
    if (!task) return;
    task.done = input.checked;
    input.closest('.task-item').classList.toggle('checked', input.checked);
    updateChecklistProgress();
    const saved = readSavedPlans();
    const savedIndex = saved.findIndex(item => item.id === currentPlan.id);
    if (savedIndex >= 0) {
      saved[savedIndex].plan = currentPlan.plan;
      writeSavedPlans(saved);
    }
  });

  $('#savePlanButton').addEventListener('click', () => {
    if (!currentPlan) return;
    const saved = readSavedPlans();
    if (!currentPlan.id) currentPlan.id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    currentPlan.updatedAt = new Date().toISOString();
    const index = saved.findIndex(item => item.id === currentPlan.id);
    if (index >= 0) saved[index] = currentPlan;
    else saved.unshift(currentPlan);
    const limited = saved.slice(0, 12);
    if (writeSavedPlans(limited)) {
      $('#savePlanButton').textContent = '✓ Saved plan';
      renderSavedPlans();
      showToast('Plan saved in this browser.');
    }
  });

  function renderSavedPlans() {
    const saved = readSavedPlans();
    $('#savedCount').textContent = String(saved.length);
    $('#savedEmpty').hidden = saved.length > 0;
    $('#savedList').innerHTML = saved.map(item => {
      const date = item.updatedAt || item.createdAt;
      const dateLabel = date && !Number.isNaN(new Date(date).getTime()) ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Saved';
      return `<div class="saved-item"><button type="button" class="saved-item-main" data-load-plan="${escapeHtml(item.id)}"><strong>${escapeHtml(item.plan.title || item.input.eventName)}</strong><span>${escapeHtml(item.input.eventType)} · ${dateLabel}</span></button><button type="button" class="saved-delete" data-delete-plan="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.plan.title || item.input.eventName)}" title="Delete plan">×</button></div>`;
    }).join('');
  }

  $('#savedList').addEventListener('click', event => {
    const loadButton = event.target.closest('[data-load-plan]');
    const deleteButton = event.target.closest('[data-delete-plan]');
    if (deleteButton) {
      const id = deleteButton.dataset.deletePlan;
      const saved = readSavedPlans().filter(item => item.id !== id);
      if (writeSavedPlans(saved)) {
        if (currentPlan?.id === id) {
          currentPlan.id = null;
          $('#savePlanButton').textContent = '♡ Save plan';
        }
        renderSavedPlans();
        showToast('Saved plan deleted.');
      }
      return;
    }
    if (loadButton) {
      const record = readSavedPlans().find(item => item.id === loadButton.dataset.loadPlan);
      if (!record) return;
      currentPlan = record;
      form.elements.eventName.value = record.input.eventName || '';
      form.elements.eventType.value = record.input.eventType || 'Birthday';
      form.elements.date.value = record.input.date || '';
      form.elements.location.value = record.input.location === 'Location not decided' ? '' : record.input.location || '';
      form.elements.budget.value = record.input.budget || 50000;
      form.elements.currency.value = record.input.currency || 'INR';
      form.elements.guests.value = record.input.guests || 40;
      form.elements.vibe.value = record.input.vibe || 'Warm and memorable';
      form.elements.duration.value = record.input.duration || '4 hours';
      form.elements.priorities.value = record.input.priorities || '';
      form.elements.preferences.value = record.input.preferences === 'No special requirements' ? '' : record.input.preferences || '';
      renderPlan(currentPlan);
      resultsSection.hidden = false;
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Saved plan loaded.');
    }
  });

  $('#clearSaved').addEventListener('click', () => {
    const saved = readSavedPlans();
    if (!saved.length) {
      showToast('There are no saved plans to clear.');
      return;
    }
    if (!window.confirm('Delete all saved plans from this browser?')) return;
    if (writeSavedPlans([])) {
      if (currentPlan) {
        currentPlan.id = null;
        $('#savePlanButton').textContent = '♡ Save plan';
      }
      renderSavedPlans();
      showToast('All saved plans cleared.');
    }
  });

  $('#exportPlanButton').addEventListener('click', () => {
    if (!currentPlan) return;
    const text = buildMarkdown(currentPlan);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const safeName = (currentPlan.plan.title || 'gatherly-event-plan').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'gatherly-event-plan';
    anchor.href = url;
    anchor.download = `${safeName}-plan.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast('Plan exported as a Markdown file.');
  });

  function buildMarkdown(record) {
    const { input, plan } = record;
    const lines = [
      `# ${plan.title || input.eventName}`,
      '',
      `_${plan.tagline || input.eventType}_`,
      '',
      `**Date:** ${input.date || 'To be decided'}  `,
      `**Location:** ${input.location}  `,
      `**Budget:** ${money(input.budget, input.currency)}  `,
      `**Guests:** ${input.guests}  `,
      `**Duration:** ${input.duration}`, '',
      '## Overview', '', plan.summary || '', '',
      '## Budget breakdown', '',
      '| Category | Planning amount | Share |', '|---|---:|---:|'
    ];
    for (const row of plan.budgetPlan || []) lines.push(`| ${row.category} | ${money(row.amount, input.currency)} | ${row.percent ?? ''}% |`);
    lines.push('', '## Event-day timeline', '');
    for (const item of plan.eventDayTimeline || []) lines.push(`- **${item.time} — ${item.activity}:** ${item.details}`);
    lines.push('', '## Before the big day', '');
    for (const item of plan.milestones || []) lines.push(`- **${item.when}:** ${item.task}`);
    lines.push('', '## Vendor checklist', '');
    for (const group of plan.vendorChecklist || []) {
      lines.push(`### ${group.vendor} — ${group.priority || 'Confirm early'}`);
      for (const item of group.items || []) lines.push(`- [ ] ${item}`);
      lines.push('');
    }
    lines.push('## Personalized ideas', '');
    for (const idea of plan.personalizedIdeas || []) lines.push(`- **${idea.title}** (${idea.estimatedCost || 'cost to confirm'}): ${idea.description}`);
    lines.push('', '## Planning checklist', '');
    for (const task of plan.checklist || []) lines.push(`- [${task.done ? 'x' : ' '}] ${task.task}`);
    lines.push('', '## Saving tips', '');
    for (const tip of plan.savingTips || []) lines.push(`- ${tip}`);
    lines.push('', '---', `Generated by Gatherly AI (${plan.mode === 'ai' ? 'Gemini AI' : 'Demo mode'}). Budget amounts are planning estimates, not vendor quotes.`, '');
    return lines.join('\n');
  }

  $('#backToForm').addEventListener('click', () => {
    $('#planner').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#eventName').focus({ preventScroll: true });
  });

  $('#jumpToPlanner').addEventListener('click', () => $('#planner').scrollIntoView({ behavior: 'smooth', block: 'start' }));
})();
