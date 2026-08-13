/* ==========================================================================
   AstraToonix Quiz Portal — script.js
   Vanilla JS, no build step. Everything you're likely to want to tweak
   lives in the CONFIG object right below — edit that first.
   ========================================================================== */

const CONFIG = {
  // ⚙️ Question categories offered in Setup mode. Each one is its own JSON
  // file — add a new category by dropping a new file next to this one (or
  // in questions/) and adding an entry here. "url" is fetched the same way
  // sample-questions.json always was.
  questionCategories: [
    { id: 'general', label: 'General Knowledge (Sample, 425 Qs)', url: 'sample-questions.json' },
    { id: 'india-capitals', label: 'भारत के राज्यों की राजधानियाँ (Indian State Capitals)', url: 'questions/indian-state-capitals.json' }
  ],

  // ⚙️ Small built-in fallback for the "General Knowledge" category only,
  // used if its JSON can't be fetched (e.g. the page was opened directly
  // as a local file instead of through a web server — browsers block
  // fetch() of local JSON in that case). Other categories have no
  // fallback; if their fetch fails you'll see an error instead.
  sampleQuestions: [
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      answer: "Mars"
    },
    {
      question: "What does HTML stand for?",
      options: [
        "Hyper Trainer Marking Language",
        "HyperText Markup Language",
        "Hyperlinks and Text Markup Language",
        "Home Tool Markup Language"
      ],
      answer: 1
    },
    {
      question: "Which of these is a JavaScript framework/library?",
      options: ["Laravel", "Django", "React", "Rails"],
      answer: "React"
    },
    {
      question: "How many continents are there on Earth?",
      options: ["5", "6", "7", "8"],
      answer: "7"
    },
    {
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      answer: "Au"
    },
    {
      question: "Which ocean is the largest?",
      options: ["Atlantic", "Indian", "Arctic", "Pacific"],
      answer: 3
    }
  ],

  // ⚙️ Default number of seconds per question, and the choices offered in
  // Setup mode. The <select id="timer-select"> in index.html mirrors this.
  defaultTimerSeconds: 20,

  // ⚙️ Path to the victory song. Place your MP3 at this exact path/name in
  // the repo — create an "assets" folder next to index.html and drop the
  // file in as assets/dur.mp3 — OR let the user override it at runtime
  // with the "Victory song" file picker in Setup mode. The player is set
  // up (in index.html + below) to hide the browser's download option, but
  // note that's a deterrent, not a hard guarantee — anyone determined can
  // still find the file via devtools, since it has to reach the browser
  // to play at all.
  victorySongPath: "assets/dur.mp3",

  // ⚙️ Optional path to a custom "wrong answer" sound effect. If this file
  // doesn't exist, the app automatically falls back to a built-in beep
  // generated with the Web Audio API, so nothing breaks if you skip this.
  wrongSoundPath: "assets/wrong-sound.mp3",

  // ⚙️ How many confetti particles to spawn per correct answer / on victory.
  confettiBurstSize: 60,
  confettiVictoryMultiplier: 3,

  // ⚙️ How many "gift" particles (🎁🎉⭐) float upward on a correct answer.
  giftBurstSize: 18,
  giftVictoryMultiplier: 3,

  // ⚙️ Speak the full question + answer out loud after every question (via
  // the browser's built-in text-to-speech) — a praise line when correct,
  // a correction line when wrong or timed out. Uses the Web Speech API, so
  // no audio file is needed. People can turn this off with the "🔊 Speak
  // question + answer" toggle in Setup.
  speechFeedbackEnabled: true,
  speechLang: 'hi-IN',

  // ⚙️ Leaderboard backend (FastAPI + MongoDB) — see backend/README.md for
  // how to get these two values. Leave apiBaseUrl empty ('') to disable
  // the leaderboard entirely (the buttons still show but calls will fail
  // gracefully with a friendly message).
  apiBaseUrl: "https://raj-dev-quiz-competition.onrender.com",
  apiKey: "raj_quiz_secret_2026"   // must match API_KEY set on Render exactly
};

/* ==========================================================================
   State
   ========================================================================== */
const state = {
  allQuestions: [],       // full pool loaded from JSON / sample
  quizQuestions: [],      // the subset actually used this run
  currentIndex: 0,
  score: 0,
  timerSeconds: CONFIG.defaultTimerSeconds,
  timerRemaining: 0,
  timerInterval: null,
  answered: false,
  victorySongOverrideUrl: null,
  voiceFeedbackEnabled: CONFIG.speechFeedbackEnabled,
  playerName: '',
  activeCategoryLabel: null,
  screenBeforeLeaderboard: 'setup'
};

