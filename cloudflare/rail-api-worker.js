/**
 * DigiTravel railway API proxy for Cloudflare Workers.
 *
 * Required secret:
 *   RAILRADAR_API_KEY
 *
 * Optional variable:
 *   ALLOWED_ORIGIN = https://vikashp23.github.io
 *
 * IMPORTANT:
 * RailRadar Free is listed as non-commercial (100 requests/month, 10/min).
 * Use this worker only for a non-commercial personal test unless RailRadar
 * gives written permission for a broader use. Never expose the API key in
 * browser JavaScript, GitHub Pages, URLs, or client-side configuration.
 */

const UPSTREAM = "https://api.railradar.in";
const DEFAULT_ORIGIN = "https://vikashp23.github.io";

function corsHeaders(origin, allowedOrigin) {
  const allowed = origin === allowedOrigin;
  return {
    "Access-Control-Allow-Origin": allowed ? origin : allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}

function validTrainNumber(value) {
  return typeof value === "string" &&
    /^[0-9A-Za-z _/-]{1,20}$/.test(value);
}

async function upstreamFetch(path, env, method = "GET", body = undefined) {
  if (!env.RAILRADAR_API_KEY) {
    return json({ success: false, error: { code: "NOT_CONFIGURED", message: "Rail API key is not configured on the server." } }, 503);
  }

  const headers = {
    "Authorization": `Bearer ${env.RAILRADAR_API_KEY}`,
    "Accept": "application/json"
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(UPSTREAM + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(12000)
    });

    const raw = await response.text();
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {
        success: false,
        error: {
          code: "UPSTREAM_INVALID_RESPONSE",
          message: "The railway data provider returned an unreadable response."
        }
      };
    }

    return json(payload, response.status, {
      "X-Rail-Provider": "RailRadar",
      "X-Rail-Quota-Month": response.headers.get("X-RateLimit-Limit-Month") || "",
      "X-Rail-Remaining-Month": response.headers.get("X-RateLimit-Remaining-Month") || "",
      "X-Rail-Remaining-Min": response.headers.get("X-RateLimit-Remaining-Min") || ""
    });
  } catch {
    return json({
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: "Railway data is temporarily unavailable. Please try again later."
      }
    }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const cors = corsHeaders(origin, allowedOrigin);

    if (request.method === "OPTIONS") {
      if (origin && origin !== allowedOrigin) {
        return json({ success: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin not allowed." } }, 403);
      }
      return new Response(null, { status: 204, headers: cors });
    }

    if (origin && origin !== allowedOrigin) {
      return json({ success: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin not allowed." } }, 403);
    }

    if (request.method === "GET") {
      let match = url.pathname.match(/^\/api\/rail\/train\/([^/]+)\/live$/);
      if (match) {
        const number = decodeURIComponent(match[1]);
        if (!validTrainNumber(number)) {
          return json({ success: false, error: { code: "INVALID_TRAIN_NUMBER", message: "Enter a valid train number." } }, 400, cors);
        }
        const date = url.searchParams.get("date");
        const query = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? `?date=${encodeURIComponent(date)}` : "";
        return withCors(await upstreamFetch(`/v1/trains/${encodeURIComponent(number)}/live${query}`, env), cors);
      }

      match = url.pathname.match(/^\/api\/rail\/train\/([^/]+)\/schedule$/);
      if (match) {
        const number = decodeURIComponent(match[1]);
        if (!validTrainNumber(number)) {
          return json({ success: false, error: { code: "INVALID_TRAIN_NUMBER", message: "Enter a valid train number." } }, 400, cors);
        }
        return withCors(await upstreamFetch(`/v1/trains/${encodeURIComponent(number)}?haltsOnly=true`, env), cors);
      }

      match = url.pathname.match(/^\/api\/rail\/pnr\/(\d{10})$/);
      if (match) {
        return withCors(await upstreamFetch(`/v1/pnr/${match[1]}`, env), cors);
      }

      match = url.pathname.match(/^\/api\/rail\/trains\/between\/([A-Za-z0-9]{2,6})\/([A-Za-z0-9]{2,6})$/);
      if (match) {
        return withCors(await upstreamFetch(`/v1/trains/between/${match[1].toUpperCase()}/${match[2].toUpperCase()}`, env), cors);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/rail/journeys/plan") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, 400, cors);
      }
      if (!body || !Array.isArray(body.stops) || body.stops.length < 2 || body.stops.length > 6) {
        return json({ success: false, error: { code: "INVALID_STOPS", message: "Provide between 2 and 6 journey stops." } }, 400, cors);
      }
      const validStops = body.stops.every(stop => {
        const station = typeof stop === "string" ? stop : stop && stop.station;
        return typeof station === "string" && /^[A-Za-z0-9]{2,6}$/.test(station);
      });
      if (!validStops) {
        return json({ success: false, error: { code: "INVALID_STATION", message: "Use valid station codes for each stop." } }, 400, cors);
      }
      return withCors(await upstreamFetch("/v1/journeys/plan", env, "POST", body), cors);
    }

    return json({
      success: false,
      error: { code: "NOT_FOUND", message: "Unknown railway API route." }
    }, 404, cors);
  }
};

function withCors(response, cors) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  headers.set("Cache-Control", "no-store, max-age=0");
  return new Response(response.body, { status: response.status, headers });
}
