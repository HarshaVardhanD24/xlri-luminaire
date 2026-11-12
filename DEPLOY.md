# Deploying Luminaire: GitHub Pages + Google Sheets

Total time: about 20 minutes. Cost: ₹0. You need a Google account and a GitHub account.
Nothing in this repository is secret; the only secret (the dashboard passcode) lives in your Google account.

---

## 0. Project check (already done)

| Question | Answer |
|---|---|
| Can it be hosted as a static site on GitHub Pages? | **Yes.** It is a Vite + React single-page app with no server code. The dashboard uses `#admin`, which works on static hosting. |
| Does it need a build step? | **Yes** (`npm run build` → `dist/`). The included workflow `.github/workflows/deploy.yml` runs tests, builds and publishes automatically on every push to `main`. |
| Anything GitHub Pages cannot run? | Only the data storage. That is handled by a free Google Apps Script web app attached to your Google Sheet (Part A). |

### Why there is no Google Form
The site's six-question quiz is custom: it scores answers live, shows the reveal and the result, and must keep its design.
A Google Form would be a separate page and could not do that. Instead, the Apps Script web app receives the quiz answers
and writes them to the Sheet. The **Responses** tab gets one row per finished quiz, exactly like a Form's response sheet.
That web app is the "extra setup" the custom questionnaire needs, and Part A covers it.

---

## Part A: Google Sheet + Apps Script (about 10 minutes)

Use a **personal Gmail account**. Some college Google Workspace accounts hide the "Anyone" access option in step A6.

**A1. Create the Sheet**
1. Go to **sheets.new** (opens a blank Google Sheet).
2. Click **Untitled spreadsheet** (top left) and name it `Luminaire Analytics`.

**A2. Open Apps Script**
1. In the Sheet menu: **Extensions → Apps Script**. A new tab opens with a file called `Code.gs`.
2. Click **Untitled project** (top left) and name it `Luminaire`.

**A3. Paste the code**
1. In `Code.gs`, select everything and delete it.
2. Open `apps-script/Code.gs` from this repository, copy all of it, paste it in.
3. Press **Ctrl+S** (Mac: **Cmd+S**).

**A4. Run setup once**
1. In the toolbar function dropdown (next to **Debug**), choose **setup**, then click **Run**.
2. A box says *Authorization required*: click **Review permissions** → pick your Google account.
3. You will see *Google hasn't verified this app* (normal for your own script): click **Advanced** → **Go to Luminaire (unsafe)** → **Allow**.
4. The log shows *Execution completed*. Back in the Sheet you now have three tabs: **Summary**, **Events**, **Responses**.

The script can only edit this one spreadsheet. It does not read your email, Drive or anything else.

**A5. Set the dashboard passcode (your only secret)**
1. In Apps Script, click the **gear icon (Project Settings)** on the left.
2. Scroll to **Script Properties** → **Add script property**.
3. Property: `ADMIN_PASSCODE` Value: a passcode you choose (e.g. a long phrase). Click **Save script properties**.

**A6. Deploy as a web app**
1. Top right: **Deploy → New deployment**.
2. Click the **gear icon** next to *Select type* → **Web app**.
3. Fill in:
   - Description: `Luminaire v1`
   - Execute as: **Me (your email)**
   - Who has access: **Anyone**
4. Click **Deploy** (authorize again if asked, same steps as A4).
5. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`. You need it in Part B.

**A7. Quick test**
1. Paste the Web app URL into a new browser tab. You should see `{"ok":true,"service":"luminaire",…}`.
2. Optional: in Apps Script choose **testTrack** in the function dropdown → **Run**. The **Events** tab gets 2 rows and **Responses** gets 1 row (source `editor-test`). Delete those test rows afterwards.

**If you change Code.gs later:** **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**. The URL stays the same.

---

## Part B: Publish on GitHub Pages (about 10 minutes)

**B1. Create the repository**
1. github.com → **+** (top right) → **New repository**.
2. Repository name: `xlri-luminaire` (any name works). Visibility: **Public** (free GitHub Pages requires a public repo). Do not add a README. Click **Create repository**.

**B2. Upload the code** (pick one)
- *With GitHub Desktop or git:* from this folder run
  ```bash
  git init && git add . && git commit -m "Luminaire"
  git branch -M main
  git remote add origin https://github.com/<your-username>/xlri-luminaire.git
  git push -u origin main
  ```
- *In the browser:* on the new repo page click **uploading an existing file**, drag in **everything inside this folder** (not `node_modules`), and click **Commit changes**.
  The `.github` folder must be included. On a Mac, press **Cmd+Shift+.** in Finder to see hidden folders.
  If it still gets left out: **Add file → Create new file**, name it `.github/workflows/deploy.yml`, paste that file's contents, **Commit changes**.

**B3. Connect the Google Sheet**
1. Repo → **Settings → Secrets and variables → Actions** → **Variables** tab → **New repository variable**.
2. Name: `SHEETS_ENDPOINT` Value: your Web app URL from A6. Click **Add variable**.

This URL is a public address (every visitor's browser calls it), so it is a *variable*, not a secret. No passwords or keys go into GitHub.

**B4. Turn on Pages**
1. Repo → **Settings → Pages**.
2. Under *Build and deployment*, **Source: GitHub Actions**.

**B5. Deploy and find your URL**
1. Repo → **Actions** tab → **Deploy to GitHub Pages**. If nothing is running, click **Run workflow → Run workflow**.
2. Wait for the green tick (about 1 minute).
3. **Settings → Pages** now shows *Your site is live at* `https://<your-username>.github.io/xlri-luminaire/`. That is your public URL.