/* ==========================================================================
   Element references
   ========================================================================== */
const el = {
  setupScreen: document.getElementById('setup-screen'),
  quizScreen: document.getElementById('quiz-screen'),
  resultsScreen: document.getElementById('results-screen'),
  leaderboardScreen: document.getElementById('leaderboard-screen'),

  playerNameInput: document.getElementById('player-name-input'),
  openLeaderboardBtn: document.getElementById('open-leaderboard-btn'),
  viewLeaderboardFromResultsBtn: document.getElementById('view-leaderboard-from-results-btn'),
  leaderboardBackBtn: document.getElementById('leaderboard-back-btn'),
  leaderboardStatus: document.getElementById('leaderboard-status'),
  leaderboardList: document.getElementById('leaderboard-list'),
  scoreSubmitStatus: document.getElementById('score-submit-status'),

  jsonUpload: document.getElementById('json-upload'),
  jsonUploadTrigger: document.getElementById('json-upload-trigger'),
  categorySelect: document.getElementById('category-select'),
  sourceStatus: document.getElementById('question-source-status'),
  pasteJsonToggle: document.getElementById('paste-json-toggle'),
  pasteJsonPanel: document.getElementById('paste-json-panel'),
  pasteJsonInput: document.getElementById('paste-json-input'),
  pasteJsonLoad: document.getElementById('paste-json-load'),
  questionCountSelect: document.getElementById('question-count'),
  questionCountHint: document.getElementById('question-count-hint'),
  timerSelect: document.getElementById('timer-select'),
  voiceFeedbackToggle: document.getElementById('voice-feedback-toggle'),
  songUpload: document.getElementById('song-upload'),
  songStatus: document.getElementById('song-source-status'),
  startBtn: document.getElementById('start-quiz-btn'),
  setupError: document.getElementById('setup-error'),

  questionProgress: document.getElementById('question-progress'),
  timerBadge: document.getElementById('timer-badge'),
  timerValue: document.getElementById('timer-value'),
  progressFill: document.getElementById('progress-fill'),
  questionText: document.getElementById('question-text'),
  optionsList: document.getElementById('options-list'),
  feedbackBanner: document.getElementById('feedback-banner'),

  resultsIcon: document.getElementById('results-icon'),
  resultsTitle: document.getElementById('results-title'),
  resultsSubtitle: document.getElementById('results-subtitle'),
  scoreRing: document.querySelector('.score-ring'),
  scoreFraction: document.getElementById('score-fraction'),
  victoryPlayer: document.getElementById('victory-player'),
  victoryAudio: document.getElementById('victory-audio'),
  retryBtn: document.getElementById('retry-btn'),
  newQuizBtn: document.getElementById('new-quiz-btn'),

  profileTrigger: document.getElementById('profile-trigger'),
  profileModal: document.getElementById('profile-modal'),
  modalImg: document.getElementById('modal-img'),
  modalClose: document.getElementById('modal-close'),

  wrongAudio: document.getElementById('wrong-audio'),
  confettiCanvas: document.getElementById('confetti-canvas')
};

/* ==========================================================================
   Setup mode — loading questions
   ========================================================================== */
