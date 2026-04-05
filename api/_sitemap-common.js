const SUPABASE_URL = process.env.SUPABASE_URL || "https://bsnezcbmsbsememwqsjs.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_HTgjJsMcfGgIJaUSAzXTfw_yQ2d_Uy";
const BASE_URL = (process.env.SITE_URL || "https://www.truthorrumor.com").replace(/\/$/, "");

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function toIsoDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

async function fetchPublishedRows(table, columns) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", columns.join(","));
  url.searchParams.set("published", "eq.true");
  url.searchParams.set("order", "updated_at.desc.nullslast");

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed for ${table}: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function cleanSlug(value) {
  return decodeURIComponent(String(value || "").trim()).replace(/^\/+|\/+$/g, "");
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  BASE_URL,
  escapeXml,
  toIsoDate,
  toIsoDateTime,
  fetchPublishedRows,
  cleanSlug
};
