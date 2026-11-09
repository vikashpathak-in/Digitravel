# DigiTravel railway data — research and implementation decision

**Research checked:** 9 November 2026  
**Repository:** [vikashpathak-in/Digitravel](https://github.com/vikashpathak-in/Digitravel)  
**Live site:** [https://vikashpathak-in.github.io/Digitravel/](https://vikashpathak-in.github.io/Digitravel/)

## Current implementation state

- The Smart Rail Journey Planner is a request-preparation form. It collects From/To, date, class, quota and passenger count, validates basic inputs, shows a request summary, and hands off to IRCTC or WhatsApp. It does **not** retrieve live schedules, fares, availability or route alternatives.
- The separate Railway Search page has a prepared direct/connecting search UI, but it cannot return provider data until the Worker is deployed and `DIGITRAVEL_RAIL_API_BASE` is configured.
- `cloudflare/rail-api-worker.js` is a proxy scaffold. It has no working provider credential until `RAILRADAR_API_KEY` is added as a Cloudflare secret.
- No API key, deployed Worker URL or live API response was available in this review. No booking, PNR lookup or personal-data submission was made.

## Provider assessment

### 1. Official IRCTC Train Information Enquiry Scheme (TIES)

This is the best route if authoritative railway information is mandatory. IRCTC's official TIES policy describes a **non-booking** information service covering train availability and fare, trains between stations, station clusters, train schedules, boarding stations and PNR enquiry.

The official IRCTC-hosted policy file currently located during this review is Edition 2023 (effective 13 April 2023). Its published website-platform charges are:

| Item | General firm | Eligible Startup/MSME |
|---|---:|---:|
| One-time integration | ₹10 lakh + taxes | ₹5 lakh + taxes |
| Minimum annual business commitment | ₹5 lakh + taxes | ₹2.5 lakh + taxes |
| Refundable security deposit | ₹5 lakh | ₹5 lakh |
| Enquiry charge | ₹0.25 + taxes per successful enquiry; minimum annual commitment applies | Same |

The policy also requires a registered eligible entity, supporting financial/recognition documents, an agreement and technical integration after approval. The TIESP must not transfer or share the IRCTC enquiry API/service with third parties. The policy does not publish self-service API keys or endpoint specifications; those are part of the approved integration.

**Decision:** authoritative, but expensive and formal. Confirm the current policy, eligibility, technical contract and fees directly with IRCTC before considering an application. A 2025 revision was visible in a non-IRCTC-hosted copy, but I did not locate an official IRCTC-hosted 2025 TIES policy during this review, so the 2023 figures above must not be treated as a current quotation.

Official policy: https://contents.irctc.co.in/en/TIES_Policy.pdf

### 2. RailRadar — recommended for a small non-commercial pilot

RailRadar is independent, not an official IRCTC/CRIS/NTES service. Its terms, updated 1 November 2026, allow API data to be shown in the developer's own apps and websites, but prohibit resale, bulk redistribution and competing data services. Its Free plan is specifically for personal, non-commercial use.

| Plan | Published price | Quota | Rate limit |
|---|---:|---:|---:|
| Free | ₹0/month | 100 requests/month | 10/min |
| Developer | ₹499 first month, then ₹999/month | 30,000/month | 30/min |
| Growth | ₹2,999/month | 100,000/month | 60/min |
| Scale | ₹6,999/month | 250,000/month | 120/min |

Authentication: create an account using Google or email, enter a mobile number in the developer dashboard to activate the key, then send it as `Authorization: Bearer <key>`. Keep it in a Cloudflare Worker secret, never in GitHub Pages or browser JavaScript.

Useful endpoints:

| Purpose | RailRadar endpoint |
|---|---|
| Station autocomplete | `GET /v1/lookup/search/stations?q={text}&limit=10` |
| Direct trains | `GET /v1/trains/between/{from}/{to}?date=YYYY-MM-DD` |
| Alternative/connecting routes | `POST /v1/journeys/plan` |
| Train schedule | `GET /v1/trains/{number}?haltsOnly=true` |
| Live running status | `GET /v1/trains/{number}/live?date=YYYY-MM-DD` |
| Seat availability | `GET /v1/trains/{number}/seats?source={from}&destination={to}&journeyDate={date}&classCode={class}&quotaCode={quota}` |
| Fare | `GET /v1/trains/{number}/fare?source={from}&destination={to}&journeyDate={date}&classCode={class}&quotaCode={quota}` |
| PNR status | `GET /v1/pnr/{10-digit-pnr}` |

The route planner accepts station-code stops and a journey date. Its documented `maxTransfers` range is 0–2; the current search UI offers up to 3, so that control must be aligned before connecting it. The route planner does not take passenger count, class or quota as route-planning inputs. Use the separate fare/seat endpoints for a selected train and class/quota.

**Data limitations:** live positions are derived from passenger GPS and public railway feeds; timetables/routes are from RailRadar's own data pipeline. PNR, seat-availability and fare results are explicitly described by RailRadar as third-party aggregated, non-authoritative data. The PNR privacy policy says PNR numbers are not saved to the user's account but may appear in provider request logs. The Worker can avoid storing or caching PNR responses, but it cannot prevent provider-side logging.

**Decision:** best practical pilot candidate for a free, non-commercial DigiTravel website, subject to its 100-request monthly cap and clear third-party-data disclaimers. Do not run background polling. PNR lookup should be added only with an explicit disclosure/consent step and no local history.

Sources:
- https://railradar.in/pricing
- https://railradar.in/docs/quickstart
- https://railradar.in/docs/authentication
- https://railradar.in/docs/rate-limits
- https://railradar.in/docs/journey-plan
- https://railradar.in/docs/pnr-status
- https://railradar.in/docs/seat-availability
- https://railradar.in/docs/train-fare-calculator
- https://railradar.in/terms
- https://railradar.in/privacy

### 3. Qrail — not selected

Its developer page advertises Free at 100 requests/day for PNR, train-between and schedule; Pro at ₹1,999/year adds running status/live station and 10,000 requests/day; Business at ₹4,999/year adds fare/availability and 50,000 requests/day. The API-key example places the key in the URL path, which should not be exposed in browser code. The linked API documentation and Terms page returned HTTP 503 during this review, so endpoint contracts and redistribution terms could not be verified. No documented multi-stop route-planner endpoint was found.

Source: https://www.qrail.in/developers

### 4. Railway Engine — not selected for a public DigiTravel integration

It advertises a free API, 60 requests/minute, Google sign-in and an `x-api-key` header, with live status, schedule, route, search and PNR endpoints. However, its Terms (updated 7 October 2026) prohibit redistributing data to third parties and providing responses through another platform, and restrict derivative/competing services. It also provides no SLA and states that it is independent and not official. Those restrictions make it unsuitable for a public-facing DigiTravel integration without written clarification.

Sources:
- https://railengine.vercel.app/pricing
- https://railengine.vercel.app/docs/introduction
- https://railengine.vercel.app/docs/authentication
- https://railengine.vercel.app/terms

### 5. Open Government Data timetable — not suitable for live results

The Ministry of Railways timetable dataset on data.gov.in was last updated on 24 January 2018. It may be useful for historical/static research, but it is too old for live running status, current seat availability, fare or PNR.

Source: https://www.data.gov.in/catalog/indian-railways-train-time-table

## Recommended implementation plan

Use **RailRadar** for the first non-commercial pilot. Keep the official IRCTC TIES route as the long-term option if DigiTravel needs authoritative data and can meet the formal costs/eligibility.

1. **Credentials and deployment**
   - Create/activate a RailRadar key (Google/email account plus mobile-number activation).
   - Deploy `cloudflare/rail-api-worker.js` as a Cloudflare Worker.
   - Add `RAILRADAR_API_KEY` as a Worker **secret**.
   - Set `ALLOWED_ORIGIN=https://vikashpathak-in.github.io`.
   - Set `DIGITRAVEL_RAIL_API_BASE` in `index.html` to the deployed Worker URL. Do not put the key in GitHub.
2. **Complete the Worker proxy**
   - Keep existing live, schedule, between-station, PNR and journey-plan routes.
   - Add station-search, seat-availability and fare proxy routes.
   - Pass the selected date to direct-train search and route planning.
   - Validate class/quota codes and 10-digit PNRs; retain `Cache-Control: no-store` for PNR.
   - Add per-IP/global rate limiting before exposing the Worker publicly. CORS is not authentication and does not stop direct requests to the Worker URL.
3. **Connect the front end**
   - Resolve the Smart Planner's city/free-text inputs to station codes with station autocomplete.
   - Send date and transfer limit to the route planner; cap transfers at the provider's documented maximum of 2.
   - Use the seat/fare endpoints only for shortlisted trains and the selected class/quota. Show fare/availability as third-party information, not a booking guarantee.
   - Display provider, response timestamp and any stale/unavailable state. Keep the IRCTC/NTES fallback links visible.
4. **PNR privacy**
   - Add PNR lookup only after an explicit notice that the number is sent to RailRadar and may appear in its request logs.
   - Do not store PNRs, cache responses, add PNRs to analytics, or run automatic checks. Require the user to initiate each lookup.
5. **Verification**
   - Test station search, direct trains, connecting routes, schedule, live status, fare, seat availability and error paths with the real key.
   - Confirm the monthly quota headers and rate-limit behaviour.
   - Verify all reservation-critical information through official IRCTC/NTES before users act on it.

## Official fallback links

- Booking: https://www.irctc.co.in/nget/train-search
- Live train running status (NTES): https://enquiry.indianrail.gov.in/mntes/
- PNR enquiry: https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en
- Train schedule: https://www.indianrail.gov.in/enquiry/SCHEDULE/TrainSchedule.jsp

## Current blocker

No RailRadar key, deployed Worker URL or deployment confirmation is present in the repository. Therefore no live API integration is activated in this commit. The front end must continue to show its current manual-planning/fallback behaviour until the credential and Worker steps above are completed.
