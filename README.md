# Luminaire · XLRI Homecoming Legacy Quiz

"Which XLRI legend are you?" A scroll-driven, mobile-first quiz for XLRI Homecoming 2026.

- **Hosting:** static site on GitHub Pages (built and published by `.github/workflows/deploy.yml`)
- **Data:** Google Sheet via a Google Apps Script web app (`apps-script/Code.gs`): anonymous page loads and quiz answers
- **Dashboard:** `https://<your-site>/#admin`, passcode stored in your Apps Script settings

**To go live, follow [DEPLOY.md](DEPLOY.md).**

## Edit content

| What | File |
|---|---|
| Alumni, archetypes, traits, highlights | `src/data/alumni.ts` |
| Questions | `src/data/questions.ts` |
| Scoring matrix | `src/data/scoring.ts` |
| Privacy notice text | `src/components/PrivacyNote.tsx` |
| Scroll story | `src/components/StoryLanding.tsx` |
| Colours, fonts, animations | `src/styles/global.css` |
| Portraits | drop approved photos in `public/portraits/` using the names in its README.txt |

Verify before launch (marked `EDITORIAL` in `alumni.ts`): programme and year for Vineet Nayar and B. Muthuraman.

## Run locally

```bash
npm install
npm run dev               # http://localhost:5173 (dashboard: /#admin, demo mode)
npm test                  # scoring, dashboard maths and the Apps Script backend
npm run build             # dist/
npm run build:prototype   # prototype/luminaire-prototype.html (single file, demo mode)
```

To test against your real Sheet locally, copy `.env.example` to `.env.local` and paste your web app URL.
