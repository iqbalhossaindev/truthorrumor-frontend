const {
  BASE_URL,
  escapeXml,
  toIsoDate,
  cleanSlug,
  fetchPublishedRows
} = require("./_sitemap-common");

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const staticPages = [
    { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "daily", lastmod: toIsoDate() },
    { loc: `${BASE_URL}/bd`, priority: "0.95", changefreq: "daily", lastmod: toIsoDate() },
    { loc: `${BASE_URL}/about`, priority: "0.80", changefreq: "monthly", lastmod: toIsoDate() },
    { loc: `${BASE_URL}/contact`, priority: "0.80", changefreq: "monthly", lastmod: toIsoDate() }
  ];

  let englishRows = [];
  let banglaRows = [];

  try {
    [englishRows, banglaRows] = await Promise.all([
      fetchPublishedRows("posts", ["slug", "created_at", "updated_at"]),
      fetchPublishedRows("posts_bd", ["slug", "created_at", "updated_at"])
    ]);
  } catch (error) {
    console.error("Sitemap fetch error:", error);
  }

  const articleRows = [];
  const seen = new Set();

  for (const row of englishRows) {
    const slug = cleanSlug(row.slug);
    if (!slug || seen.has(`en:${slug}`)) continue;

    seen.add(`en:${slug}`);
    articleRows.push({
      loc: `${BASE_URL}/article/${encodeURIComponent(slug)}`,
      priority: "0.90",
      changefreq: "weekly",
      lastmod: toIsoDate(row.updated_at || row.created_at)
    });
  }

  for (const row of banglaRows) {
    const slug = cleanSlug(row.slug);
    if (!slug || seen.has(`bn:${slug}`)) continue;

    seen.add(`bn:${slug}`);
    articleRows.push({
      loc: `${BASE_URL}/bd/article/${encodeURIComponent(slug)}`,
      priority: "0.90",
      changefreq: "weekly",
      lastmod: toIsoDate(row.updated_at || row.created_at)
    });
  }

  const allRows = [...staticPages, ...articleRows];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    allRows
      .map((row) => {
        return [
          `  <url>`,
          `    <loc>${escapeXml(row.loc)}</loc>`,
          `    <lastmod>${escapeXml(row.lastmod)}</lastmod>`,
          `    <changefreq>${escapeXml(row.changefreq)}</changefreq>`,
          `    <priority>${escapeXml(row.priority)}</priority>`,
          `  </url>`
        ].join("\n");
      })
      .join("\n") +
    `\n</urlset>`;

  res.statusCode = 200;
  res.end(xml);
};