function normalizeQuestions(raw) {
  const list = Array.isArray(raw) ? raw : raw.questions;
  if (!Array.isArray(list)) throw new Error('JSON must contain a "questions" array.');

  return list.map((q, i) => {
    if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Question ${i + 1} is missing "question" text or has fewer than 2 "options".`);
    }
    let correctIndex;
    if (typeof q.answer === 'number') {
      correctIndex = q.answer;
    } else if (typeof q.answer === 'string') {
      correctIndex = q.options.findIndex(
        opt => opt.trim().toLowerCase() === q.answer.trim().toLowerCase()
      );
    } else {
      correctIndex = -1;
    }
    if (correctIndex < 0 || correctIndex >= q.options.length) {
      throw new Error(`Question ${i + 1}'s "answer" doesn't match any of its options.`);
    }
    return { question: q.question, options: q.options, correctIndex };
  });
}

function setQuestionPool(questions, sourceLabel) {
  state.allQuestions = questions;
  state.activeCategoryLabel = sourceLabel;
  el.sourceStatus.textContent = `${sourceLabel} — ${questions.length} question${questions.length === 1 ? '' : 's'} loaded.`;
  configureQuestionCountInput(questions.length);
  el.startBtn.disabled = false;
  hideSetupError();
}

// The count field is a plain, typeable number input (not a limited dropdown)
// so people can ask for 10, 100, 500, 900... anything up to how many
// questions are actually loaded. Defaults to using every loaded question —
// people can still type a smaller number if they want a shorter run.
function configureQuestionCountInput(total) {
  el.questionCountSelect.max = String(total);
  el.questionCountSelect.min = '1';
  el.questionCountSelect.value = String(total);
  el.questionCountHint.textContent = `Defaulting to all ${total} loaded — type any smaller amount (1–${total}) for a shorter run.`;
}

function showSetupError(message) {
  el.setupError.textContent = message;
  el.setupError.classList.remove('hidden');
}

function hideSetupError() {
  el.setupError.classList.add('hidden');
}

el.jsonUpload.addEventListener('change', async () => {
  const file = el.jsonUpload.files[0];
  if (!file) return;

  el.categorySelect.value = '';
  // Give immediate feedback the moment a file is picked, so it never looks
  // like nothing happened while the file is being read.
  el.sourceStatus.textContent = `Reading "${file.name}"…`;
  hideSetupError();

  try {
    const text = await file.text();
    loadQuestionsFromJsonText(text, `"${file.name}"`);
  } catch (err) {
    console.error('File read error:', err);
    showSetupError(`Couldn't read that file: ${err.message}. Try "Paste JSON instead" below if this keeps happening.`);
    el.sourceStatus.textContent = 'No questions loaded yet.';
    el.startBtn.disabled = true;
  } finally {
    // Reset so picking the exact same file a second time still fires "change".
    el.jsonUpload.value = '';
  }
});

function loadQuestionsFromJsonText(text, sourceLabel) {
  try {
    const parsed = JSON.parse(text);
    const questions = normalizeQuestions(parsed);
    setQuestionPool(questions, sourceLabel);
  } catch (err) {
    console.error('JSON parse error:', err);
    showSetupError(`Couldn't load that: ${err.message}`);
    el.sourceStatus.textContent = 'No questions loaded yet.';
    el.startBtn.disabled = true;
  }
}

