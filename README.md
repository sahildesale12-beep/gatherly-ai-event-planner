# Gatherly AI — Celebration & Event Planner

Gatherly AI is a responsive event-planning web app built for weddings, birthdays, community events and more. It turns basic event details into a budget breakdown, event-day running order, pre-event milestones, vendor checklist, personalized ideas and an actionable to-do list.

> **Challenge:** PromptWars — Challenge 5: Celebration & Event Planner  
> **Submission constraint:** Keep the public GitHub repository under 10 MB.

## Features

- **AI-assisted planning:** Uses Google's Gemini API on the server when a key is configured. The model can adapt recommendations to the event type, date, location, guest count, currency, vibe, priorities and practical constraints.
- **Works without an API key:** Built-in demo mode creates a sample plan locally, so the app can be tested immediately. The UI identifies demo mode; it does not pretend the fallback is a live AI response.
- **Budget breakdown:** Allocates the total budget into categories and includes practical cost-control notes. Allocations are estimates, not live supplier quotes.
- **Event timeline:** Produces an event-day running order and milestones for the weeks leading up to the event.
- **Vendor checklist:** Supplies questions and checks to use while comparing venue, catering, decor, AV, photo and entertainment options.
- **Personalized ideas:** Suggests small touches based on the event's theme and audience.
- **Interactive checklist:** Tick off tasks and see completion progress.
- **Save and reopen plans:** Saves up to 12 plans in the current browser using local storage.
- **Export and print:** Export a plan as a Markdown file, or use your browser's Print command to save a PDF.
- **Responsive UI:** Designed for laptop, tablet and mobile.
- **No frontend API key:** The Gemini key is stored in server environment configuration, never in browser JavaScript.

## Tech stack

- HTML5, CSS3 and vanilla JavaScript
- Node.js HTTP server (built-in modules; no npm packages required)
- Google Gemini API (optional; real AI mode)
- Browser `localStorage` for saved plans

## Requirements

- Node.js 20 or later
- Internet access only if you want to use the live Gemini API or load the optional Google Fonts

## Run locally

1. Download or clone this repository.
2. Open a terminal in the project folder.
3. Start the server:

   ```bash
   npm start
   ```

4. Open **http://localhost:3000** in your browser.

No `npm install` is needed because this project uses only Node.js built-in modules.

### Enable live Gemini AI (optional)

1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to a new file named `.env`.
3. Paste the key into `.env`:

   ```env
   GEMINI_API_KEY=your_real_key_here
   GEMINI_MODEL=gemini-3.8-flash
   PORT=3000
   ```

4. Stop and restart the server (`Ctrl+C`, then `npm start`).
5. The top navigation should display **Gemini AI ready**. Generate a plan and confirm the notice says it was generated with Gemini AI.

Never commit `.env` or expose your real API key in screenshots, videos, source files, or a public repository. `.gitignore` excludes the `.env` file. API availability/model names can change; `GEMINI_MODEL` can be adjusted without changing the source code.

## How to use

1. Enter the event name and select the event type.
2. Add the event date/location if known.
3. Enter a budget, currency and approximate guest count.
4. Choose a vibe and duration; add priorities or dietary/accessibility notes if useful.
5. Select **Create my event plan**.
6. Review the budget, event-day schedule, milestones, supplier prompts and suggested ideas.
7. Tick tasks as you complete them, then save or export the plan.

## Project structure

```text
gatherly-ai-event-planner/
├── public/
│   ├── app.js          # Form logic, rendering, save/load and export
│   ├── favicon.svg     # Small app icon
│   ├── index.html      # Accessible, responsive app interface
│   └── styles.css      # Layout and visual styling
├── .env.example        # Safe environment-variable template
├── .gitignore          # Excludes keys and local files
├── package.json        # Run scripts and Node version
├── server.js           # Static server + Gemini API + demo fallback
├── DEMO_VIDEO_SCRIPT.md
├── SUBMISSION_CHECKLIST.md
└── LICENSE
```

## API behavior and privacy notes

- `GET /api/status` reports whether the server has a Gemini key configured.
- `POST /api/plan` validates the submitted event fields and returns a plan.
- The Gemini key remains on the server. Event details are sent to Google only when live AI mode is enabled.
- With no key, event fields are processed by the built-in demo planner and the event is not sent to an AI provider.
- Saved plans are kept in the current browser's `localStorage`; they are not synced to an account or shared across browsers.
- The app does not book vendors or verify venue availability, and its budget numbers should not be treated as quotes.

## Deployment

This app requires a Node.js host for live AI mode, because the server must keep the API key private. Deploy the repository to a Node.js-compatible platform, set the environment variables `GEMINI_API_KEY` and optionally `GEMINI_MODEL`, then expose the assigned port. For local or demo-only review, run it with no API key to use demo mode.

## GitHub submission under 10 MB

The source package is intentionally lightweight and has no `node_modules`, build output, video, or other large assets. Before submitting, check the repository size in GitHub and ensure it is public. The challenge instructions say restricted/private repositories will not be evaluated.

```bash
git init
git add .
git commit -m "Build Gatherly AI event planner"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/gatherly-ai-event-planner.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. If the remote repository already exists, use its actual URL instead of adding a second remote.

## License

MIT — see `LICENSE`.
