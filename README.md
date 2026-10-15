# Expense Dashboard

A dark, PIN-locked dashboard for an iPhone Shortcut expense tracker. The dashboard reads two Google Sheets live: the expense log and the budget sheet.

- **Your sheets stay private.** A small Apps Script in your own Google account reads them. The page gets nothing until that script has checked your 6-digit PIN.
- **No API keys.** Nothing secret sits in this repo, and no money or data is stored here.
- **Works like an app.** In Safari, use Share → Add to Home Screen.

The site is published at `https://aizuddinreborn.github.io/Zafran-Dashboard/` once GitHub Pages is turned on (Settings → Pages → Deploy from a branch → `main` / root).

---

## Setup (one time, about 10 minutes)

### 1. Add the script to your expense sheet
1. Open your **Expense Tracker** Google Sheet on a computer.
2. Go to **Extensions → Apps Script**.
3. Delete everything in `Code.gs`, then paste in the whole of [`apps-script/Code.gs`](apps-script/Code.gs).
4. At the top, in `CONFIG`, paste the link to your **budget sheet** into `BUDGET_SHEET`. That's the sheet with *Items | Expenses | Liabilities* and *Net Income*. Leave `EXPENSE_SHEET` blank.
5. Click **Save**.

### 2. Check it can read your sheets
1. In the function list at the top, choose **testSheets**, then click **Run**.
2. Google will ask for permission. Choose your account, then **Advanced → Go to (project) → Allow**. This is your own script asking to read your own sheets.
3. The log at the bottom should say how many entries and budget lines it found.

### 3. Publish it as a web app
1. Click **Deploy → New deployment**, then the gear icon → **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**. The page still can't read anything without your PIN.
3. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.

### 4. Open the dashboard
1. Open the site on your iPhone in Safari.
2. Paste the `/exec` link. Each device remembers it.
3. **Create your 6-digit PIN**, then enter it again to confirm.
4. The first time, the page asks you to **match your budget lines** to the categories. Check the guesses and tap **Save**. You can change this any time with **Match lines** in the Budgets card.
5. In Safari, tap **Share → Add to Home Screen** to get an app icon.

## Everyday use
- The dashboard asks for your PIN every time you open it, and again after 5 minutes away.
- After 5 wrong PINs it pauses for 30 seconds, and each further round of wrong PINs doubles the pause.
- The dashboard reads fresh data from your sheets each time you unlock it, and again when you come back to it after a minute away.

## Forgot your PIN?
1. Open your expense sheet and go to **Extensions → Apps Script**.
2. Choose **resetPin** in the function list and click **Run**.
3. Reload the dashboard and create a new PIN.

Your sheets aren't touched.

## If you change the script later
After editing `Code.gs`, go to **Deploy → Manage deployments**, click the pencil icon, set **Version: New version**, then **Deploy**. This keeps the same `/exec` link.

## What the page expects
- **Expense log:** a tab with the header **Date, Category, Item, Amount, Notes**. Notes holds the payment method, such as Card, QR or Cash.
- **Categories (from the Shortcut):** Makan & Minum, Minyak Motor / Kereta, Keperluan, Telefon & Internet, Gajet, Lain-lain, Simpanan.
- **Budget sheet:** a table headed **Items | Expenses | Liabilities**, plus a **Net Income** figure.
  - The Simpanan row shows Net Income minus all spending.

## “Can’t reach your sheet”?
First, open your `/exec` link in a normal browser tab. It should show `{"ok":true,"app":"expense-dashboard","v":1}`.

- **It shows a Google sign-in page or "You need access"**: the access setting is wrong.
  1. Go to **Deploy → Manage deployments** and click the pencil icon.
  2. Set **Execute as: Me** and **Who has access: Anyone** (not "Anyone with Google account").
  3. Set **Version: New version**, then click **Deploy**.
- **It shows "Script function not found: doGet"**: the deployed version doesn't have the code yet.
  1. Save `Code.gs`.
  2. Go to **Deploy → Manage deployments** and click the pencil icon.
  3. Set **Version: New version**, then click **Deploy**.
- **It's a work or school Google account**: your organisation may block "Anyone" access. Use a personal Gmail account to own the script instead.
- **The link ends in `/dev`**: that's the test link, which only works for you while you're signed in. Use the Web app URL that ends in `/exec`.
