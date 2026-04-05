const fs = require("fs");
const path = require("path");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SITE_URL = (process.env.SITE_URL || "https://www.truthorrumor.com").replace(/\/$/, "");

function safeSlug(value) {
  return String(value || "").trim().replace(/^\/+|\/+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchPublishedRows(table) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set(
    "select",
    "slug,title,excerpt,content,image_url,author,category,created_at,updated_at,published"
  );
  url.searchParams.set("published", "eq.true");
  url.searchParams.set("order", "updated_at.desc.nullslast");

  const response = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${table} fetch failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function buildArticleHtml(post, lang) {
  const slug = safeSlug(post.slug);
  const title = post.title || "Article";
  const description = post.excerpt || title;
  const image = post.image_url || `${SITE_URL}/logo.png`;
  const updated = post.updated_at || post.created_at || new Date().toISOString();
  const created = post.created_at || updated;
  const articleUrl =
    lang === "bn"
      ? `${SITE_URL}/bd/article/${encodeURIComponent(slug)}`
      : `${SITE_URL}/article/${encodeURIComponent(slug)}`;

  return `<!doctype html>
<html lang="${lang === "bn" ? "bn" : "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | TruthOrRumor</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(articleUrl)}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(articleUrl)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    image: [image],
    datePublished: created,
    dateModified: updated,
    author: {
      "@type": "Person",
      name: post.author || "TruthOrRumor"
    },
    publisher: {
      "@type": "Organization",
      name: "TruthOrRumor",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`
      }
    },
    mainEntityOfPage: articleUrl,
    description
  })}
  </script>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" />` : ""}
    <article>${post.content || ""}</article>
  </main>
</body>
</html>`;
}

function writeArticleFile(outputPath, html) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, "utf8");
}

async function run() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  const [englishPosts, banglaPosts] = await Promise.all([
    fetchPublishedRows("posts"),
    fetchPublishedRows("posts_bd")
  ]);

  for (const post of englishPosts) {
    const slug = safeSlug(post.slug);
    if (!slug) continue;

    const html = buildArticleHtml(post, "en");
    const outputPath = path.join(process.cwd(), "article", slug, "index.html");
    writeArticleFile(outputPath, html);
  }

  for (const post of banglaPosts) {
    const slug = safeSlug(post.slug);
    if (!slug) continue;

    const html = buildArticleHtml(post, "bn");
    const outputPath = path.join(process.cwd(), "bd", "article", slug, "index.html");
    writeArticleFile(outputPath, html);
  }

  console.log(`Built ${englishPosts.length} English articles`);
  console.log(`Built ${banglaPosts.length} Bangla articles`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