// Loads a question category by fetching its JSON file. Used for every
// entry in CONFIG.questionCategories, selected via the dropdown.
async function loadCategory(category) {
  el.sourceStatus.textContent = `Loading "${category.label}"…`;
  hideSetupError();
  el.categorySelect.disabled = true;

  try {
    const res = await fetch(category.url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = await res.json();
    const questions = normalizeQuestions(parsed);
    setQuestionPool(questions, category.label);
  } catch (err) {
    console.warn(`Could not fetch ${category.url}:`, err);
    if (category.id === 'general') {
      // Only the built-in "General Knowledge" category has a local
      // fallback bank; most likely cause of the fetch failing at all is
      // the page being opened as a local file:// instead of served over
      // http(s), where fetch() of local JSON is blocked by the browser.
      const questions = normalizeQuestions(CONFIG.sampleQuestions);
      setQuestionPool(questions, `${category.label} (built-in fallback — host the page on a server to load the full bank)`);
    } else {
      showSetupError(`Couldn't load "${category.label}": ${err.message}. If you're opening this file directly instead of through a web server, that blocks the fetch — try GitHub Pages or "Paste JSON instead" below.`);
      el.sourceStatus.textContent = 'No questions loaded yet.';
      el.startBtn.disabled = true;
    }
  } finally {
    el.categorySelect.disabled = false;
  }
}

function populateCategorySelect() {
  CONFIG.questionCategories.forEach(category => {
    const opt = document.createElement('option');
    opt.value = category.id;
    opt.textContent = category.label;
    el.categorySelect.appendChild(opt);
  });
}
populateCategorySelect();

el.categorySelect.addEventListener('change', () => {
  const category = CONFIG.questionCategories.find(c => c.id === el.categorySelect.value);
  if (!category) return;
  el.jsonUpload.value = '';
  loadCategory(category);
});

// The raw file input is visually hidden; this button opens it, so the
// category dropdown reads as the primary way to pick questions.
el.jsonUploadTrigger.addEventListener('click', () => {
  el.jsonUpload.click();
});

// Fallback path in case a phone's native file picker won't cooperate: let
// the person paste the JSON text directly instead.
el.pasteJsonToggle.addEventListener('click', () => {
  el.pasteJsonPanel.classList.toggle('hidden');
});

el.pasteJsonLoad.addEventListener('click', () => {
  const text = el.pasteJsonInput.value.trim();
  if (!text) {
    showSetupError('Paste some JSON text first.');
    return;
  }
  el.categorySelect.value = '';
  loadQuestionsFromJsonText(text, 'Pasted JSON');
});

el.songUpload.addEventListener('change', () => {
  const file = el.songUpload.files[0];
  if (!file) return;
  if (state.victorySongOverrideUrl) URL.revokeObjectURL(state.victorySongOverrideUrl);
  state.victorySongOverrideUrl = URL.createObjectURL(file);
  el.songStatus.textContent = `Using uploaded file: "${file.name}"`;
});

/* ==========================================================================
   Starting the quiz
   ========================================================================== */
function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

el.startBtn.addEventListener('click', () => {
  state.playerName = el.playerNameInput.value;
  if (!state.allQuestions.length) {
    showSetupError('Load a question file or use the sample questions first.');
    return;
  }

  const total = state.allQuestions.length;
  let requested = parseInt(el.questionCountSelect.value, 10);
  if (!Number.isFinite(requested) || requested < 1) requested = total;
  requested = Math.min(requested, total);

  state.timerSeconds = Number(el.timerSelect.value);
  state.voiceFeedbackEnabled = el.voiceFeedbackToggle ? el.voiceFeedbackToggle.checked : CONFIG.speechFeedbackEnabled;
  drawFreshQuestionSet(requested);

  switchScreen('quiz');
  renderQuestion();
});

// Picks a brand-new random subset, in a brand-new random order, from the
// full loaded pool. Used both for the initial start and for "Try Again" so
// no run ever repeats the same questions in the same order — every attempt
// can pull from anywhere in the set (start, middle, end, wherever).
function drawFreshQuestionSet(count) {
  state.quizQuestions = shuffle(state.allQuestions).slice(0, count);
  state.currentIndex = 0;
  state.score = 0;
}

/* ==========================================================================
   Quiz engine
   ========================================================================== */
function renderQuestion() {
  clearInterval(state.timerInterval);
  state.answered = false;
  el.feedbackBanner.classList.add('hidden');
  el.feedbackBanner.textContent = '';

  const q = state.quizQuestions[state.currentIndex];
  const total = state.quizQuestions.length;

  el.questionProgress.textContent = `Question ${state.currentIndex + 1} / ${total}`;
  el.progressFill.style.width = `${(state.currentIndex / total) * 100}%`;
  el.questionText.textContent = q.question;

  el.optionsList.innerHTML = '';
  shuffleOptionsForDisplay(q).forEach(({ text, index }) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = text;
    btn.dataset.optionIndex = index;
    btn.setAttribute('role', 'listitem');
    btn.addEventListener('click', () => handleAnswer(index, btn));
    el.optionsList.appendChild(btn);
  });

  startTimer();
}

// Options are shuffled for display only; correctIndex on the question
// object still refers to the original options array, so we track each
// button's real index via dataset.
function shuffleOptionsForDisplay(q) {
  const withIndex = q.options.map((text, index) => ({ text, index }));
  return shuffle(withIndex);
}

