const { fetchPublishedRows } = require("./_sitemap-common");

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const englishRows = await fetchPublishedRows("posts", [
      "slug",
      "title",
      "published",
      "created_at",
      "updated_at"
    ]);

    const banglaRows = await fetchPublishedRows("posts_bd", [
      "slug",
      "title",
      "published",
      "created_at",
      "updated_at"
    ]);

    const lines = [
      "OK",
      `English rows: ${englishRows.length}`,
      `Bangla rows: ${banglaRows.length}`,
      `First English slug: ${englishRows[0] ? englishRows[0].slug : "(none)"}`,
      `First Bangla slug: ${banglaRows[0] ? banglaRows[0].slug : "(none)"}`
    ];

    res.statusCode = 200;
    res.end(lines.join("\n"));
  } catch (error) {
    res.statusCode = 500;
    res.end(
      [
        "ERROR",
        error && error.message ? error.message : String(error),
        "",
        error && error.stack ? error.stack : ""
      ].join("\n")
    );
  }
};
