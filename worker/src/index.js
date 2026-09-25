// ============================================================
// beacon121 - Worker API
// Version: 0.3.0
// Phase: 4 (LA Open Data - LADBS Permits)
// ============================================================

import { createManualListing, listListings } from './routes/listings.js';
import { syncPermits, listPermits } from './routes/permits.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  });
}

function error(message, status = 500) {
  return json({ ok: false, error: message }, status);
}

async function handleHealth(env) {
  try {
    const result = await env.DB.prepare('SELECT 1 AS ok').first();
    return json({
      ok: true,
      service: 'beacon121-api',
      version: '0.3.0',
      d1_connected: result?.ok === 1,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return error(`D1 check failed: ${e.message}`, 500);
  }
}

async function handleSources(env) {
  try {
    const { results } = await env.DB
      .prepare('SELECT source_key, source_type, display_name, base_url, is_active FROM sources ORDER BY source_key')
      .all();
    return json({ ok: true, count: results.length, sources: results });
  } catch (e) {
    return error(`Failed to fetch sources: ${e.message}`, 500);
  }
}

async function handleStats(env) {
  try {
    const tables = ['properties', 'listings', 'listing_history', 'permits', 'scores', 'jobs', 'sources'];
    const counts = {};
    for (const t of tables) {
      const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${t}`).first();
      counts[t] = row?.n ?? 0;
    }
    return json({ ok: true, counts });
  } catch (e) {
    return error(`Failed to compute stats: ${e.message}`, 500);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      // GET routes
      if (request.method === 'GET') {
        switch (path) {
          case '/':
          case '/api':
            return json({
              ok: true,
              service: 'beacon121-api',
              version: '0.3.0',
              endpoints: [
                'GET  /api/health',
                'GET  /api/sources',
                'GET  /api/stats',
                'GET  /api/listings',
                'GET  /api/permits',
                'POST /api/listings/manual',
                'POST /api/permits/sync',
              ],
            });
          case '/api/health':
            return handleHealth(env);
          case '/api/sources':
            return handleSources(env);
          case '/api/stats':
            return handleStats(env);
          case '/api/listings':
            return json(await listListings(env));
          case '/api/permits':
            return json(await listPermits(env));
          default:
            return error(`Not found: ${path}`, 404);
        }
      }

      // POST routes
      if (request.method === 'POST') {
        if (path === '/api/listings/manual') {
          let body;
          try {
            body = await request.json();
          } catch {
            return error('Invalid JSON body', 400);
          }
          const result = await createManualListing(env, body);
          return json(result, result.created ? 201 : 200);
        }
        if (path === '/api/permits/sync') {
          const result = await syncPermits(env, 50, 0);
          return json(result);
        }
        return error(`Not found: ${path}`, 404);
      }

      return error('Method not allowed', 405);
    } catch (e) {
      return error(`Internal error: ${e.message}`, 500);
    }
  },
};
