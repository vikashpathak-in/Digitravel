# 🧭 DigiTravel – India's Smart Travel Knowledge Platform

DigiTravel is a static-first travel planning platform designed to simplify Indian itineraries, highway stopover discoveries, group expense tracking, and non-biased platform comparisons.

## 🚀 Key Features
* **100% GitHub Pages Compatible**: Constructed using pure HTML5, CSS3 (Glassmorphism design), and Vanilla Javascript (ES6).
* **Location & Route Intelligence**: Provides highway checkpoints, driving times, food stops, and Google Maps previews for Indian travel routes.
* **Non-Booking Platform Comparison**: Connects users to official sources (like IRCTC, KSRTC, IndiGo) without selling tickets directly.
* **Group Expense Splitter**: Features an integrated expense manager that exports shareable summaries to WhatsApp and PDF.
* **Floating AI Assistant**: Redirects queries to WhatsApp or Telegram bots via `config.json`.

---

## 🛠️ Deployment Instructions (GitHub Pages)
1. Commit and push the repository to your GitHub account.
2. Navigate to **Settings > Pages** within your GitHub repository.
3. Under **Branch**, select `main` (or `master`) and specify the `/ (root)` directory.
4. Click **Save**. Your site will be live at `https://<your-username>.github.io/<repository-name>/`.

---

## ⚡ Future Firebase Integration
To enable Firebase Authentication and Firestore synchronization:
1. Create a Firebase project at the [Firebase Console](https://console.firebase.google.com/).
2. Obtain your web app configuration credentials.
3. Open `js/firebase-config.js` and update the `firebaseConfig` object keys.

---

## ➕ Adding New States or Destinations
Edit `json/destinations.json`:
* Add new entries to `states` to update the **India Explorer** grid.
* Add complete travel profiles under `featuredDestinations` including `checkpoints`, `foodStops`, and `faqs`.

## 🚆 Railway API (non-commercial test)

A secure Cloudflare Worker proxy template and setup guide are available in [RAIL_API_SETUP.md](RAIL_API_SETUP.md). The API key must be stored as a Cloudflare Worker secret, never in the GitHub Pages front-end.

**Free-tier restriction:** RailRadar currently lists its free API tier for personal, non-commercial use only, with 100 requests/month and 10 requests/minute. Do not use it for a monetised service without written provider permission. The proxy is a setup scaffold; it is not active until a Worker is deployed and the front-end is configured with its URL.

## 🚆 Live train status (manual lookup)

The Rail section includes a manual live train status panel backed by a Cloudflare Worker proxy. It is intentionally not auto-refreshed. The free RailRadar sandbox is for non-commercial testing and the technical docs currently specify 100 requests/month and 10 requests/minute; see [RAIL_API_SETUP.md](RAIL_API_SETUP.md) before enabling it. The front-end Worker URL remains unconfigured until the Worker is deployed. Never place the provider API key in `index.html`.

## 🎉 Daily greeting

DigiTravel shows a one-time Diwali greeting on 8 November 2026 and a time-based daily greeting (morning / afternoon / evening) once per day per browser.
