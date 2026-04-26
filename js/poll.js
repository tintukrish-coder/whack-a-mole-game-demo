// Poll state keys
const STORAGE_KEY = 'timedPoll_state';

// ── Helpers ──────────────────────────────────────────────────────────────────

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch { return null; }
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── DOM refs ─────────────────────────────────────────────────────────────────

const views = {
  setup: document.getElementById('view-setup'),
  vote: document.getElementById('view-vote'),
  results: document.getElementById('view-results'),
};

const els = {
  question: document.getElementById('poll-question'),
  optionsList: document.getElementById('options-list'),
  btnAddOption: document.getElementById('btn-add-option'),
  durationMin: document.getElementById('duration-min'),
  durationSec: document.getElementById('duration-sec'),
  btnStart: document.getElementById('btn-start'),

  voteQuestion: document.getElementById('vote-question'),
  voteOptionsList: document.getElementById('vote-options-list'),
  timerDisplay: document.getElementById('timer-display'),
  timerArc: document.getElementById('timer-arc'),
  btnVote: document.getElementById('btn-vote'),
  votedIndicator: document.getElementById('voted-indicator'),
  btnResetSetup: document.getElementById('btn-reset-setup'),

  resultsQuestion: document.getElementById('results-question'),
  resultBars: document.getElementById('result-bars'),
  totalVotesLabel: document.getElementById('total-votes-label'),
  btnNewPoll: document.getElementById('btn-new-poll'),
};

// ── Option rows (setup) ───────────────────────────────────────────────────────

function renderOptionInputs(options) {
  els.optionsList.innerHTML = '';
  options.forEach((val, i) => {
    const row = document.createElement('div');
    row.className = 'option-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = val;
    input.placeholder = `Option ${i + 1}`;
    input.maxLength = 100;
    input.addEventListener('input', () => { options[i] = input.value; });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-icon';
    removeBtn.title = 'Remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      if (options.length <= 2) return; // minimum 2
      options.splice(i, 1);
      renderOptionInputs(options);
    });

    row.appendChild(input);
    row.appendChild(removeBtn);
    els.optionsList.appendChild(row);
  });
  els.btnAddOption.style.display = options.length >= 6 ? 'none' : '';
}

// ── Show / hide views ─────────────────────────────────────────────────────────

function showView(name) {
  Object.keys(views).forEach(k => views[k].classList.toggle('hidden', k !== name));
}

// ── Setup view ────────────────────────────────────────────────────────────────

let setupOptions = ['', ''];

function initSetupView() {
  showView('setup');
  renderOptionInputs(setupOptions);
  els.question.value = '';
  els.durationMin.value = '1';
  els.durationSec.value = '0';
}

els.btnAddOption.addEventListener('click', () => {
  if (setupOptions.length < 6) {
    setupOptions.push('');
    renderOptionInputs(setupOptions);
  }
});

els.btnStart.addEventListener('click', () => {
  const question = els.question.value.trim();
  const options = setupOptions.map(o => o.trim()).filter(Boolean);
  const mins = Math.max(0, parseInt(els.durationMin.value) || 0);
  const secs = Math.max(0, Math.min(59, parseInt(els.durationSec.value) || 0));
  const duration = mins * 60 + secs;

  if (!question) { els.question.focus(); return; }
  if (options.length < 2) { alert('Add at least 2 options.'); return; }
  if (duration < 5) { alert('Set a duration of at least 5 seconds.'); return; }

  const state = {
    phase: 'active',
    question,
    options,
    duration,
    startTime: Date.now(),
    votes: new Array(options.length).fill(0),
    hasVoted: false,
    selectedIndex: null,
  };

  saveState(state);
  startVoteView(state);
});

// ── Vote view ─────────────────────────────────────────────────────────────────

let timerInterval = null;

function startVoteView(state) {
  showView('vote');
  els.voteQuestion.textContent = state.question;

  // Render option list
  els.voteOptionsList.innerHTML = '';
  state.options.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'vote-option' + (state.selectedIndex === i ? ' selected' : '');
    div.dataset.index = i;
    div.innerHTML = `<input type="radio" name="vote" /><div class="radio-dot"></div><span class="vote-option-label">${escapeHtml(opt)}</span>`;
    div.addEventListener('click', () => {
      if (state.hasVoted) return;
      state.selectedIndex = i;
      document.querySelectorAll('.vote-option').forEach((el, idx) => {
        el.classList.toggle('selected', idx === i);
      });
    });
    els.voteOptionsList.appendChild(div);
  });

  // Restore voted state
  if (state.hasVoted) {
    els.votedIndicator.classList.remove('hidden');
    els.btnVote.disabled = true;
  } else {
    els.votedIndicator.classList.add('hidden');
    els.btnVote.disabled = false;
  }

  tickTimer(state);
  timerInterval = setInterval(() => tickTimer(state), 1000);
}

function tickTimer(state) {
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const remaining = Math.max(0, state.duration - elapsed);

  els.timerDisplay.textContent = formatTime(remaining);

  // Arc
  const circumference = 263.9;
  const progress = remaining / state.duration;
  els.timerArc.style.strokeDashoffset = circumference * (1 - progress);
  els.timerArc.classList.toggle('urgent', remaining <= 10 && remaining > 0);

  if (remaining === 0) {
    clearInterval(timerInterval);
    state.phase = 'results';
    saveState(state);
    showResultsView(state);
  }
}

els.btnVote.addEventListener('click', () => {
  const state = loadState();
  if (!state || state.phase !== 'active') return;
  if (state.selectedIndex === null) { alert('Please select an option first.'); return; }
  if (state.hasVoted) return;

  state.votes[state.selectedIndex]++;
  state.hasVoted = true;
  saveState(state);

  els.votedIndicator.classList.remove('hidden');
  els.btnVote.disabled = true;
});

els.btnResetSetup.addEventListener('click', () => {
  if (!confirm('Start over? The current poll will be lost.')) return;
  clearState();
  clearInterval(timerInterval);
  setupOptions = ['', ''];
  initSetupView();
});

// ── Results view ──────────────────────────────────────────────────────────────

function showResultsView(state) {
  clearInterval(timerInterval);
  showView('results');

  els.resultsQuestion.textContent = state.question;

  const totalVotes = state.votes.reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...state.votes);

  els.resultBars.innerHTML = '';
  state.options.forEach((opt, i) => {
    const count = state.votes[i];
    const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
    const isWinner = count === maxVotes && maxVotes > 0;

    const row = document.createElement('div');
    row.className = 'result-bar-row';
    row.innerHTML = `
      <div class="result-bar-header">
        <span>${escapeHtml(opt)}</span>
        <span>${pct}% (${count})</span>
      </div>
      <div class="result-bar-track">
        <div class="result-bar-fill${isWinner ? ' winner' : ''}" data-pct="${pct}"></div>
      </div>
    `;
    els.resultBars.appendChild(row);
  });

  els.totalVotesLabel.textContent = `${totalVotes} vote${totalVotes !== 1 ? 's' : ''} total`;

  // Animate bars after paint
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll('.result-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  }));
}

els.btnNewPoll.addEventListener('click', () => {
  clearState();
  setupOptions = ['', ''];
  initSetupView();
});

// ── XSS-safe helper ───────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ── Boot ─────────────────────────────────────────────────────────────────────

(function boot() {
  const state = loadState();
  if (!state) { initSetupView(); return; }

  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const remaining = state.duration - elapsed;

  if (state.phase === 'results' || remaining <= 0) {
    state.phase = 'results';
    saveState(state);
    showResultsView(state);
  } else {
    startVoteView(state);
  }
})();
