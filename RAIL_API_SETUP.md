# DigiTravel — free railway API setup

## Current decision

The first provider selected for a **non-commercial test** is RailRadar. Its published Free plan is ₹0, limited to 100 requests per month and 10 requests per minute. The provider's pricing page labels this plan "personal projects" and "non-commercial use". Do not use this free key for a monetised or commercial DigiTravel service unless RailRadar gives written permission.

RailRadar lists live train status, train schedules, trains between stations, a multi-stop route planner and PNR status in its API. PNR, seat-availability and fare results are aggregated from third-party public sources and are not authoritative. Users must verify critical reservation details through official IRCTC channels.

## Why a Cloudflare Worker is required

DigiTravel is hosted on GitHub Pages, which serves static files. A provider API key must not be embedded in `index.html` or any JavaScript downloaded by visitors. This Worker keeps the key in a server-side secret and exposes only a small allow-listed set of endpoints.

## Step 1 — Create a RailRadar free key

1. Open https://railradar.in/docs/quickstart
2. Create an account and activate the free API key in the developer dashboard.
3. The provider asks for a mobile number to activate API access.
4. Keep the key private. Do not paste it into GitHub files, WhatsApp, or public issue trackers.

The free quota is very small. Every API request counts, including failed requests made with a valid active key.

## Step 2 — Create a Cloudflare Worker

1. Sign in to https://dash.cloudflare.com/
2. Open **Workers & Pages** → **Create** → **Worker**.
3. Name it `digitravel-rail-api`.
4. Replace the starter code with the contents of `cloudflare/rail-api-worker.js` from this repository.
5. Deploy the Worker.

## Step 3 — Add the API key as a secret

In the Worker settings, open **Settings** → **Variables and Secrets** → **Add** → **Secret**.

- Name: `RAILRADAR_API_KEY`
- Value: paste your RailRadar key

Add a text variable:

- Name: `ALLOWED_ORIGIN`
- Value: `https://vikashp23.github.io`

Save and redeploy if Cloudflare requests it. Never add the API key as a plain text variable.

## Step 4 — Test the Worker

Replace `YOUR-WORKER-URL` with the Worker URL shown by Cloudflare.

- Live status: `GET https://YOUR-WORKER-URL/api/rail/train/12919/live`
- Schedule: `GET https://YOUR-WORKER-URL/api/rail/train/12919/schedule`
- PNR: `GET https://YOUR-WORKER-URL/api/rail/pnr/1234567890` (use only a PNR you are authorised to check; do not use this sample number as a real booking)
- Between stations: `GET https://YOUR-WORKER-URL/api/rail/trains/between/SBC/NDLS`
- Multi-stop planner: `POST https://YOUR-WORKER-URL/api/rail/journeys/plan` with JSON such as:
  ```json
  {
    "stops": ["SBC", "MAS"],
    "maxTransfers": 1
  }
  ```

The Worker does not intentionally store or cache PNR responses. Responses are marked `Cache-Control: no-store`. The allow-list only accepts the DigiTravel GitHub Pages origin by default.

## Available proxy routes

| DigiTravel Worker route | RailRadar endpoint |
|---|---|
| `GET /api/rail/train/{number}/live` | `GET /v1/trains/{number}/live` |
| `GET /api/rail/train/{number}/schedule` | `GET /v1/trains/{number}` |
| `GET /api/rail/pnr/{10-digit-pnr}` | `GET /v1/pnr/{pnr}` |
| `GET /api/rail/trains/between/{from}/{to}` | `GET /v1/trains/between/{from}/{to}` |
| `POST /api/rail/journeys/plan` | `POST /v1/journeys/plan` |

## Important limits and disclaimers

- This is not an official Indian Railways, CRIS, NTES or IRCTC integration.
- Live tracking can be stale, unavailable or wrong. Check NTES, station boards and announcements before travel.
- PNR status from this provider is third-party aggregated information, not authoritative.
- The free tier has a 100-request monthly quota and a 10-request-per-minute limit. Do not poll live status automatically. A single manual refresh should be used during testing.
- The proxy is prepared, but DigiTravel's existing front-end is not yet connected. The front-end can be safely connected only after the Worker has been deployed and its URL is known.
- If DigiTravel becomes monetised, stop using the free tier until RailRadar confirms commercial permission or a suitable paid plan is selected.

## Step 5 — Connect the DigiTravel live-status panel

The DigiTravel front end now includes a **manual live train status** lookup. It does not poll in the background. The API key remains in the Worker secret and is never placed in the website JavaScript.

1. After deploying the Worker, copy its full URL from Cloudflare (for example, `https://digitravel-rail-api.<your-subdomain>.workers.dev`).
2. Open `index.html` in GitHub and find `DIGITRAVEL_RAIL_API_BASE` near the start of the JavaScript section.
3. Replace the empty string with your Worker URL, keeping the quotes. Do not add the API key here.
4. Commit the change and wait for GitHub Pages to publish it.
5. Open DigiTravel → Compare → Rail and test one train number manually.

If you share the Worker URL after deployment, the front-end configuration can be completed for you. Never share the RailRadar API key.

## Current quota interpretation

RailRadar's current [Rate Limits documentation](https://railradar.in/docs/rate-limits) and [Quickstart](https://railradar.in/docs/quickstart) state **100 requests per month and 10 requests per minute** for Free. Its [Pricing page](https://railradar.in/pricing) currently displays 1,000 requests per month, which conflicts with those technical documents. Until RailRadar confirms the discrepancy in writing, DigiTravel uses the conservative 100-request monthly limit. Do not run automated refreshes.

The free plan is marked personal / non-commercial. Keep this integration for non-commercial testing only. If DigiTravel is monetised or used commercially, stop using this free key until RailRadar confirms the appropriate licence in writing.

The live-status panel displays third-party information only. It is not an official railway source and must not be used as the sole basis for travel decisions. Verify critical updates through NTES, IRCTC and station announcements.
