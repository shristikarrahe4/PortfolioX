# PortfolioX — Student Digital Portfolio Builder

A full-stack web application that helps college students turn their projects, skills and achievements into a professional, shareable portfolio, and shows them how complete that portfolio is through the **Portfolio Readiness Meter**.

## 1. Project overview
Students create an account, fill in a profile, add projects and achievements, generate a printable resume, publish a public portfolio link and follow a placement-preparation checklist. All data is stored in Supabase PostgreSQL; the browser talks to an Express.js API.

## 2. Problem statement
Many students have skills and academic projects but no single place to present them professionally, and they do not know what a recruiter-ready portfolio should contain or what they still need to improve. PortfolioX gives them one place to manage this information, a clear completeness score, and concrete next steps.

## 3. Objectives
- Let students manage professional information in one place.
- Let them publish a clean public portfolio and print a resume.
- Show a transparent readiness score with actionable suggestions.
- Demonstrate secure full-stack practice (authentication, validation, Row Level Security) at a first-year level.

## 4. Target users
College students, especially first-year B.Tech students preparing for internships and placements.

## 5. Implemented features
| Feature | Where |
|---|---|
| Landing page | `/` (`index.html`) |
| Sign up, log in, log out, email confirmation, forgot/reset password | `signup.html`, `login.html`, `forgot-password.html`, `reset-password.html` (Supabase Auth) |
| Dashboard (stats, readiness, recent projects, checklist, next action) | `dashboard.html` |
| Profile builder + public-sharing settings | `profile.html` |
| Projects manager (add/edit/delete, search, category filter, featured) | `projects.html` |
| Achievements and certifications (add/edit/delete, public/private) | `achievements.html` |
| Portfolio Readiness Meter + recommendations + checklist | `readiness.html` |
| Resume builder with live preview and print-to-PDF | `resume.html` |
| Public portfolio and owner preview | `/u/<username>`, `portfolio.html?preview=1` |
| Friendly 404 page | `404.html` |

## 6. Technology stack
HTML5, CSS3, vanilla JavaScript (frontend) · Node.js + Express.js (backend) · Supabase PostgreSQL (database) · Supabase Auth · Git/GitHub.
npm packages: `express`, `helmet`, `express-rate-limit`, `dotenv`, `@supabase/supabase-js`. No paid services, AI APIs or frameworks.

## 7. Folder structure
```
portfoliox/
├── README.md
├── .gitignore
├── database/
│   └── schema.sql
├── backend/
│   ├── package.json            (package-lock.json is created by `npm install`)
│   ├── .env                    (placeholders only - you fill it in; never commit)
│   ├── .env.example
│   ├── .gitignore
│   ├── server.js
│   ├── middleware/             auth.js, errors.js
│   ├── routes/                 crud.js, profile.js, projects.js, achievements.js,
│   │                           resume.js, readiness.js, portfolio.js
│   ├── utils/                  constants.js, validate.js, schemas.js, readiness.js,
│   │                           data.js, supabase.js, respond.js
│   └── tests/                  readiness.test.js, validate.test.js
└── frontend/
    ├── index.html, signup.html, login.html, forgot-password.html, reset-password.html,
    │   dashboard.html, profile.html, projects.html, achievements.html,
    │   readiness.html, resume.html, portfolio.html, 404.html
    ├── css/style.css
    ├── js/                     common.js + one script per page (auth.js handles the 4 auth pages)
    └── assets/favicon.svg
```

