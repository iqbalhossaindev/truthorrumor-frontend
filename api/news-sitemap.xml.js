const {
  BASE_URL,
  escapeXml,
  toIsoDateTime,
  cleanSlug,
  fetchPublishedRows
} = require("./_sitemap-common");

const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000;

function isFresh(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= TWO_DAYS_IN_MS;
}

function emptyNewsXml() {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n` +
    `</urlset>`
  );
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const [englishRows, banglaRows] = await Promise.all([
      fetchPublishedRows("posts", ["slug", "title", "created_at", "updated_at"]),
      fetchPublishedRows("posts_bd", ["slug", "title", "created_at", "updated_at"])
    ]);

    const rows = [];

    for (const row of englishRows) {
      try {
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
      } catch (e) {
        console.error("Skipping bad English news row:", e, row);
      }
    }

    for (const row of banglaRows) {
      try {
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
      } catch (e) {
        console.error("Skipping bad Bangla news row:", e, row);
      }
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n` +
      rows
        .map((row) => {
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
        })
        .join("\n") +
      `\n</urlset>`;

    res.statusCode = 200;
    res.end(xml);
  } catch (error) {
    console.error("News sitemap fatal error:", error);
    res.statusCode = 200;
    res.end(emptyNewsXml());
  }
};
