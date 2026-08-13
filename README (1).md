# AstraToonix Quiz Portal

A responsive, interactive quiz app built with HTML, Tailwind CSS, and vanilla JavaScript. No backend, no build step — ready to host on GitHub Pages.

## Files

- `index.html` — page structure
- `style.css` — design tokens, animations (starfield, profile ring, confetti, feedback states)
- `script.js` — quiz engine + `CONFIG` object (edit this first for quick customization)
- `sample-questions.json` — General Knowledge category (425 questions)
- `questions/indian-state-capitals.json` — Indian State & UT Capitals category (28 questions)
- `assets/` — put your audio files here (create this folder if it doesn't exist)
- `backend/` — optional FastAPI + MongoDB service that powers the leaderboard (players enter their name, their score is saved, and a "🏆 View Leaderboard" screen shows the top scorers). See `backend/README.md` for the MongoDB Atlas + Render setup guide. The quiz still works fully without it — the leaderboard buttons just show a "not set up yet" message until `CONFIG.apiBaseUrl` in `script.js` is filled in.

## Hosting on GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Upload `index.html`, `style.css`, `script.js`, `sample-questions.json`, the `questions/` folder, and an `assets/` folder containing your MP3 files.
3. In the repo, go to **Settings → Pages**, set the source branch (usually `main`) and folder (`/root`), then save.
4. Your quiz will be live at `https://<your-username>.github.io/<repo-name>/`.

## Question categories

Setup mode has a **"Choose a question category"** dropdown — pick one and it loads immediately:

- **General Knowledge** — the 425-question sample bank in `sample-questions.json`.
- **भारत के राज्यों की राजधानियाँ (Indian State Capitals)** — all 28 Indian states, in `questions/indian-state-capitals.json`.

By default the run uses every question in whichever category you pick, drawn in a fresh random order and starting from a random question each time (so no two runs — and no two people — see the same question first). You can still type a smaller number in "Number of questions" for a shorter run.

### Adding your own category

1. Create a new `.json` file shaped like this:

```json
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["Berlin", "Madrid", "Paris", "Rome"],
      "answer": "Paris"
    }
  ]
}
```

`answer` can be the exact text of the correct option, or its position in the `options` array starting at `0`.

2. Add one entry to `CONFIG.questionCategories` in `script.js`:

```js
{ id: 'my-category', label: 'My Category Name', url: 'questions/my-category.json' }
```

It'll show up in the dropdown automatically. You can also skip all this and just use the **"Upload your own .json"** button or **"Paste JSON instead"** in Setup mode for a one-off question set without editing the repo.

> **Note:** category files load via `fetch()`, which requires the page to be served over http(s) — GitHub Pages works fine. If you open `index.html` directly as a local file, the browser blocks that fetch; the General Knowledge category falls back to a small 6-question built-in set in that case (other categories will show an error instead, since they have no built-in fallback).

## Adding your victory song and wrong-answer sound

1. Create an `assets` folder next to `index.html`.
2. Drop your victory MP3 in as `assets/dur.mp3` (or change the path in `CONFIG.victorySongPath` inside `script.js`).
3. Optionally add `assets/wrong-sound.mp3` for a custom wrong-answer cue — if it's missing, the app automatically falls back to a built-in beep, so this step is optional.
4. Alternatively, skip editing the repo entirely and use the "Victory song" file picker in Setup mode to choose an MP3 at runtime (it won't persist between sessions, but it's handy for quick testing).
5. The player hides the browser's "Download" control and blocks right-click "Save Audio As…" on the victory track. This deters casual downloading but isn't a hard technical guarantee — any audio the browser can play, a determined person can still retrieve via devtools, since the file has to reach the browser to play at all.

## Customizing

Open `script.js` and edit the `CONFIG` object at the top:

- `questionCategories` — the list of categories shown in the Setup dropdown (each is its own JSON file)
- `sampleQuestions` — small built-in fallback for the General Knowledge category only, used if its fetch fails
- `defaultTimerSeconds` — default per-question timer
- `victorySongPath` / `wrongSoundPath` — audio file paths
- `confettiBurstSize` / `confettiVictoryMultiplier` — celebration intensity
- `giftBurstSize` / `giftVictoryMultiplier` — gift-emoji burst intensity
- `speechFeedbackEnabled` / `speechLang` — voice readback of question + answer after each question

To change the profile picture or name, edit the header section directly in `index.html` (look for the `⚙️ CONFIG` comments).

## Background effects

- **Color wash** — a soft band of color flows from the top of the screen down, on a loop (`.color-flow` in `style.css`).
- **RGB-glow 3D cube** — a bigger box near the top-right spins in full 3D while colored light cycles around its faces (`.rgb-cube-wrap` in `style.css`).
- **Typing starfield + moon** — background stars idle-drift until you focus a form field, then ease together at that field's position; a glowing moon grows there as you type, and regrows fresh (and bigger, the more you type) wherever you move focus next. This is driven by `initTypeStarfield()` at the bottom of `script.js` (canvas-based, so it stays cheap on mobile) and respects `prefers-reduced-motion`.

## Answer feedback

- **Speaks the question + answer** — after every question, the app reads it out loud in Hindi using the browser's built-in text-to-speech (Web Speech API — no audio file needed): a praise line when you're right ("आपने बहुत अच्छा जवाब दिया! बिल्कुल यही सही उत्तर था: …"), a correction when you're wrong or time runs out ("आपका उत्तर गलत है। इसका सही उत्तर है: …"). Both the question and answer are also shown in the on-screen feedback banner. People can turn the voice off with the "🔊 Speak question + answer" checkbox in Setup mode (`CONFIG.speechFeedbackEnabled` sets the default; the app pauses a little longer before the next question while voice is on, so the line has time to finish).
- **Gift burst on correct answers** — 🎁🎉⭐ float upward from the bottom of the screen alongside the existing confetti, with an even bigger burst on a perfect score. Tune `CONFIG.giftBurstSize` / `CONFIG.giftVictoryMultiplier`.
