# AstraToonix Quiz Portal

A responsive, interactive quiz app built with HTML, Tailwind CSS, and vanilla JavaScript. No backend, no build step — ready to host on GitHub Pages.

## Files

- `index.html` — page structure
- `style.css` — design tokens, animations (starfield, profile ring, confetti, feedback states)
- `script.js` — quiz engine + `CONFIG` object (edit this first for quick customization)
- `sample-questions.json` — a starter question bank you can copy and edit
- `assets/` — put your audio files here (create this folder if it doesn't exist)

## Hosting on GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Upload `index.html`, `style.css`, `script.js`, and an `assets/` folder containing your MP3 files.
3. In the repo, go to **Settings → Pages**, set the source branch (usually `main`) and folder (`/root`), then save.
4. Your quiz will be live at `https://<your-username>.github.io/<repo-name>/`.

## Adding your questions

Upload a `.json` file in Setup mode shaped like this:

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

`answer` can be the exact text of the correct option, or its position in the `options` array starting at `0`. You can also click **Use sample questions** in Setup mode to try the app immediately with `sample-questions.json`'s content (already built into `script.js`).

## Adding your victory song and wrong-answer sound

1. Create an `assets` folder next to `index.html`.
2. Drop your victory MP3 in as `assets/victory-song.mp3` (or change the path in `CONFIG.victorySongPath` inside `script.js`).
3. Optionally add `assets/wrong-sound.mp3` for a custom wrong-answer cue — if it's missing, the app automatically falls back to a built-in beep, so this step is optional.
4. Alternatively, skip editing the repo entirely and use the "Victory song" file picker in Setup mode to choose an MP3 at runtime (it won't persist between sessions, but it's handy for quick testing).

## Customizing

Open `script.js` and edit the `CONFIG` object at the top:

- `sampleQuestions` — the built-in question bank
- `defaultTimerSeconds` — default per-question timer
- `victorySongPath` / `wrongSoundPath` — audio file paths
- `confettiBurstSize` / `confettiVictoryMultiplier` — celebration intensity

To change the profile picture or name, edit the header section directly in `index.html` (look for the `⚙️ CONFIG` comments).
