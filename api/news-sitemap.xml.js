const {
  BASE_URL,
  escapeXml,
  toIsoDateTime,
  fetchPublishedRows,
  cleanSlug
} = require("./_sitemap-common");

const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000;

function isFresh(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= TWO_DAYS_IN_MS;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=43200");

  let englishRows = [];
  let banglaRows = [];

  try {
    [englishRows, banglaRows] = await Promise.all([
      fetchPublishedRows("posts", ["slug", "title", "created_at", "updated_at"]),
      fetchPublishedRows("posts_bd", ["slug", "title", "created_at", "updated_at"])
    ]);
  } catch (error) {
    console.error(error);
  }

  const rows = [];

  for (const row of englishRows) {
    const slug = cleanSlug(row.slug);
    const dateValue = row.updated_at || row.created_at;
    if (!slug || !isFresh(dateValue)) continue;
    rows.push({
      loc: `${BASE_URL}/article/${encodeURIComponent(slug)}`,
      title: row.title || slug,
      publicationName: "TruthOrRumor",
      language: "en",
      publicationDate: toIsoDateTime(dateValue)
    });
  }

  for (const row of banglaRows) {
    const slug = cleanSlug(row.slug);
    const dateValue = row.updated_at || row.created_at;
    if (!slug || !isFresh(dateValue)) continue;
    rows.push({
      loc: `${BASE_URL}/bd/article/${encodeURIComponent(slug)}`,
      title: row.title || slug,
      publicationName: "TruthOrRumor Bangla",
      language: "bn",
      publicationDate: toIsoDateTime(dateValue)
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n` +
    rows.map((row) => {
      return [
        `  <url>`,
        `    <loc>${escapeXml(row.loc)}</loc>`,
        `    <news:news>`,
        `      <news:publication>`,
        `        <news:name>${escapeXml(row.publicationName)}</news:name>`,
        `        <news:language>${escapeXml(row.language)}</news:language>`,
        `      </news:publication>`,
        `      <news:publication_date>${escapeXml(row.publicationDate)}</news:publication_date>`,
        `      <news:title>${escapeXml(row.title)}</news:title>`,
        `    </news:news>`,
        `  </url>`
      ].join("\n");
    }).join("\n") +
    `\n</urlset>`;

  res.status(200).send(xml);
};
