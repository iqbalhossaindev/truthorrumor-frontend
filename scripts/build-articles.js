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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function looksLikeHtml(value) {
  return /<[^>]+>/.test(String(value || ""));
}

function renderBody(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  if (looksLikeHtml(text)) {
    return text;
  }

  return text
    .split(/\n\s*\n/)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function toIsoDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value, lang) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const locale = lang === "bn" ? "bn-BD" : "en-US";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

async function fetchPublishedRows(table) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
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

function getDescription(post) {
  return (
    post.excerpt ||
    post.summary ||
    post.description ||
    post.verdict ||
    post.title ||
    "News article"
  );
}

function getBody(post) {
  return (
    post.content ||
    post.body ||
    post.article_body ||
    post.article_html ||
    post.description ||
    post.summary ||
    post.verdict ||
    ""
  );
}

function getImage(post) {
  const image =
    post.image_url ||
    post.image ||
    post.thumbnail ||
    post.cover_image ||
    "/logo.png";

  if (/^https?:\/\//i.test(String(image))) return image;
  return `${SITE_URL}${String(image).startsWith("/") ? "" : "/"}${String(image)}`;
}

function getAuthor(post) {
  return post.author || post.author_name || post.writer || "TruthOrRumor";
}

function getCategory(post) {
  return post.category || "News";
}

function getSourceUrl(post) {
  return post.source_url || post.source || post.reference_url || "";
}

function getStatus(post) {
  const verdict = String(post.verdict || post.type || post.status || "truth").toLowerCase();
  return verdict.includes("rumor") || verdict.includes("গুজব") ? "rumor" : "truth";
}

function trimText(value, limit) {
  const text = stripHtml(value);
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function labelsFor(lang) {
  if (lang === "bn") {
    return {
      siteName: "TruthOrRumor Bangla",
      backHome: "হোমে ফিরে যান",
      share: "শেয়ার",
      source: "সোর্স",
      listen: "Tap To Listen",
      stop: "শোনা বন্ধ করুন",
      readingSettings: "পড়ার সেটিংস",
      readingNote: "পড়ার অভিজ্ঞতা নিজের মতো ঠিক করুন",
      theme: "থিম",
      dark: "ডার্ক",
      sepia: "সেপিয়া",
      soft: "সফট লাইট",
      textSize: "ফন্ট সাইজ",
      lineSpace: "লাইন ফাঁক",
      reset: "রিসেট",
      resetNow: "সেটিংস রিসেট",
      shareStory: "Share Story",
      sharedTimes: "Shared 0 times",
      shareAs: "Share As",
      fullArticle: "Full Article",
      headlineOnly: "Headline Only",
      shortSummary: "Short Summary",
      quoteCard: "Quote Card",
      quickShare: "Quick Share",
      deviceShare: "Device Share",
      copyLink: "Copy Link",
      whatsapp: "WhatsApp",
      facebook: "Facebook",
      x: "X",
      telegram: "Telegram",
      email: "Email",
      saveForLater: "Save For Later",
      downloadQr: "Download QR",
      shareMode: "Share mode",
      shareUrl: "Share URL",
      qrCode: "QR Code",
      qrNote: "QR code generates automatically when this share popup opens.",
      copied: "লিংক কপি হয়েছে",
      saved: "Saved for later",
      noSource: "সোর্স পাওয়া যায়নি",
      truthVerification: "TRUTH VERIFICATION",
      sourceLabel: "Source",
      updated: "আপডেট",
      category: "বিভাগ",
      narratorIntro: "এই প্রতিবেদনটি শোনানো হচ্ছে",
      openSource: "মূল সোর্স খুলুন"
    };
  }

  return {
    siteName: "TruthOrRumor",
    backHome: "Back to Home",
    share: "Share",
    source: "Source",
    listen: "Tap To Listen",
    stop: "Stop Listening",
    readingSettings: "Reading settings",
    readingNote: "Adjust your reading experience",
    theme: "Theme",
    dark: "Dark",
    sepia: "Sepia",
    soft: "Soft Light",
    textSize: "Text size",
    lineSpace: "Line spacing",
    reset: "Reset",
    resetNow: "Reset settings",
    shareStory: "Share Story",
    sharedTimes: "Shared 0 times",
    shareAs: "Share As",
    fullArticle: "Full Article",
    headlineOnly: "Headline Only",
    shortSummary: "Short Summary",
    quoteCard: "Quote Card",
    quickShare: "Quick Share",
    deviceShare: "Device Share",
    copyLink: "Copy Link",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    x: "X",
    telegram: "Telegram",
    email: "Email",
    saveForLater: "Save For Later",
    downloadQr: "Download QR",
    shareMode: "Share mode",
    shareUrl: "Share URL",
    qrCode: "QR Code",
    qrNote: "QR code generates automatically when this share popup opens.",
    copied: "Link copied",
    saved: "Saved for later",
    noSource: "Source not available",
    truthVerification: "TRUTH VERIFICATION",
    sourceLabel: "Source",
    updated: "Updated",
    category: "Category",
    narratorIntro: "Now reading this article",
    openSource: "Open original source"
  };
}

function buildArticleHtml(post, lang) {
  const labels = labelsFor(lang);
  const slug = safeSlug(post.slug);
  const title = post.title || "Article";
  const description = getDescription(post);
  const image = getImage(post);
  const author = getAuthor(post);
  const category = getCategory(post);
  const sourceUrl = getSourceUrl(post);
  const body = getBody(post);
  const bodyHtml = renderBody(body);
  const status = getStatus(post);
  const updated = post.updated_at || post.created_at || new Date().toISOString();
  const created = post.created_at || updated;
  const displayDate = formatDisplayDate(updated, lang);
  const articleUrl =
    lang === "bn"
      ? `${SITE_URL}/bd/article/${encodeURIComponent(slug)}`
      : `${SITE_URL}/article/${encodeURIComponent(slug)}`;
  const homeUrl = lang === "bn" ? `${SITE_URL}/bd` : SITE_URL;
  const shareSummary = trimText(description, 180) || trimText(body, 180) || title;
  const quoteText = trimText(body || description || title, 140);
  const localStoragePrefix = lang === "bn" ? "tor_bn" : "tor_en";

  const articleData = {
    slug,
    lang,
    siteName: labels.siteName,
    homeUrl,
    title,
    description: shareSummary,
    quoteText,
    image,
    author,
    category,
    sourceUrl,
    articleUrl,
    utmCampaign: lang === "bn" ? "bangla_share" : "english_share",
    speechText: [labels.narratorIntro, title, shareSummary, stripHtml(body)].join(". "),
    shareCountKey: `${localStoragePrefix}_share_count_${slug}`,
    savedKey: `${localStoragePrefix}_saved_articles`,
    readerPrefKey: `${localStoragePrefix}_reader_prefs`
  };

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    image: [image],
    datePublished: created,
    dateModified: updated,
    author: {
      "@type": "Person",
      name: author
    },
    publisher: {
      "@type": "Organization",
      name: labels.siteName,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`
      }
    },
    articleSection: category,
    mainEntityOfPage: articleUrl,
    description: shareSummary
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: labels.siteName,
        item: homeUrl
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: articleUrl
      }
    ]
  };

  const previewStatusClass = status === "rumor" ? "preview-rumor" : "preview-truth";

  return `<!doctype html>
<html lang="${lang === "bn" ? "bn" : "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | ${escapeHtml(labels.siteName)}</title>
  <meta name="description" content="${escapeHtml(shareSummary)}" />
  <link rel="canonical" href="${escapeHtml(articleUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(shareSummary)}" />
  <meta property="og:url" content="${escapeHtml(articleUrl)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:site_name" content="${escapeHtml(labels.siteName)}" />
  <meta property="article:published_time" content="${escapeHtml(created)}" />
  <meta property="article:modified_time" content="${escapeHtml(updated)}" />
  <meta property="article:section" content="${escapeHtml(category)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(shareSummary)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <script type="application/ld+json">${safeJson(jsonLdArticle)}</script>
  <script type="application/ld+json">${safeJson(jsonLdBreadcrumb)}</script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"></script>
  <style>
    :root {
      --bg: #07101f;
      --bg-soft: rgba(14, 25, 46, 0.78);
      --card: rgba(20, 32, 58, 0.82);
      --line: rgba(255,255,255,0.12);
      --text: #f5f7ff;
      --muted: #b8c0df;
      --accent: #f0b54d;
      --accent-soft: rgba(240,181,77,0.22);
      --success: #22c55e;
      --danger: #ef4444;
      --reader-font-size: 18px;
      --reader-line-height: 1.9;
      --reader-width: 860px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(239, 68, 68, 0.16), transparent 28%),
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.22), transparent 30%),
        radial-gradient(circle at 30% 70%, rgba(34, 197, 94, 0.12), transparent 22%),
        linear-gradient(180deg, #050c18 0%, #07101f 48%, #09152a 100%);
      background-attachment: fixed;
      font-size: var(--reader-font-size);
      line-height: var(--reader-line-height);
    }
    body[data-theme="sepia"] {
      --bg: #2e2418;
      --bg-soft: rgba(54, 39, 22, 0.82);
      --card: rgba(70, 50, 28, 0.86);
      --line: rgba(255,255,255,0.13);
      --text: #f7ead7;
      --muted: #dbc7aa;
      --accent-soft: rgba(240,181,77,0.28);
      background: linear-gradient(180deg, #24180e 0%, #312215 100%);
    }
    body[data-theme="soft-light"] {
      --bg: #f5f2eb;
      --bg-soft: rgba(255,255,255,0.88);
      --card: rgba(255,255,255,0.92);
      --line: rgba(18, 28, 44, 0.12);
      --text: #152032;
      --muted: #4f607d;
      --accent-soft: rgba(240,181,77,0.22);
      background: linear-gradient(180deg, #f7f4ef 0%, #ebe7de 100%);
    }
    a { color: inherit; }
    .page-shell {
      width: min(var(--reader-width), calc(100% - 24px));
      margin: 0 auto;
      padding: 20px 0 56px;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin: 6px 0 18px;
      padding: 10px 14px;
      border: 1px solid var(--line);
      border-radius: 22px;
      background: rgba(12, 20, 36, 0.66);
      backdrop-filter: blur(18px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.22);
    }
    body[data-theme="soft-light"] .topbar { background: rgba(255,255,255,0.82); }
    .top-link, .brand-link {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 16px;
      padding: 10px 14px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.04);
      color: var(--text);
      font-weight: 700;
      font-size: 14px;
    }
    .brand-link { background: transparent; border-color: transparent; padding-right: 0; }
    .article-card {
      border: 1px solid var(--line);
      background: var(--bg-soft);
      border-radius: 28px;
      overflow: hidden;
      backdrop-filter: blur(16px);
      box-shadow: 0 18px 64px rgba(0,0,0,0.24);
    }
    .hero-media {
      position: relative;
      aspect-ratio: 16 / 9;
      width: 100%;
      overflow: hidden;
      background: rgba(255,255,255,0.04);
    }
    .hero-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(3,8,18,0.05) 0%, rgba(3,8,18,0.74) 100%);
    }
    .hero-badge {
      position: absolute;
      left: 18px;
      bottom: 18px;
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 9px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.05em;
      border: 1px solid rgba(255,255,255,0.16);
      background: rgba(12, 18, 34, 0.7);
    }
    .hero-badge.truth { color: #bbf7d0; }
    .hero-badge.rumor { color: #fecaca; }
    .content-wrap { padding: 22px 18px 28px; }
    .eyebrow {
      color: var(--accent);
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0 0 10px;
    }
    .article-title {
      margin: 0 0 14px;
      font-size: clamp(30px, 4.6vw, 52px);
      line-height: 1.08;
      font-weight: 800;
    }
    .article-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 14px;
      color: var(--muted);
      font-size: 14px;
    }
    .article-summary {
      margin: 0 0 22px;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.7;
    }
    .article-body {
      color: var(--text);
    }
    .article-body p {
      margin: 0 0 1.25em;
    }
    .article-body img, .article-body iframe {
      max-width: 100%;
      border-radius: 20px;
    }
    .end-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 28px;
    }
    .action-btn {
      appearance: none;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
      color: var(--text);
      padding: 14px 16px;
      border-radius: 18px;
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .action-btn.primary {
      background: linear-gradient(180deg, rgba(240,181,77,0.34), rgba(240,181,77,0.16));
      border-color: rgba(240,181,77,0.48);
    }
    .action-btn[hidden] { display: none !important; }
    .source-box {
      margin-top: 18px;
      padding: 18px;
      border-radius: 20px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.04);
    }
    .source-box p { margin: 0 0 8px; font-size: 14px; color: var(--muted); }
    .source-box a { color: var(--accent); word-break: break-word; }
    .floating-accessibility-btn {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 40;
      width: 64px;
      height: 64px;
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 50%;
      background: rgba(12, 20, 36, 0.7);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(18px);
      box-shadow: 0 14px 36px rgba(0,0,0,0.28);
      cursor: pointer;
    }
    .floating-accessibility-btn svg { width: 28px; height: 28px; }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(4, 8, 18, 0.66);
      backdrop-filter: blur(10px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 18px;
      z-index: 60;
    }
    .modal-backdrop.show { display: flex; }
    .modal-card {
      width: min(980px, 100%);
      max-height: min(88vh, 980px);
      overflow: auto;
      border-radius: 30px;
      border: 1px solid var(--line);
      background: rgba(10, 18, 34, 0.88);
      color: var(--text);
      padding: 20px;
      box-shadow: 0 30px 90px rgba(0,0,0,0.34);
      backdrop-filter: blur(18px);
    }
    body[data-theme="soft-light"] .modal-card { background: rgba(248,248,248,0.94); }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
    }
    .modal-title {
      font-size: clamp(32px, 5vw, 56px);
      font-weight: 800;
      margin: 0 0 4px;
    }
    .modal-subtitle {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }
    .modal-close {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.05);
      color: var(--text);
      width: 56px;
      height: 56px;
      border-radius: 50%;
      font-size: 30px;
      cursor: pointer;
      flex: 0 0 auto;
    }
    .preview-card {
      border: 1px solid var(--line);
      border-radius: 28px;
      background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
      padding: 18px;
      display: grid;
      grid-template-columns: 126px 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .preview-media {
      width: 126px;
      height: 126px;
      border-radius: 22px;
      overflow: hidden;
      background: rgba(255,255,255,0.08);
    }
    .preview-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .preview-kicker {
      color: var(--accent);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .preview-title {
      font-size: clamp(28px, 5vw, 54px);
      line-height: 1.08;
      font-weight: 800;
      margin: 0 0 12px;
    }
    .preview-summary {
      margin: 0;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.7;
    }
    .share-section-title {
      font-size: 16px;
      font-weight: 800;
      margin: 20px 0 12px;
    }
    .mode-grid, .share-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .mode-btn, .share-card {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.05);
      color: var(--text);
      border-radius: 20px;
      padding: 18px;
      cursor: pointer;
      font-weight: 800;
    }
    .mode-btn.active {
      border-color: rgba(240,181,77,0.56);
      background: linear-gradient(180deg, rgba(240,181,77,0.36), rgba(240,181,77,0.16));
      box-shadow: 0 0 0 1px rgba(240,181,77,0.12) inset;
    }
    .share-card {
      display: flex;
      align-items: center;
      gap: 16px;
      text-align: left;
      min-height: 92px;
    }
    .share-card-icon {
      width: 52px;
      height: 52px;
      border-radius: 18px;
      border: 1px solid rgba(240,181,77,0.34);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
      flex: 0 0 auto;
      font-weight: 900;
      font-size: 20px;
    }
    .share-details {
      display: grid;
      gap: 6px;
      min-width: 0;
    }
    .share-details strong { font-size: 16px; }
    .share-output {
      margin-top: 18px;
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 18px;
      background: rgba(255,255,255,0.04);
    }
    .share-output-title {
      margin: 0 0 10px;
      font-size: 14px;
      color: var(--muted);
      font-weight: 700;
    }
    .share-url {
      margin: 0 0 18px;
      word-break: break-word;
      line-height: 1.7;
    }
    .qr-wrap {
      display: grid;
      justify-items: center;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 24px;
      background: rgba(255,255,255,0.03);
    }
    #qrCanvas canvas, #qrCanvas img {
      width: min(280px, 100%);
      height: auto;
      max-width: 100%;
      background: white;
      border-radius: 18px;
      padding: 12px;
    }
    .toast {
      position: fixed;
      left: 50%;
      bottom: 26px;
      transform: translateX(-50%) translateY(20px);
      opacity: 0;
      background: rgba(12,18,34,0.9);
      color: white;
      padding: 12px 18px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.16);
      backdrop-filter: blur(16px);
      z-index: 80;
      transition: opacity .22s ease, transform .22s ease;
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    .setting-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 18px; }
    .setting-btn {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.05);
      color: var(--text);
      border-radius: 16px;
      padding: 12px 14px;
      cursor: pointer;
      font-weight: 700;
    }
    .setting-btn.active { border-color: rgba(240,181,77,0.56); background: rgba(240,181,77,0.18); }
    .article-card a, .modal-card a { color: var(--accent); }
    @media (max-width: 760px) {
      .page-shell { width: calc(100% - 16px); padding-top: 12px; }
      .topbar { padding: 10px 12px; border-radius: 18px; }
      .preview-card { grid-template-columns: 1fr; }
      .preview-media { width: 110px; height: 110px; }
      .end-actions { grid-template-columns: 1fr; }
      .share-grid, .mode-grid { grid-template-columns: 1fr 1fr; }
      .modal-card { padding: 16px; border-radius: 24px; }
      .modal-close { width: 50px; height: 50px; }
      .content-wrap { padding: 18px 14px 24px; }
    }
    @media (max-width: 520px) {
      .share-grid, .mode-grid { grid-template-columns: 1fr; }
      .topbar { gap: 8px; }
      .top-link, .brand-link { font-size: 13px; padding: 9px 12px; }
      .article-title { font-size: clamp(28px, 9vw, 42px); }
      .preview-title { font-size: clamp(24px, 10vw, 42px); }
      .floating-accessibility-btn { width: 58px; height: 58px; }
    }
  </style>