function startTimer() {
  el.timerBadge.classList.remove('timer-warning', 'timer-danger');

  if (state.timerSeconds === 0) {
    el.timerValue.textContent = '∞';
    return;
  }

  state.timerRemaining = state.timerSeconds;
  el.timerValue.textContent = state.timerRemaining;

  state.timerInterval = setInterval(() => {
    state.timerRemaining--;
    el.timerValue.textContent = state.timerRemaining;

    if (state.timerRemaining <= Math.ceil(state.timerSeconds * 0.5) && state.timerRemaining > Math.ceil(state.timerSeconds * 0.25)) {
      el.timerBadge.classList.add('timer-warning');
    } else if (state.timerRemaining <= Math.ceil(state.timerSeconds * 0.25)) {
      el.timerBadge.classList.remove('timer-warning');
      el.timerBadge.classList.add('timer-danger');
    }

    if (state.timerRemaining <= 0) {
      clearInterval(state.timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  if (state.answered) return;
  state.answered = true;
  const q = state.quizQuestions[state.currentIndex];

  // Reveal the correct answer, mark nothing as "wrong" since nothing was picked.
  [...el.optionsList.children].forEach(btn => {
    btn.disabled = true;
    if (Number(btn.dataset.optionIndex) === q.correctIndex) {
      btn.classList.add('reveal-correct');
    }
  });

  showFeedback(false, `⏱ Time's up! ${q.question} — correct answer: ${q.options[q.correctIndex]}`);
  playWrongCue();
  speakWrongFeedback(q.question, q.options[q.correctIndex]);
  advanceAfterDelay();
}

function handleAnswer(selectedIndex, btnEl) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(state.timerInterval);

  const q = state.quizQuestions[state.currentIndex];
  const isCorrect = selectedIndex === q.correctIndex;

  [...el.optionsList.children].forEach(btn => {
    btn.disabled = true;
    const idx = Number(btn.dataset.optionIndex);
    if (idx === q.correctIndex) btn.classList.add('correct');
    else if (btn === btnEl) btn.classList.add('wrong');
  });

  if (isCorrect) {
    state.score++;
    showFeedback(true, `🎉 Correct! ${q.question} — ${q.options[q.correctIndex]}`);
    launchConfetti(CONFIG.confettiBurstSize);
    launchGiftBurst(CONFIG.giftBurstSize);
    speakCorrectFeedback(q.question, q.options[q.correctIndex]);
  } else {
    showFeedback(false, `❌ Wrong answer — ${q.question} — correct answer: ${q.options[q.correctIndex]}`);
    playWrongCue();
    speakWrongFeedback(q.question, q.options[q.correctIndex]);
  }

  advanceAfterDelay();
}

function showFeedback(isCorrect, message) {
  el.feedbackBanner.textContent = message;
  el.feedbackBanner.classList.remove('hidden', 'correct', 'wrong');
  el.feedbackBanner.classList.add(isCorrect ? 'correct' : 'wrong');
}

function advanceAfterDelay() {
  // Longer pause when voice feedback is on and supported, so the spoken
  // question + answer has time to finish before the next question loads.
  const delay = (state.voiceFeedbackEnabled && 'speechSynthesis' in window) ? 3200 : 1400;
  setTimeout(() => {
    state.currentIndex++;
    if (state.currentIndex >= state.quizQuestions.length) {
      finishQuiz();
    } else {
      renderQuestion();
    }
  }, delay);
}

/* ==========================================================================
   Results
   ========================================================================== */
function finishQuiz() {
  clearInterval(state.timerInterval);
  el.progressFill.style.width = '100%';

  const total = state.quizQuestions.length;
  const perfect = state.score === total;

  switchScreen('results');

  el.scoreFraction.textContent = `${state.score} / ${total}`;
  el.scoreRing.style.setProperty('--pct', String(Math.round((state.score / total) * 100)));

  submitScore(state.score, total);

  if (perfect) {
    el.resultsIcon.textContent = '🏆';
    el.resultsTitle.textContent = 'Perfect Score!';
    el.resultsSubtitle.textContent = 'Every question, correct. The victory track is yours.';
    el.victoryPlayer.classList.remove('hidden');
    playVictorySong();
    launchConfetti(CONFIG.confettiBurstSize * CONFIG.confettiVictoryMultiplier);
    launchGiftBurst(CONFIG.giftBurstSize * CONFIG.giftVictoryMultiplier);
  } else {
    el.resultsIcon.textContent = '🌠';
    el.resultsTitle.textContent = 'Nice Run';
    el.resultsSubtitle.textContent = `You got ${state.score} out of ${total}. Answer them all to unlock the victory track.`;
    el.victoryPlayer.classList.add('hidden');
    el.victoryAudio.pause();
  }
}

function playVictorySong() {
  const src = state.victorySongOverrideUrl || CONFIG.victorySongPath;
  el.victoryAudio.src = src;
  // Belt-and-suspenders alongside the attributes already set in index.html:
  // hide the browser's built-in "Download" option on the player controls
  // and block the right-click "Save Audio As…" menu. This deters casual
  // downloading — it can't make the file un-fetchable, since the browser
  // has to receive it to play it at all.
  el.victoryAudio.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
  el.victoryAudio.setAttribute('disablePictureInPicture', '');
  el.victoryAudio.oncontextmenu = () => false;
  el.victoryAudio.play().catch(() => {
    // Autoplay can be blocked by the browser; the visible <audio> controls
    // let the user press play manually, so we fail silently here.
  });
}

el.retryBtn.addEventListener('click', () => {
  if (el.scoreSubmitStatus) el.scoreSubmitStatus.textContent = '';
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  // Draw a brand-new random set from the full pool rather than replaying
  // the exact same questions in the exact same order.
  drawFreshQuestionSet(state.quizQuestions.length);
  switchScreen('quiz');
  renderQuestion();
});

el.newQuizBtn.addEventListener('click', () => {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  el.victoryAudio.pause();
  switchScreen('setup');
});

/* ==========================================================================
   Screen switching
   ========================================================================== */
function switchScreen(name) {
  el.setupScreen.classList.toggle('hidden', name !== 'setup');
  el.quizScreen.classList.toggle('hidden', name !== 'quiz');
  el.resultsScreen.classList.toggle('hidden', name !== 'results');
  el.leaderboardScreen.classList.toggle('hidden', name !== 'leaderboard');
}

/* ==========================================================================
   Leaderboard (backend: FastAPI + MongoDB — see backend/README.md)
   ========================================================================== */

// Sends the just-finished attempt to the backend. Silently no-ops (with a
// small status note) if CONFIG.apiBaseUrl hasn't been set up yet, so the
// quiz keeps working fine even before the backend is deployed.
async function submitScore(score, total) {
  if (!el.scoreSubmitStatus) return;

  if (!CONFIG.apiBaseUrl) {
    el.scoreSubmitStatus.textContent = '';
    return;
  }

  const name = (state.playerName || '').trim();
  if (!name) {
    el.scoreSubmitStatus.textContent = "Enter your name in Setup to appear on the leaderboard.";
    return;
  }

  el.scoreSubmitStatus.textContent = 'Saving your score…';

  try {
    const res = await fetch(`${CONFIG.apiBaseUrl}/api/submit-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.apiKey || ''
      },
      body: JSON.stringify({
        player_name: name,
        score,
        total,
        category_id: null,
        category_label: state.activeCategoryLabel || null
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    el.scoreSubmitStatus.textContent = '✅ Score saved to the leaderboard.';
  } catch (err) {
    console.warn('Could not submit score:', err);
    el.scoreSubmitStatus.textContent = "Couldn't save your score right now — leaderboard might be offline.";
  }
}

async function loadLeaderboard() {
  el.leaderboardList.innerHTML = '';

  if (!CONFIG.apiBaseUrl) {
    el.leaderboardStatus.textContent = 'Leaderboard isn\'t set up yet — add CONFIG.apiBaseUrl in script.js once the backend is deployed (see backend/README.md).';
    return;
  }

  el.leaderboardStatus.textContent = 'Loading…';

  try {
    const res = await fetch(`${CONFIG.apiBaseUrl}/api/leaderboard?limit=10&best_per_player=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const entries = await res.json();

    if (entries.length === 0) {
      el.leaderboardStatus.textContent = 'No scores yet — be the first!';
      return;
    }

    el.leaderboardStatus.textContent = '';
    const medals = ['🥇', '🥈', '🥉'];

    entries.forEach(entry => {
      const li = document.createElement('li');
      li.className = 'leaderboard-row';
      if (entry.rank <= 3) li.classList.add(`rank-${entry.rank}`);

      const rankLabel = medals[entry.rank - 1] || `#${entry.rank}`;

      li.innerHTML = `
        <span class="leaderboard-rank">${rankLabel}</span>
        <span class="leaderboard-name">${escapeHtml(entry.player_name)}</span>
        <span class="leaderboard-score">${entry.score} / ${entry.total} <small>(${entry.percentage}%)</small></span>
      `;
      el.leaderboardList.appendChild(li);
    });
  } catch (err) {
    console.warn('Could not load leaderboard:', err);
    el.leaderboardStatus.textContent = "Couldn't reach the leaderboard right now. Try again in a bit.";
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

el.openLeaderboardBtn.addEventListener('click', () => {
  state.screenBeforeLeaderboard = 'setup';
  switchScreen('leaderboard');
  loadLeaderboard();
});

el.viewLeaderboardFromResultsBtn.addEventListener('click', () => {
  state.screenBeforeLeaderboard = 'results';
  switchScreen('leaderboard');
  loadLeaderboard();
});

el.leaderboardBackBtn.addEventListener('click', () => {
  switchScreen(state.screenBeforeLeaderboard);
});

el.playerNameInput.addEventListener('input', () => {
  state.playerName = el.playerNameInput.value;
});

/* ==========================================================================
   Audio cues
   ========================================================================== */
let audioCtx = null;

// Speaks the full question and answer aloud, with either a praise line (on
// a correct answer) or a correction line (on a wrong one/timeout), using
// the browser's built-in text-to-speech (Web Speech API) — no audio file
// needed. Silently does nothing if voice feedback is off, or the browser
// doesn't support speech synthesis.
function speak(text) {
  if (!state.voiceFeedbackEnabled) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // don't let utterances pile up/overlap
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = CONFIG.speechLang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

function speakCorrectFeedback(questionText, correctAnswerText) {
  speak(`सवाल था: ${questionText}. आपने बहुत अच्छा जवाब दिया! बिल्कुल यही सही उत्तर था: ${correctAnswerText}`);
}

function speakWrongFeedback(questionText, correctAnswerText) {
  speak(`सवाल था: ${questionText}. आपका उत्तर गलत है। इसका सही उत्तर है: ${correctAnswerText}`);
}

function playWrongCue() {
  // Prefer a custom file if one has been configured/exists; otherwise fall
  // back to a short synthesized beep via the Web Audio API.
  if (CONFIG.wrongSoundPath) {
    el.wrongAudio.src = CONFIG.wrongSoundPath;
    el.wrongAudio.play().catch(() => playBeep());
    el.wrongAudio.onerror = () => playBeep();
  } else {
    playBeep();
  }
}

function playBeep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    // Audio isn't critical to functionality; ignore if unsupported.
  }
}

/* ==========================================================================
   Confetti (lightweight vanilla canvas particle burst)
   ========================================================================== */
const confettiCtx = el.confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiRAF = null;

function resizeConfettiCanvas() {
  el.confettiCanvas.width = window.innerWidth;
  el.confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfettiCanvas);
resizeConfettiCanvas();

const CONFETTI_COLORS = ['#4CE0D2', '#B357FF', '#FFD166', '#F4F1EA', '#FF6B6B'];

function launchConfetti(count) {
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.35;

  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: originX + (Math.random() - 0.5) * 120,
      y: originY,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * -8 - 3,
      size: Math.random() * 6 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.25 + Math.random() * 0.1,
      life: 0,
      maxLife: 90 + Math.random() * 30
    });
  }

  if (!confettiRAF) confettiTick();
}

// Gift particles: spawn low on screen and float upward (near-zero/negative
// gravity) with gentle side-to-side sway, fading out near the top — the
// "presents floating up" celebration for a correct answer.
const GIFT_EMOJI = ['🎁', '🎉', '⭐', '✨', '🎊'];
let giftParticles = [];

function launchGiftBurst(count) {
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.85;

  for (let i = 0; i < count; i++) {
    giftParticles.push({
      x: originX + (Math.random() - 0.5) * window.innerWidth * 0.6,
      y: originY + Math.random() * 40,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(Math.random() * 2.2 + 1.8),
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.03 + Math.random() * 0.03,
      size: Math.random() * 12 + 18,
      emoji: GIFT_EMOJI[Math.floor(Math.random() * GIFT_EMOJI.length)],
      life: 0,
      maxLife: 110 + Math.random() * 50
    });
  }

  if (!confettiRAF) confettiTick();
}

function confettiTick() {
  confettiCtx.clearRect(0, 0, el.confettiCanvas.width, el.confettiCanvas.height);

  confettiParticles.forEach(p => {
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;
    p.life++;

    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = alpha;
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    confettiCtx.restore();
  });

  giftParticles.forEach(p => {
    p.swayPhase += p.swaySpeed;
    p.x += p.vx + Math.sin(p.swayPhase) * 0.6;
    p.y += p.vy;
    p.life++;

    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    confettiCtx.save();
    confettiCtx.globalAlpha = alpha;
    confettiCtx.font = `${p.size}px sans-serif`;
    confettiCtx.textAlign = 'center';
    confettiCtx.textBaseline = 'middle';
    confettiCtx.fillText(p.emoji, p.x, p.y);
    confettiCtx.restore();
  });

  confettiParticles = confettiParticles.filter(p => p.life < p.maxLife && p.y < el.confettiCanvas.height + 50);
  giftParticles = giftParticles.filter(p => p.life < p.maxLife && p.y > -60);

  if (confettiParticles.length > 0 || giftParticles.length > 0) {
    confettiRAF = requestAnimationFrame(confettiTick);
  } else {
    confettiRAF = null;
    confettiCtx.clearRect(0, 0, el.confettiCanvas.width, el.confettiCanvas.height);
  }
}

/* ==========================================================================
   Profile picture lightbox
   ========================================================================== */
el.profileTrigger.addEventListener('click', () => {
  el.modalImg.src = document.getElementById('profile-pic').src;
  el.profileModal.classList.remove('hidden');
});

el.modalClose.addEventListener('click', closeModal);
el.profileModal.addEventListener('click', (e) => {
  if (e.target === el.profileModal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function closeModal() {
  el.profileModal.classList.add('hidden');
}

/* ==========================================================================
   Interactive background: stars gather where you type, a moon grows there
   ------------------------------------------------------------------------
   A lightweight canvas layered behind the UI. Stars idle-drift normally.
   Whenever a form field gets focus (or the user types in one), the stars
   ease toward that field's position and a glowing "moon" grows there. Move
   focus to a different field and the stars regroup at the new spot while a
   fresh, bigger moon grows in its place.
   ========================================================================== */
(function initTypeStarfield() {
  const canvas = document.getElementById('type-stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height;
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const STAR_COUNT = Math.min(140, Math.round((window.innerWidth * window.innerHeight) / 9000));
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const ox = Math.random() * width;
    const oy = Math.random() * height;
    stars.push({
      ox, oy,            // idle "home" position
      x: ox, y: oy,       // current position
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.004 + Math.random() * 0.01,
      radius: Math.random() * 1.4 + 0.5,
      twinkle: Math.random() * Math.PI * 2,
      gatherOffsetX: (Math.random() - 0.5) * 70,
      gatherOffsetY: (Math.random() - 0.5) * 70,
      color: Math.random() < 0.15
        ? (Math.random() < 0.5 ? '#4CE0D2' : '#B357FF')
        : '#F4F1EA'
    });
  }

  // The "moon": follows the currently focused field, growing the longer
  // focus + typing continues there, and resetting small at a new field.
  const moon = { x: width / 2, y: height * 0.3, targetX: width / 2, targetY: height * 0.3, radius: 0, targetRadius: 0, active: false };

  function isTypableField(elm) {
    if (!elm) return false;
    const tag = elm.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  function focusFieldCenter(fieldEl) {
    const rect = fieldEl.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  document.addEventListener('focusin', (e) => {
    if (!isTypableField(e.target)) return;
    const { x, y } = focusFieldCenter(e.target);
    moon.targetX = x;
    moon.targetY = y;
    moon.targetRadius = 22;
    moon.active = true;
  });

  document.addEventListener('input', (e) => {
    if (!isTypableField(e.target)) return;
    const { x, y } = focusFieldCenter(e.target);
    moon.targetX = x;
    moon.targetY = y;
    // Grow with each keystroke, capped so it never swallows the screen.
    moon.targetRadius = Math.min(moon.targetRadius + 3, 90);
  });

  document.addEventListener('focusout', (e) => {
    if (!isTypableField(e.target)) return;
    // Let it drift back to a small idle glow if nothing else grabs focus.
    setTimeout(() => {
      if (!document.activeElement || !isTypableField(document.activeElement)) {
        moon.targetRadius = 0;
        moon.active = false;
      }
    }, 50);
  });

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Ease the moon toward its target position/size.
    moon.x += (moon.targetX - moon.x) * 0.08;
    moon.y += (moon.targetY - moon.y) * 0.08;
    moon.radius += (moon.targetRadius - moon.radius) * 0.06;

    if (moon.radius > 0.5) {
      const glow = ctx.createRadialGradient(moon.x, moon.y, 0, moon.x, moon.y, moon.radius * 2.4);
      glow.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
      glow.addColorStop(0.4, 'rgba(76, 224, 210, 0.18)');
      glow.addColorStop(1, 'rgba(76, 224, 210, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(moon.x, moon.y, moon.radius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = 'rgba(244, 241, 234, 0.9)';
      ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    stars.forEach(s => {
      s.wobble += s.wobbleSpeed;
      s.twinkle += 0.03;

      let targetX, targetY;
      if (moon.active && moon.radius > 1) {
        targetX = moon.x + s.gatherOffsetX;
        targetY = moon.y + s.gatherOffsetY;
      } else {
        targetX = s.ox + Math.sin(s.wobble) * 6;
        targetY = s.oy + Math.cos(s.wobble * 0.8) * 6;
      }

      s.x += (targetX - s.x) * 0.035;
      s.y += (targetY - s.y) * 0.035;

      const alpha = 0.4 + Math.sin(s.twinkle) * 0.3;
      ctx.beginPath();
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0.1, alpha);
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  draw();
  if (reduceMotion) {
    // Draw a single static frame and stop, rather than looping forever.
  }
})();

/* ==========================================================================
   Init
   ========================================================================== */
(function init() {
  el.startBtn.disabled = true;
})();
