const { createClient } = require("@supabase/supabase-js");

let cached;

/**
 * Admin client (service role) for Storage uploads. Never expose the service key to the browser.
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, optional SUPABASE_STORAGE_BUCKET (default "announcements").
 */
function getSupabaseAdmin() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

function getAnnouncementsBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "announcements";
}

module.exports = { getSupabaseAdmin, getAnnouncementsBucket };
