// ============================================================
// beacon121 - Worker API
// Version: 0.1.0
// Phase: 2 (Database Connection)
// ============================================================

/**
 * CORS headers - allows the browser (beacon121.pages.dev)
 * to make requests to this Worker.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * ساخت پاسخ JSON استاندارد.
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

/**
 * ساخت پاسخ خطا.
 */
function error(message, status = 500) {
  return json({ ok: false, error: message }, status);
}

/**
 * Route: GET /api/health
 * فقط بررسی می‌کند که Worker و D1 زنده هستند.
 */
async function handleHealth(env) {
  try {
    const result = await env.DB.prepare('SELECT 1 AS ok').first();
    return json({
      ok: true,
      service: 'beacon121-api',
      version: '0.1.0',
      d1_connected: result?.ok === 1,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return error(`D1 check failed: ${e.message}`, 500);
  }
}

/**
 * Route: GET /api/sources
 * لیست منابع ثبت‌شده در جدول sources را برمی‌گرداند.
 */
async function handleSources(env) {
  try {
    const { results } = await env.DB
      .prepare('SELECT source_key, source_type, display_name, base_url, is_active FROM sources ORDER BY source_key')
      .all();
    return json({
      ok: true,
      count: results.length,
      sources: results,
    });
  } catch (e) {
    return error(`Failed to fetch sources: ${e.message}`, 500);
  }
}

/**
 * Route: GET /api/stats
 * خلاصه‌ای از وضعیت دیتابیس (تعداد ردیف‌های هر جدول).
 */
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

/**
 * Entry point اصلی Worker.
 * Cloudflare این تابع را برای هر درخواست صدا می‌زند.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Preflight برای CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // فقط GET مجاز است در این نسخه
    if (request.method !== 'GET') {
      return error('Method not allowed', 405);
    }

    // Routing ساده
    switch (path) {
      case '/':
      case '/api':
        return json({
          ok: true,
          service: 'beacon121-api',
          version: '0.1.0',
          endpoints: [
            '/api/health',
            '/api/sources',
            '/api/stats',
          ],
        });

      case '/api/health':
        return handleHealth(env);

      case '/api/sources':
        return handleSources(env);

      case '/api/stats':
        return handleStats(env);

      default:
        return error(`Not found: ${path}`, 404);
    }
  },
};