## 8. Prerequisites
- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js LTS](https://nodejs.org/) (18 or newer; includes npm)
- [Git](https://git-scm.com/downloads)
- A free [Supabase](https://supabase.com/) account

Check in a terminal: `node -v` (prints e.g. `v20.x.x`), `npm -v` (prints e.g. `10.x.x`), `git --version` (prints `git version 2.x`). If a command says "not recognized", close and reopen VS Code after installing, or reinstall.

## 9. Setup guide (Windows + VS Code)

### Step 1 – Extract and open
Right-click `portfoliox.zip` → **Extract All…**. Open VS Code → **File → Open Folder…** → choose the extracted `portfoliox` folder. You should see `backend`, `database`, `frontend`, `README.md` in the Explorer. (Make sure it is not nested like `portfoliox/portfoliox`.)

### Step 2 – Install dependencies
Open the terminal: **Terminal → New Terminal**. Run:
```
cd backend
npm install
```
npm downloads the libraries listed in `package.json` into `node_modules/` and creates `package-lock.json`. Success looks like "added NN packages". If it fails: check your internet, run `node -v`, delete the `node_modules` folder and try again.

### Step 3 – Create a Supabase project
1. Sign in at supabase.com → **New project**. Choose a name, a strong database password (save it somewhere private) and a nearby region. Wait until the project finishes setting up.
2. Open **Project Settings → API** (or **API Keys**). You need:
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **Publishable key** (starts with `sb_publishable_`; older projects call it the **anon public** key).

### Step 4 – Create the database
Supabase Dashboard → **SQL Editor → New query**. Open `database/schema.sql` in VS Code, copy **all** of it, paste into the editor and click **Run**. Expected: "Success. No rows returned". Open **Table Editor** and check that `profiles`, `projects`, `achievements`, `resume_details` and `checklist_items` exist and show **RLS enabled**. The script is safe to run again.

### Step 5 – Configure environment variables
Open `backend/.env` (a copy of `.env.example`) and replace the placeholders:
```
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```
Save the file. Never paste your keys into a public chat, screenshot or GitHub.

**Publishable vs privileged keys.**
- The **publishable (anon)** key is *designed* to be used in browsers. It only gives the access that your Row Level Security policies allow. PortfolioX sends it to the browser through `/api/config`.
- The **secret / service_role** key bypasses Row Level Security and gives full database access. **PortfolioX does not need it and never uses it.** Never put it in browser code, `.env.example` or GitHub.
- `.env.example` is safe to commit because it contains only placeholders. `.env` holds your real values and must never be uploaded (it is listed in `.gitignore`).

### Step 6 – Configure Supabase Auth
In Supabase: **Authentication → URL Configuration**:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/login.html` and `http://localhost:3000/reset-password.html`

Under **Authentication → Providers → Email**, "Confirm email" is on by default (recommended). The free built-in email sender has a low hourly limit; for a demo, create only a few accounts, or temporarily turn "Confirm email" off while testing.

### Step 7 – Start the backend
In the terminal, inside the `backend` folder:
```
npm start
```
Expected output:
```
PortfolioX is running at http://localhost:3000
Health check:        http://localhost:3000/api/health
```
If you see "Supabase is not configured", fix `.env` (Step 5).

### Step 8 – Open PortfolioX
Open **http://localhost:3000** in your browser. Always use this address; do not double-click the HTML files or use Live Server, because the pages need the Express server for the API and for the `/vendor/supabase.js` library.
Health check: **http://localhost:3000/api/health** should show `"database":"connected"`.

### Step 9 – Authentication flow
Sign up → open the confirmation email → click the link (you land on the login page, usually already logged in) → dashboard. Log out from the sidebar. "Forgot password?" sends a reset link to `reset-password.html` where you choose a new password.

## 10. Architecture
```
Browser (HTML/CSS/JS) ──fetch /api/*  + Bearer token──▶ Express backend ──user's token──▶ Supabase PostgreSQL (RLS)
        └── Supabase Auth (signup/login/reset) directly from the browser ◀───────────────┘
```
Express serves the `frontend/` folder and the API. The browser logs in through Supabase Auth and sends the access token with every private API call. The backend verifies the token with Supabase, then queries the database **as that user**, so PostgreSQL Row Level Security enforces ownership.

## 11. Database relationships
```
auth.users (Supabase Auth)
   └── profiles (id = auth user id, 1:1, ON DELETE CASCADE)
          ├── projects          (user_id → profiles.id, 1:many)
          ├── achievements      (user_id → profiles.id, 1:many)
          ├── resume_details    (user_id → profiles.id, 1:1)
          └── checklist_items   (user_id → profiles.id, unique per task)
```
A trigger creates the `profiles` row when someone signs up. Scores and recommendations are **not stored**; they are calculated from saved data on each request, so they can never be stale.

## 12. Authentication and Row Level Security
- Supabase Auth is the only login system; no passwords are stored by PortfolioX.
- `middleware/auth.js` reads the `Authorization: Bearer` token, verifies it with `auth.getUser(token)` and sets `req.user`. The user id **always** comes from the verified token, never from the request body or URL.
- Every private table has RLS policies such as `user_id = auth.uid()`. Even a buggy route cannot read another student's rows.
- Anonymous visitors have **no** table privileges. The public portfolio is served only by the SQL function `get_public_portfolio(username)`, which returns just the published fields. Internal function `portfolio_json` is not callable by the public.
- Database CHECK constraints repeat the main validation rules, so data written directly through Supabase's API is also constrained.

## 13. API endpoints
All responses look like `{ "ok": true, "data": ... }` or `{ "ok": false, "error": { "message", "fields?" } }`.

| Method & path | Access | Purpose |
|---|---|---|
| `GET /api/health` | public | Server + database/schema check |
| `GET /api/config` | public | Supabase URL, publishable key, category lists |
| `GET /api/portfolio/:username` | public | Published portfolio fields only (404 if private/unknown) |
| `GET /api/profile` · `PUT /api/profile` | login | Read / save own profile |
| `GET /api/projects` · `POST` · `PUT /:id` · `DELETE /:id` | login | Own projects |
| `GET /api/achievements` · `POST` · `PUT /:id` · `DELETE /:id` | login | Own achievements |
| `GET /api/resume` · `PUT /api/resume` | login | Resume data / save resume-only fields |
| `GET /api/readiness` | login | Score, breakdown, recommendations |
| `GET /api/checklist` · `PUT /api/checklist` | login | Checklist (auto + manual); `PUT` toggles manual tasks only |
| `GET /api/dashboard` | login | Everything the dashboard shows |
| `PUT /api/portfolio/settings` | login | Username, publish on/off, visibility options |
| `GET /api/portfolio-preview` | login | Your own portfolio as visitors would see it |

Public page URL: `http://localhost:3000/u/<username>`.

## 14. Portfolio Readiness Meter – scoring rules
Every item is simply done or not done. Points come only from saved data (opening a page or clicking a button earns nothing).

| Criterion (max) | Items and points |
|---|---|
| Basic profile (20) | Full name 4 · headline (5+ chars) 4 · college 4 · course 4 · year of study 4 |
| Professional introduction (10) | Introduction ≥ 20 characters 5 · ≥ 50 characters 5 |
| Skills (15) | ≥ 1 technical skill 5 · ≥ 3 technical skills 5 · ≥ 1 soft skill 2 · ≥ 2 soft skills 3 |
| Meaningful projects (20) | ≥ 1 complete project 12 · a project has a GitHub or live link 4 · ≥ 2 complete projects 4 |
| Achievements (10) | ≥ 1 achievement 6 · ≥ 2 achievements 4 |
| Resume information (15) | Objective (≥ 20 chars), phone, location, education summary, availability: 3 each |
| Professional links (10) | GitHub link saved 5 · LinkedIn link saved 5 |

A *complete project* has a title, a description of 20+ characters and at least one technology. A *complete achievement* has a title, an organisation and a date. Recommendations are generated from the items that are not done, sorted by points, each linking to the page where it can be fixed. The score updates right after each save (toast message + sidebar widget).

**The score measures portfolio completeness only. It is not a prediction of employability and does not guarantee an internship or placement.** There is no AI or randomness.

The **checklist** has 6 automatic tasks (derived from the same items as the score, so they always agree) and 4 manual tasks you tick yourself (saved in `checklist_items`; they do not change the score).

## 15. Public portfolio sharing and privacy
Choose a username and tick "Make my portfolio public" on the Profile page. Public data: name, headline, introduction, skills, GitHub/LinkedIn/website links, and projects/achievements marked **Public**. Optional (you choose): college/course/year, interests, contact email. Never public: account email, phone, location, resume details, checklist, internal ids. Unknown and private usernames show the same "unavailable" message.

## 16. Resume preview and saving as PDF
Saved in your account: career objective, phone, location, education summary, availability. Generated from other pages: name, headline, contact email, links, college/course/year, skills, up to 5 projects (featured first), up to 6 achievements. Click **Print / Save as PDF** and choose "Save as PDF" in the browser's print window. Printing hides everything except the resume.

## 17. Testing

### Automated tests (no Supabase needed)
```
cd backend
npm test
```
Runs 16 tests covering the scoring rules, checklist consistency, validation and a check that backend field names exist in `schema.sql`.

### Manual test checklist (needs your Supabase project)
| # | Action | Expected result |
|---|---|---|
| 1 | Open `/api/health` | `"database":"connected"` |
| 2 | Sign up with a real email | "Check your email" message; confirmation email arrives |
| 3 | Click the confirmation link, then log in | Dashboard opens with your name |
| 4 | Log out, then open `/dashboard.html` | Redirected to login |
| 5 | Wrong password on login | "Email or password is incorrect." |
| 6 | Forgot password → open email link → set new password | Redirected to login with "Password updated" |
| 7 | Open the reset link a second time later / an old link | "invalid or expired" message |
| 8 | Save profile with an empty name; with `javascript:alert(1)` as GitHub URL | Red field errors; nothing saved |
| 9 | Save valid profile, refresh page | Values are still there; completion bar updated |
| 10 | Add a project, search it, filter by category, edit it | Card appears/updates; readiness toast shows increase |
| 11 | Delete a project | Confirmation dialog; card removed after confirming |
| 12 | Add/edit/delete an achievement | Same behaviour; score changes |
| 13 | Open Readiness page | Score, breakdown, suggestions with working links |
| 14 | Fill resume details; check readiness | Resume points added (15 when all five are filled) |
| 15 | Resume page → Print / Save as PDF | Only the resume appears in print preview |
| 16 | Profile → set username, tick public, save | Link shown; opening `/u/<username>` in a private window shows the portfolio |
| 17 | Untick public, reload the link | "Portfolio unavailable" |
| 18 | Use an already-taken username (second account) | "That username is already taken" |
| 19 | Untick "Show contact email" | Email not visible on the public page |
| 20 | Tick/untick a manual checklist task, refresh | State persists; automatic tasks cannot be unticked |
| 21 | Stop the server and click Save | Error message "Cannot reach the PortfolioX server" |
| 22 | With two accounts, copy a project id from one and call `DELETE /api/projects/<id>` with the other account's token | 404 "not found" (RLS hides it) |
| 23 | Resize the browser to phone/tablet/desktop widths | Sidebar becomes a menu on small screens; no sideways scrolling |
| 24 | New account with no data | Empty states with "Add your first project" etc. |

## 18. Troubleshooting
| Problem | Likely cause | Check | Fix |
|---|---|---|---|
| `Failed to fetch` / "Cannot reach the PortfolioX server" | Server not running or wrong address | Is the terminal showing "PortfolioX is running"? | Run `npm start` in `backend`; use `http://localhost:3000` |
| "Supabase is not configured" at start | `.env` still has placeholders | Open `backend/.env` | Enter your URL and publishable key, save, restart |
| Health says `database: error` | Wrong key/URL, or schema not run | Re-copy values from Supabase; look in Table Editor | Fix `.env`, run `schema.sql` |
| "database is not set up correctly" | Missing tables/functions | Table Editor | Run all of `schema.sql` |
| "You are not allowed to do that" (403) | RLS policy missing | Re-run `schema.sql` | Run it again completely |
| Page redirects to login repeatedly / "session expired" | Expired or invalid token | Log in again | Log out and log in; clear site data if needed |
| Confirmation email never arrives | Email rate limit or spam | Check spam; Supabase logs | Wait an hour, or turn off "Confirm email" while testing |
| Confirmation/reset link opens a wrong or dead page | Redirect URLs not set | Authentication → URL Configuration | Add the two redirect URLs, set Site URL to `http://localhost:3000` |
| Page has no styling or buttons do nothing | CSS/JS blocked or page opened from disk | Browser console (F12) | Open through `http://localhost:3000`; hard refresh (Ctrl+F5) |
| `/vendor/supabase.js` 404 | `npm install` not run | `backend/node_modules` exists? | `cd backend` then `npm install` |
| `EADDRINUSE` port in use | Another program uses port 3000 | — | Change `PORT` in `.env` (e.g. 3001); update Supabase URLs to match |
| `npm install` fails | Network or old Node | `node -v` is 18+? | Update Node, retry, delete `node_modules` |

## 19. Uploading to GitHub
1. On github.com create a new **empty** repository named `portfoliox` (do not add a README).
2. In the VS Code terminal, from the **root** `portfoliox` folder (not `backend`):
```
git init
git status
git add .
git status
```
3. **Check that `backend/.env` is NOT listed** (and `node_modules/` is not listed). `backend/.env.example` should be listed. If `.env` appears, stop and check `.gitignore`.
```
git commit -m "Initial commit: PortfolioX"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portfoliox.git
git push -u origin main
```
4. Refresh the GitHub page and confirm the files are there and `.env` is not.

If git says "Please tell me who you are", run `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`.
**Adding a secret to `.gitignore` after committing it does not remove it from history.** If a real key was ever committed or pushed, rotate it in Supabase immediately.

## 20. Security considerations
Supabase Auth only; token verified on every private request; RLS on all private tables; server-side validation of every field; safe DOM rendering (`textContent`, no `innerHTML` with user data); a strict Content-Security-Policy (no inline scripts); request-size limit (100 KB); rate limits (general + failed private requests); generic error messages (details only in the server console); no service-role key anywhere; public data limited to a SQL function.

## 21. Current limitations
- Email delivery depends on Supabase's built-in sender (low limits).
- Credentials, certificates and project claims are entered by the student and are **not verified**.
- The Supabase browser library loads from `node_modules`, so `npm install` is required before first use.
- Public pages are not cached or SEO-optimised (they render in the browser).
- No admin role, no image/file upload, one portfolio theme and one resume template.
- Deployed hosting is not covered; the guide targets local use.

## 22. Future improvements
Multiple portfolio themes · public-view analytics · skill-development tracking · internship application tracker · portfolio version history · more resume templates · export/import · further accessibility work · more detailed privacy controls.