If you add `SHEETS_ENDPOINT` after the first deploy, re-run the workflow (step B5.1) so the site picks it up.

---

## Part C: Confirm data is reaching the Sheet

1. Open your public URL on your phone, finish the quiz once.
2. In the Sheet, within about 5 seconds:
   - **Events** shows a `page_load` row, then `quiz_start`, `question_view` 1 to 6, `quiz_complete`.
   - **Responses** shows one row: result, runner-up, your six letters (Q1 to Q6), seconds taken.
   - **Summary** shows *Page loads* and *Quiz completions* going up.
3. Open `https://<your-username>.github.io/xlri-luminaire/#admin`, enter your passcode: the live dashboard loads (refreshes every 30 s).
4. Delete your own test rows before Homecoming if you want clean numbers (keep row 1, the headers).

Nothing appears? Check, in order: the Web app URL opens and shows `"ok":true` · "Who has access" is **Anyone** · the GitHub variable is named exactly `SHEETS_ENDPOINT` and you re-ran the workflow after adding it.

---

## QR codes per installation

Add `?src=` to each QR so the dashboard compares locations:

```
https://<your-username>.github.io/xlri-luminaire/?src=main-gate
https://<your-username>.github.io/xlri-luminaire/?src=auditorium
```

Use lowercase letters, numbers and hyphens only. Print 15 cm or wider, error correction **H**, and test with an Android and an iPhone camera.

---

## What is collected (also shown on the site)

| Collected | Not collected |
|---|---|
| Page loads with time, device type (mobile/tablet/desktop), QR source | Names, emails, phone numbers, roll numbers |
| Quiz progress, your six answers as letters, result, runner-up, time taken | IP addresses (the script never stores them) |
| Share actions (share sheet / download / copy link), retakes | Any login or account |
| A random code for the browser tab, so steps of one visit can be linked | Anything that identifies a person |

**Page loads are not unique people.** A refresh counts again, and one person in two tabs counts twice. The dashboard labels these as *page loads* and *browser sessions*.

---

## Costs, limits, privacy tradeoffs

| Item | Detail |
|---|---|
| Cost | ₹0. GitHub Pages and Google Apps Script/Sheets are free for this use. |
| GitHub Pages limits | Public repo on a free account; sites up to 1 GB; soft limits of about 100 GB bandwidth per month and 10 builds per hour. This site is under 1 MB. |
| Traffic | The site batches events: about 2 to 5 requests per visit. At 100 visits per hour that is roughly 200 to 500 requests per hour. |
| Apps Script limits | Google caps simultaneous executions and runtime per account; see developers.google.com/apps-script/guides/services/quotas. This load is well inside them. If a request ever fails, the visitor's experience is unaffected; only that event is missed. |
| Sheet size | A Google Sheet holds up to 10 million cells: roughly 800,000 event rows here, far beyond a two-day event. |
| Open endpoint | Anyone who finds the web app URL could send fake events. The script accepts only valid, size-limited values (and blocks spreadsheet formulas), but treat numbers as indicative, not audited. |
| Google's processing | Requests pass through Google's servers, which see visitors' IP addresses as for any Google service. The script itself does not store them. |
| Who can see the data | Only people you share the Google Sheet with, plus anyone with the dashboard passcode. The landing page shows only total match counts. |
| Retention | Delete or archive the Sheet after Homecoming if you no longer need the data. |
