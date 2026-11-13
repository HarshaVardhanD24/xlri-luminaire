# Deploying the XLRI Legends Challenge

Time: about 20 minutes. Cost: ₹0. You need your Google account and your GitHub account.
**Keep the same repo** (`xlri-luminaire`), so your printed QR code keeps working.

What stays private:
- **Answer key:** lives only in Apps Script **Script properties**. It is not in GitHub and not on the website.
- **Google Sheet:** visible only to people you share it with.

---

## Part A: New Google Sheet tracker + Apps Script (10 minutes)

Use your **personal Gmail** (college accounts sometimes hide the "Anyone" option).

**A1. Open your tracker Sheet**
Open your Sheet (`https://docs.google.com/spreadsheets/d/1JgmXJy5LyyYkYDDLDNBXUjFaCVm625uLrAVrAs5PeLw`). The **Attempts** and **Leaderboard** tabs are already set up in it. Running `setup()` in A3 is still needed once to authorise the script; it rewrites only the headers and the leaderboard formula, and leaves the old **Summary**, **Events** and **Responses** tabs alone.

This Sheet already has the older Luminaire script attached. In A2, replace that code. In A5 you can then use **Deploy → Manage deployments → pencil → Version: New version → Deploy** instead of a new deployment: the web app URL stays the same, so `SHEETS_ENDPOINT` on GitHub needs no change.

**A2. Add the script**
1. **Extensions → Apps Script**. Name the project `Luminaire Challenge`.
2. In `Code.gs`, delete everything. Paste the whole of `apps-script/Code.gs` from this folder. Press **Ctrl+S**.

**A3. Run setup once**
1. Function dropdown (next to **Debug**) → **setup** → **Run**.
2. **Review permissions** → your account → **Advanced** → **Go to Luminaire Challenge (unsafe)** → **Allow**.
3. The Sheet now has two tabs: **Attempts** and **Leaderboard**.

**A4. Paste the answer key (private)**
1. Apps Script → **gear icon (Project Settings)** → **Script properties** → **Add script property**.
2. Property: `ANSWER_KEY`. Value: the one line in `ANSWER_KEY-paste-into-apps-script.txt` (starts with `{"p1":`).
3. **Save script properties**.

Until this property exists the challenge stays closed, so nobody can play without a key.

**A5. Deploy as a web app**
1. **Deploy → New deployment** → gear next to *Select type* → **Web app**.
2. Description `Challenge v1` · Execute as **Me** · Who has access **Anyone** → **Deploy**.
3. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).

**A6. Quick test**
Open the Web app URL in a browser. You should see `"ok":true` and `"keyLoaded":true`.
If `keyLoaded` is false, recheck A4 (the property name must be exactly `ANSWER_KEY`).

**If you edit Code.gs later (or already ran an older version): paste the new code, run **setup** again (it rewrites the headers), then** **Deploy → Manage deployments → pencil → Version: New version → Deploy**. The URL stays the same.
Changing `ANSWER_KEY` needs no redeploy.

---

## Part B: Update the website in your existing repo (10 minutes)

**B1. Remove the old code first.** The new version deletes files, and uploading alone never deletes anything on GitHub.
In your repo, open each of these folders, click **⋯ (top right) → Delete directory → Commit changes**:
- `src`
- `apps-script`
- `public`

**B2. Upload the new files**
1. Repo home → **Add file → Upload files**.
2. Drag in everything inside the new `luminaire` folder: `src`, `apps-script`, `.github`, `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `README.md`, `DEPLOY.md`, `.gitignore`, `.env.example`.
3. Use **Chrome or Edge** (Firefox drops folders). **Do not upload** `answer-key.json` or the `ANSWER_KEY` text file.
4. **Commit changes**.

**B3. Point the site at the new Sheet**
Repo → **Settings → Secrets and variables → Actions → Variables** → click `SHEETS_ENDPOINT` → pencil → paste the **new** Web app URL from A5 → **Update variable**.
The build now refuses to publish without this, so the site can never run with answers in the browser.

**B4. Publish**
**Actions** tab → **Deploy to GitHub Pages** → wait for the green tick (about 1 minute). If it didn't start, click **Run workflow**.
Your link is unchanged: `https://harshavardhand24.github.io/xlri-luminaire/`

---

## Part C: Test before Homecoming

1. On your phone, open the site and play once with your roll number.
2. In the Sheet:
   - **Attempts** gets a row: roll number, name, start, finish, status `finished`, score, total time, time per round (R1 to R5), the variants you got, your 5 answers and 5 right/wrong marks.
   - **Leaderboard** lists you with rank, roll number, name, score, total time and finish time.
3. Try your roll number again: it must say *already played*.
4. **Reset before the event:** delete your test rows in **Attempts** (keep row 1).

## Running the event

| Task | How |
|---|---|
| See winners | **Leaderboard** tab: highest score first, then fastest time |
| Let someone retry (phone died, wrong roll typed) | Delete their row in **Attempts** |
| Close the challenge | Script properties → add `CLOSED` = `1` (delete it to reopen) |
| A refresh mid-quiz | The quiz resumes where they were; the clock keeps running |

## What is collected (also shown on the site)

| Collected | Not collected |
|---|---|
| Name and roll number | Email, phone |
| Answers, right/wrong, score | IP address (never stored by the script) |
| Start and finish time, total time, time per round | Device or location data |

Roll numbers identify students, so **delete the Sheet (or the Attempts rows) once perks are given out**, as the notice on the site promises.

## Limits and trade-offs

| Item | Detail |
|---|---|
| Cost | ₹0 |
| Requests | 7 per player (start, 5 answers, finish). Each takes about 1 second. |
| Crowds | Requests queue for up to 25 seconds, one at a time, so two phones can't corrupt a row. A big rush of 50+ people tapping at the same second may see a short "Locking…" delay. |
| Time accuracy | Measured on Google's servers from *Start the clock* to the last answer. A slow network adds a little time for that player. |
| Roll numbers | Anyone can type any roll number. One attempt per number stops repeats, not impersonation. Check the roll number on the result screen when handing out perks. |
