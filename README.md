# Luminaire · The XLRI Legends Challenge

A five-round, timed trivia challenge for XLRI Homecoming 2026 (5–6 December).

- **Flow:** scroll story → name and roll number (B26XXX, H26XXX, B25XXX, H25XXX) → five rounds in a fixed order → score, time and the Homecoming logo.
- **Rounds:** Guess the Pokémon (blurred photo, one try, revealed only if right) → The Crossword Challenge (word search) → Two Truths and One Lie → Select the Timeline → Guess the Emoji. Each player gets one of three variants per round at random.
- **Fair play:** the answer key is never in this repository or the website. It sits in Apps Script **Script properties**. Google marks every answer, times the attempt on its own clock and allows one attempt per roll number.
- **Tracker:** Google Sheet with an **Attempts** tab (name, roll number, score, total time, time per round, answers) and a **Leaderboard** tab (score high to low, then fastest time).
- **Hosting:** GitHub Pages, built by `.github/workflows/deploy.yml`.

**To go live, follow [DEPLOY.md](DEPLOY.md).**

## Edit content

| What | Where |
|---|---|
| Question text, options, word grids, slider ranges | `src/data/quizData.ts` |
| Correct answers | Apps Script → Project Settings → Script properties → `ANSWER_KEY` (never in GitHub) |
| Photos (blurred and reveal) | `src/assets/q/` (file names referenced in `quizData.ts`) |
| Privacy notice | `src/components/PrivacyNote.tsx` |
| Landing story | `src/components/StoryLanding.tsx` |
| Colours, fonts, animations | `src/styles/global.css` |

If you change an answer or add a variant, update both `quizData.ts` (public question) and the `ANSWER_KEY` property (private answer).

## Run locally

```bash
npm install
npm run dev               # demo mode: marks in the browser using answer-key.json (local only)
npm test                  # Apps Script backend, word grids, roll numbers
npm run build:prototype   # prototype/luminaire-prototype.html (demo mode, contains the key: do not host it)
```

`answer-key.json` is git-ignored. Never upload it to GitHub.