</head>
<body data-theme="dark">
  <div class="page-shell">
    <div class="topbar">
      <a class="top-link" href="${escapeHtml(homeUrl)}">← ${escapeHtml(labels.backHome)}</a>
      <a class="brand-link" href="${escapeHtml(homeUrl)}">${escapeHtml(labels.siteName)}</a>
    </div>

    <article class="article-card">
      <div class="hero-media">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" onerror="this.src='${escapeHtml(`${SITE_URL}/logo.png`)}'" />
        <div class="hero-overlay"></div>
        <div class="hero-badge ${status === "rumor" ? "rumor" : "truth"}">${escapeHtml(labels.truthVerification)}</div>
      </div>
      <div class="content-wrap">
        <div class="eyebrow">${escapeHtml(category)}</div>
        <h1 class="article-title">${escapeHtml(title)}</h1>
        <div class="article-meta">
          <span>${escapeHtml(author)}</span>
          ${displayDate ? `<span>${escapeHtml(labels.updated)}: ${escapeHtml(displayDate)}</span>` : ""}
          <span>${escapeHtml(labels.category)}: ${escapeHtml(category)}</span>
        </div>
        <p class="article-summary">${escapeHtml(shareSummary)}</p>
        <div class="article-body">${bodyHtml}</div>
        <div class="end-actions">
          <button class="action-btn primary" id="shareBtn" type="button">${escapeHtml(labels.share)}</button>
          <a class="action-btn" id="sourceBtn" href="${escapeHtml(sourceUrl || "#")}" target="_blank" rel="noopener noreferrer" ${sourceUrl ? "" : "hidden"}>${escapeHtml(labels.source)}</a>
          <button class="action-btn" id="listenBtn" type="button">${escapeHtml(labels.listen)}</button>
        </div>
        <div class="source-box" id="sourceBox" ${sourceUrl ? "" : "hidden"}>
          <p>${escapeHtml(labels.sourceLabel)}</p>
          <a href="${escapeHtml(sourceUrl || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceUrl || labels.noSource)}</a>
        </div>
      </div>
    </article>
  </div>

  <button class="floating-accessibility-btn" id="accessibilityBtn" aria-label="${escapeHtml(labels.readingSettings)}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="5" r="2"></circle>
      <path d="M12 7v13"></path>
      <path d="M8 11h8"></path>
      <path d="M9.5 20l2.5-6 2.5 6"></path>
    </svg>
  </button>

  <div class="modal-backdrop" id="accessibilityBackdrop">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div>
          <h2 class="modal-title">${escapeHtml(labels.readingSettings)}</h2>
          <p class="modal-subtitle">${escapeHtml(labels.readingNote)}</p>
        </div>
        <button class="modal-close" type="button" id="accessibilityClose">×</button>
      </div>
      <div>
        <p class="share-section-title">${escapeHtml(labels.theme)}</p>
        <div class="setting-row">
          <button class="setting-btn" data-theme-value="dark">${escapeHtml(labels.dark)}</button>
          <button class="setting-btn" data-theme-value="sepia">${escapeHtml(labels.sepia)}</button>
          <button class="setting-btn" data-theme-value="soft-light">${escapeHtml(labels.soft)}</button>
        </div>
        <p class="share-section-title">${escapeHtml(labels.textSize)}</p>
        <div class="setting-row">
          <button class="setting-btn" id="fontMinus">A-</button>
          <button class="setting-btn" id="fontPlus">A+</button>
        </div>
        <p class="share-section-title">${escapeHtml(labels.lineSpace)}</p>
        <div class="setting-row">
          <button class="setting-btn" id="lineMinus">-</button>
          <button class="setting-btn" id="linePlus">+</button>
        </div>
        <p class="share-section-title">${escapeHtml(labels.reset)}</p>
        <div class="setting-row">
          <button class="setting-btn" id="readerReset">${escapeHtml(labels.resetNow)}</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="shareBackdrop">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div>
          <h2 class="modal-title">${escapeHtml(labels.shareStory)}</h2>
          <p class="modal-subtitle" id="shareCountText">${escapeHtml(labels.sharedTimes)}</p>
        </div>
        <button class="modal-close" type="button" id="shareClose">×</button>
      </div>

      <div class="preview-card">
        <div class="preview-media"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" onerror="this.src='${escapeHtml(`${SITE_URL}/logo.png`)}'" /></div>
        <div>
          <div class="preview-kicker ${previewStatusClass}">${escapeHtml(labels.truthVerification)}</div>
          <h3 class="preview-title" id="previewTitle">${escapeHtml(title)}</h3>
          <p class="preview-summary" id="previewSummary">${escapeHtml(shareSummary)}</p>
        </div>
      </div>

      <p class="share-section-title">${escapeHtml(labels.shareAs)}</p>
      <div class="mode-grid">
        <button class="mode-btn active" data-share-mode="full">${escapeHtml(labels.fullArticle)}</button>
        <button class="mode-btn" data-share-mode="headline">${escapeHtml(labels.headlineOnly)}</button>
        <button class="mode-btn" data-share-mode="summary">${escapeHtml(labels.shortSummary)}</button>
        <button class="mode-btn" data-share-mode="quote">${escapeHtml(labels.quoteCard)}</button>
      </div>

      <p class="share-section-title">${escapeHtml(labels.quickShare)}</p>
      <div class="share-grid">
        <button class="share-card" type="button" data-share-action="device"><span class="share-card-icon">↗</span><span class="share-details"><strong>${escapeHtml(labels.deviceShare)}</strong></span></button>
        <button class="share-card" type="button" data-share-action="copy"><span class="share-card-icon">🔗</span><span class="share-details"><strong>${escapeHtml(labels.copyLink)}</strong></span></button>
        <button class="share-card" type="button" data-share-action="whatsapp"><span class="share-card-icon">🟢</span><span class="share-details"><strong>${escapeHtml(labels.whatsapp)}</strong></span></button>
        <button class="share-card" type="button" data-share-action="facebook"><span class="share-card-icon">f</span><span class="share-details"><strong>${escapeHtml(labels.facebook)}</strong></span></button>
        <button class="share-card" type="button" data-share-action="x"><span class="share-card-icon">𝕏</span><span class="share-details"><strong>${escapeHtml(labels.x)}</strong></span></button>
        <button class="share-card" type="button" data-share-action="telegram"><span class="share-card-icon">✈</span><span class="share-details"><strong>${escapeHtml(labels.telegram)}</strong></span></button>
        <button class="share-card" type="button" data-share-action="email"><span class="share-card-icon">✉</span><span class="share-details"><strong>${escapeHtml(labels.email)}</strong></span></button>
        <button class="share-card" type="button" data-share-action="save"><span class="share-card-icon">★</span><span class="share-details"><strong>${escapeHtml(labels.saveForLater)}</strong></span></button>
        <button class="share-card" type="button" data-share-action="download-qr"><span class="share-card-icon">▣</span><span class="share-details"><strong>${escapeHtml(labels.downloadQr)}</strong></span></button>
      </div>

      <div class="share-output">
        <p class="share-output-title" id="shareModeLabel">${escapeHtml(labels.shareMode)}: ${escapeHtml(labels.fullArticle)}</p>
        <p class="share-output-title">${escapeHtml(labels.shareUrl)}:</p>
        <p class="share-url" id="shareUrlText"></p>
        <div class="qr-wrap">
          <strong>${escapeHtml(labels.qrCode)}</strong>
          <div id="qrCanvas"></div>
          <div class="modal-subtitle">${escapeHtml(labels.qrNote)}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const articleData = ${safeJson(articleData)};
    const labels = ${safeJson(labels)};
    const readerDefaults = { theme: "dark", fontSize: 18, lineHeight: 1.9 };
    let readerPrefs = { ...readerDefaults };
    let currentShareMode = "full";
    let currentUtterance = null;
    let toastTimer = null;

    function showToast(message) {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
    }

    function safeJsonParse(value, fallback) {
      try { return JSON.parse(value); } catch { return fallback; }
    }

    function loadReaderPrefs() {
      const saved = safeJsonParse(localStorage.getItem(articleData.readerPrefKey), null);
      if (saved) {
        readerPrefs = { ...readerDefaults, ...saved };
      }
      applyReaderPrefs();
    }

    function saveReaderPrefs() {
      localStorage.setItem(articleData.readerPrefKey, JSON.stringify(readerPrefs));
    }

    function applyReaderPrefs() {
      document.body.dataset.theme = readerPrefs.theme;
      document.documentElement.style.setProperty("--reader-font-size", readerPrefs.fontSize + "px");
      document.documentElement.style.setProperty("--reader-line-height", String(readerPrefs.lineHeight));
      document.querySelectorAll("[data-theme-value]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.themeValue === readerPrefs.theme);
      });
    }

    function resetReaderPrefs() {
      readerPrefs = { ...readerDefaults };
      saveReaderPrefs();
      applyReaderPrefs();
      showToast(labels.resetNow);
    }

    function openAccessibilityModal() {
      document.getElementById("accessibilityBackdrop").classList.add("show");
    }

    function closeAccessibilityModal(event) {
      if (event && event.target && event.target.id !== "accessibilityBackdrop") return;
      document.getElementById("accessibilityBackdrop").classList.remove("show");
    }

    function getShareUrl() {
      const url = new URL(articleData.articleUrl);
      url.searchParams.set("utm_source", "share");
      url.searchParams.set("utm_medium", "social");
      url.searchParams.set("utm_campaign", articleData.utmCampaign);
      return url.toString();
    }

    function getSharePayload() {
      const shareUrl = getShareUrl();
      const fullText = articleData.title + "\n\n" + articleData.description + "\n\n" + shareUrl;
      const headlineText = articleData.title + "\n\n" + shareUrl;
      const summaryText = articleData.description + "\n\n" + shareUrl;
      const quoteText = "“" + articleData.quoteText + "”\n\n" + articleData.title + "\n\n" + shareUrl;

      if (currentShareMode === "headline") {
        return { modeLabel: labels.headlineOnly, title: articleData.title, text: headlineText, previewSummary: articleData.title, url: shareUrl };
      }
      if (currentShareMode === "summary") {
        return { modeLabel: labels.shortSummary, title: articleData.title, text: summaryText, previewSummary: articleData.description, url: shareUrl };
      }
      if (currentShareMode === "quote") {
        return { modeLabel: labels.quoteCard, title: articleData.title, text: quoteText, previewSummary: "“" + articleData.quoteText + "”", url: shareUrl };
      }
      return { modeLabel: labels.fullArticle, title: articleData.title, text: fullText, previewSummary: articleData.description, url: shareUrl };
    }

    function updateShareCount(increment) {
      let count = Number(localStorage.getItem(articleData.shareCountKey) || 0);
      if (increment) {
        count += 1;
        localStorage.setItem(articleData.shareCountKey, String(count));
      }
      document.getElementById("shareCountText").textContent = "Shared " + count + " times";
    }

    function renderQrCode(url) {
      const qrWrap = document.getElementById("qrCanvas");
      qrWrap.innerHTML = "";
      if (window.QRCode && window.QRCode.toCanvas) {
        const canvas = document.createElement("canvas");
        qrWrap.appendChild(canvas);
        window.QRCode.toCanvas(canvas, url, {
          width: 280,
          margin: 1,
          color: { dark: "#111111", light: "#ffffff" }
        }, function(error) {
          if (error) {
            qrWrap.innerHTML = "<img alt=\"QR\" src=\"https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=" + encodeURIComponent(url) + "\">";
          }
        });
      } else {
        qrWrap.innerHTML = "<img alt=\"QR\" src=\"https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=" + encodeURIComponent(url) + "\">";
      }
    }

    function renderShareModal() {
      const payload = getSharePayload();
      document.getElementById("previewTitle").textContent = articleData.title;
      document.getElementById("previewSummary").textContent = payload.previewSummary;
      document.getElementById("shareModeLabel").textContent = labels.shareMode + ": " + payload.modeLabel;
      document.getElementById("shareUrlText").textContent = payload.url;
      renderQrCode(payload.url);
      document.querySelectorAll("[data-share-mode]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.shareMode === currentShareMode);
      });
      updateShareCount(false);
    }

    function openShareModal() {
      document.getElementById("shareBackdrop").classList.add("show");
      renderShareModal();
    }

    function closeShareModal(event) {
      if (event && event.target && event.target.id !== "shareBackdrop") return;
      document.getElementById("shareBackdrop").classList.remove("show");
    }

    async function doShareAction(action) {
      const payload = getSharePayload();
      const encodedText = encodeURIComponent(payload.text);
      const encodedUrl = encodeURIComponent(payload.url);

      if (action === "device") {
        if (navigator.share) {
          try {
            await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
            updateShareCount(true);
            return;
          } catch (error) {
            if (error && error.name === "AbortError") return;
          }
        }
        await navigator.clipboard.writeText(payload.text);
        showToast(labels.copied);
        updateShareCount(true);
        return;
      }

      if (action === "copy") {
        await navigator.clipboard.writeText(payload.url);
        showToast(labels.copied);
        updateShareCount(true);
        return;
      }

      if (action === "whatsapp") {
        window.open("https://wa.me/?text=" + encodedText, "_blank");
        updateShareCount(true);
        return;
      }

      if (action === "facebook") {
        window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl, "_blank");
        updateShareCount(true);
        return;
      }

      if (action === "x") {
        window.open("https://twitter.com/intent/tweet?text=" + encodedText, "_blank");
        updateShareCount(true);
        return;
      }

      if (action === "telegram") {
        window.open("https://t.me/share/url?url=" + encodedUrl + "&text=" + encodeURIComponent(payload.title), "_blank");
        updateShareCount(true);
        return;
      }

      if (action === "email") {
        window.location.href = "mailto:?subject=" + encodeURIComponent(payload.title) + "&body=" + encodedText;
        updateShareCount(true);
        return;
      }

      if (action === "save") {
        const saved = safeJsonParse(localStorage.getItem(articleData.savedKey), []);
        if (!saved.find((item) => item.slug === articleData.slug && item.lang === articleData.lang)) {
          saved.unshift({ slug: articleData.slug, lang: articleData.lang, title: articleData.title, url: articleData.articleUrl, image: articleData.image, savedAt: new Date().toISOString() });
          localStorage.setItem(articleData.savedKey, JSON.stringify(saved.slice(0, 50)));
        }
        showToast(labels.saved);
        return;
      }

      if (action === "download-qr") {
        const canvas = document.querySelector("#qrCanvas canvas");
        const img = document.querySelector("#qrCanvas img");
        const link = document.createElement("a");
        link.download = articleData.slug + "-qr.png";
        if (canvas) {
          link.href = canvas.toDataURL("image/png");
          link.click();
        } else if (img) {
          link.href = img.src;
          link.click();
        }
        return;
      }
    }

    function stopSpeech() {
      if (currentUtterance) {
        speechSynthesis.cancel();
        currentUtterance = null;
      }
      const listenBtn = document.getElementById("listenBtn");
      if (listenBtn) listenBtn.textContent = labels.listen;
    }

    function toggleSpeech() {
      const listenBtn = document.getElementById("listenBtn");
      if (!listenBtn) return;

      if (currentUtterance) {
        stopSpeech();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(articleData.speechText);
      utterance.lang = articleData.lang === "bn" ? "bn-BD" : "en-US";
      utterance.onend = stopSpeech;
      utterance.onerror = stopSpeech;
      currentUtterance = utterance;
      listenBtn.textContent = labels.stop;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }

    document.getElementById("shareBtn").addEventListener("click", openShareModal);
    document.getElementById("listenBtn").addEventListener("click", toggleSpeech);
    document.getElementById("accessibilityBtn").addEventListener("click", openAccessibilityModal);
    document.getElementById("accessibilityClose").addEventListener("click", () => closeAccessibilityModal());
    document.getElementById("shareClose").addEventListener("click", () => closeShareModal());
    document.getElementById("accessibilityBackdrop").addEventListener("click", closeAccessibilityModal);
    document.getElementById("shareBackdrop").addEventListener("click", closeShareModal);
    document.getElementById("readerReset").addEventListener("click", resetReaderPrefs);
    document.getElementById("fontMinus").addEventListener("click", () => {
      readerPrefs.fontSize = Math.max(14, readerPrefs.fontSize - 1);
      saveReaderPrefs();
      applyReaderPrefs();
    });
    document.getElementById("fontPlus").addEventListener("click", () => {
      readerPrefs.fontSize = Math.min(26, readerPrefs.fontSize + 1);
      saveReaderPrefs();
      applyReaderPrefs();
    });
    document.getElementById("lineMinus").addEventListener("click", () => {
      readerPrefs.lineHeight = Math.max(1.5, +(readerPrefs.lineHeight - 0.1).toFixed(1));
      saveReaderPrefs();
      applyReaderPrefs();
    });
    document.getElementById("linePlus").addEventListener("click", () => {
      readerPrefs.lineHeight = Math.min(2.4, +(readerPrefs.lineHeight + 0.1).toFixed(1));
      saveReaderPrefs();
      applyReaderPrefs();
    });
    document.querySelectorAll("[data-theme-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        readerPrefs.theme = btn.dataset.themeValue;
        saveReaderPrefs();
        applyReaderPrefs();
      });
    });
    document.querySelectorAll("[data-share-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentShareMode = btn.dataset.shareMode;
        renderShareModal();
      });
    });
    document.querySelectorAll("[data-share-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await doShareAction(btn.dataset.shareAction);
        } catch (error) {
          showToast("Action failed");
          console.error(error);
        }
      });
    });

    window.addEventListener("beforeunload", stopSpeech);
    loadReaderPrefs();
    updateShareCount(false);
  </script>
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
    writeArticleFile(path.join(process.cwd(), "article", slug, "index.html"), html);
  }

  for (const post of banglaPosts) {
    const slug = safeSlug(post.slug);
    if (!slug) continue;
    const html = buildArticleHtml(post, "bn");
    writeArticleFile(path.join(process.cwd(), "bd", "article", slug, "index.html"), html);
  }

  console.log(`Built ${englishPosts.length} English articles`);
  console.log(`Built ${banglaPosts.length} Bangla articles`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
