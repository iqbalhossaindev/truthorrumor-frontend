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
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function trimText(value, limit) {
  const text = stripHtml(value);
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1)).trim()}…`;
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
    post.long_description ||
    post.description ||
    post.summary ||
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

function getTopicIcon(category) {
  const c = String(category || "").toLowerCase();
  if (c.includes("energy") || c.includes("power") || c.includes("fuel")) return "⚡";
  if (c.includes("politic") || c.includes("national") || c.includes("government") || c.includes("bangladesh")) return "🏛";
  if (c.includes("world") || c.includes("international") || c.includes("global")) return "🌍";
  if (c.includes("econom") || c.includes("business") || c.includes("market") || c.includes("trade")) return "💹";
  if (c.includes("sport")) return "🏅";
  if (c.includes("tech") || c.includes("science")) return "🧪";
  if (c.includes("health")) return "🩺";
  if (c.includes("crime") || c.includes("law")) return "⚖️";
  if (c.includes("entertainment") || c.includes("culture")) return "🎭";
  return "•";
}

function labelsFor(lang) {
  if (lang === "bn") {
    return {
      siteName: "TruthOrRumor",
      backHome: "হোমে ফিরে যান",
      share: "শেয়ার",
      source: "সোর্স",
      listen: "শুনুন",
      stop: "শোনা বন্ধ করুন",
      accessibility: "অ্যাক্সেসিবিলিটি",
      close: "Close",
      theme: "Theme",
      dark: "Dark",
      sepia: "Sepia",
      soft: "Soft Light",
      readerWidth: "Reader Width",
      narrow: "Narrow",
      normal: "Normal",
      wide: "Wide",
      textSize: "Font Size",
      lineSpace: "Line Spacing",
      tight: "Tight",
      relaxed: "Relaxed",
      readerMode: "Reader Mode",
      toggleReaderMode: "Toggle Reader Mode",
      reset: "Reset",
      hapticsAndAutoScroll: "Haptic Feedback & Auto Scroll",
      hapticsOn: "Haptics On",
      hapticsOff: "Haptics Off",
      autoScrollOn: "Auto Scroll On",
      autoScrollOff: "Auto Scroll Off",
      readingNote: "উন্নত রিডিং কন্ট্রোল ব্যবহার করে আরও স্বচ্ছল, ব্যক্তিগত ও আরামদায়ক পড়ার অভিজ্ঞতা উপভোগ করুন।",
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
      verifiedNews: "Verified News",
      rumorDetected: "Rumor Detected",
      updated: "আপডেট",
      category: "বিভাগ",
      narratorIntro: "এই প্রতিবেদনটি শোনানো হচ্ছে",
      previewTitle: "TruthOrRumor",
      actionFailed: "Action failed"
    };
  }

  return {
    siteName: "TruthOrRumor",
    backHome: "Back to Home",
    share: "Share",
    source: "Source",
    listen: "Tap To Listen",
    stop: "Stop Listening",
    accessibility: "Accessibility",
    close: "Close",
    theme: "Theme",
    dark: "Dark",
    sepia: "Sepia",
    soft: "Soft Light",
    readerWidth: "Reader Width",
    narrow: "Narrow",
    normal: "Normal",
    wide: "Wide",
    textSize: "Font Size",
    lineSpace: "Line Spacing",
    tight: "Tight",
    relaxed: "Relaxed",
    readerMode: "Reader Mode",
    toggleReaderMode: "Toggle Reader Mode",
    reset: "Reset",
    hapticsAndAutoScroll: "Haptic Feedback & Auto Scroll",
    hapticsOn: "Haptics On",
    hapticsOff: "Haptics Off",
    autoScrollOn: "Auto Scroll On",
    autoScrollOff: "Auto Scroll Off",
    readingNote: "Use advanced reading controls for a smoother, more personal and comfortable reading experience.",
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
    verifiedNews: "Verified News",
    rumorDetected: "Rumor Detected",
    updated: "Updated",
    category: "Category",
    narratorIntro: "Now reading this article",
    previewTitle: "TruthOrRumor",
    actionFailed: "Action failed"
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
  const categoryIcon = getTopicIcon(category);
  const sourceUrl = getSourceUrl(post);
  const body = getBody(post);
  const bodyHtml = renderBody(body);
  const status = getStatus(post);
  const statusLabel = status === "rumor" ? labels.rumorDetected : labels.verifiedNews;
  const statusSymbol = status === "rumor" ? "✕" : "✓";
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
    categoryIcon,
    sourceUrl,
    articleUrl,
    verdict: status,
    verdictLabel: statusLabel,
    verdictSymbol: statusSymbol,
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
      --bg: #050c18;
      --bg-soft: rgba(10, 22, 44, 0.82);
      --card: rgba(17, 30, 58, 0.84);
      --card-2: rgba(22, 36, 67, 0.78);
      --line: rgba(255,255,255,0.12);
      --line-strong: rgba(255,255,255,0.18);
      --text: #f7f9ff;
      --muted: #b7c2e2;
      --accent: #f4b54d;
      --accent-soft: rgba(244,181,77,0.22);
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
        radial-gradient(circle at top left, rgba(244,181,77,0.08), transparent 24%),
        radial-gradient(circle at top right, rgba(59,130,246,0.18), transparent 28%),
        radial-gradient(circle at 20% 78%, rgba(34,197,94,0.10), transparent 18%),
        linear-gradient(180deg, #030915 0%, #07101f 48%, #08172d 100%);
      background-attachment: fixed;
      font-size: var(--reader-font-size);
      line-height: var(--reader-line-height);
    }
    body[data-theme="sepia"] {
      --bg: #24180e;
      --bg-soft: rgba(52, 37, 20, 0.86);
      --card: rgba(63, 46, 27, 0.88);
      --card-2: rgba(73, 54, 31, 0.82);
      --line: rgba(255,255,255,0.12);
      --line-strong: rgba(255,255,255,0.18);
      --text: #f6ebda;
      --muted: #dbc8ab;
      background: linear-gradient(180deg, #23170d 0%, #322314 100%);
    }
    body[data-theme="soft-light"] {
      --bg: #f6f2ea;
      --bg-soft: rgba(255,255,255,0.90);
      --card: rgba(255,255,255,0.93);
      --card-2: rgba(255,255,255,0.96);
      --line: rgba(18,28,44,0.10);
      --line-strong: rgba(18,28,44,0.16);
      --text: #152032;
      --muted: #52637c;
      background: linear-gradient(180deg, #f7f4ef 0%, #ece7de 100%);
    }
    body.reader-mode .hero-media { display: none; }
    body.reader-mode .article-summary { font-size: 20px; }
    a { color: inherit; }
    .page-shell {
      width: min(var(--reader-width), calc(100% - 24px));
      margin: 0 auto;
      padding: 18px 0 64px;
      transition: width .25s ease;
    }
    .topbar {
      position: sticky;
      top: 10px;
      z-index: 25;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      margin: 0 0 18px;
      border-radius: 28px;
      border: 1px solid var(--line);
      background: rgba(14, 23, 42, 0.68);
      backdrop-filter: blur(18px);
      box-shadow: 0 16px 42px rgba(0,0,0,0.22);
    }
    body[data-theme="soft-light"] .topbar { background: rgba(255,255,255,0.82); }
    .top-link, .brand-link {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text);
      font-weight: 800;
      border-radius: 18px;
      padding: 12px 16px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.04);
    }
    .brand-link { background: transparent; border-color: transparent; }
    .article-card {
      border-radius: 30px;
      overflow: hidden;
      border: 1px solid var(--line);
      background: var(--bg-soft);
      backdrop-filter: blur(18px);
      box-shadow: 0 18px 64px rgba(0,0,0,0.26);
    }
    .hero-media {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: rgba(255,255,255,0.05);
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
      background: linear-gradient(180deg, rgba(2, 6, 15, 0.05) 0%, rgba(2, 6, 15, 0.74) 100%);
    }
    .hero-verdict,
    .hero-topic {
      position: absolute;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(16, 24, 43, 0.78);
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 24px rgba(0,0,0,0.24);
      font-weight: 800;
    }
    .hero-verdict {
      top: 16px;
      left: 16px;
      color: white;
    }
    .hero-verdict.truth { background: rgba(34,197,94,0.92); }
    .hero-verdict.rumor { background: rgba(239,68,68,0.92); }
    .verdict-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255,255,255,0.18);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      line-height: 1;
      color: white;
      flex: 0 0 auto;
    }
    .hero-topic {
      top: 16px;
      right: 16px;
      color: white;
    }
    .hero-topic-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255,255,255,0.18);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      line-height: 1;
      flex: 0 0 auto;
    }
    .content-wrap {
      padding: 22px 18px 28px;
    }
    .eyebrow {
      margin: 0 0 12px;
      color: var(--accent);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .article-title {
      margin: 0 0 16px;
      font-size: clamp(30px, 4.8vw, 54px);
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
    .article-body p { margin: 0 0 1.25em; }
    .article-body img,
    .article-body iframe,
    .article-body video {
      max-width: 100%;
      border-radius: 20px;
    }
    .end-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      margin-top: 30px;
    }
    .action-btn {
      appearance: none;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
      color: var(--text);
      min-height: 72px;
      padding: 16px 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      font-size: 18px;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
      flex: 1 1 220px;
    }
    .action-btn.primary {
      border-color: rgba(244,181,77,0.42);
      background: linear-gradient(180deg, rgba(244,181,77,0.28), rgba(244,181,77,0.14));
    }
    .action-btn .icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 19px;
      line-height: 1;
    }
    .action-btn[hidden] { display: none !important; }
    .floating-accessibility-btn {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 40;
      width: 86px;
      height: 86px;
      border-radius: 28px;
      border: 1px solid rgba(255,255,255,0.16);
      background: rgba(74, 86, 120, 0.84);
      backdrop-filter: blur(16px);
      box-shadow: 0 18px 44px rgba(0,0,0,0.28);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .floating-accessibility-btn svg {
      width: 42px;
      height: 42px;
      color: white;
    }
    .accessibility-status {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--accent);
      color: #111;
      border: 5px solid #07101f;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 18px;
      line-height: 1;
    }
    body[data-theme="soft-light"] .accessibility-status { border-color: #f0ece3; }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 10, 19, 0.64);
      backdrop-filter: blur(10px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 60;
    }
    .modal-backdrop.show { display: flex; }
    .modal-card {
      width: min(980px, 100%);
      max-height: min(90vh, 980px);
      overflow: auto;
      border-radius: 32px;
      border: 1px solid var(--line);
      background: rgba(13, 22, 40, 0.88);
      color: var(--text);
      padding: 20px;
      backdrop-filter: blur(20px);
      box-shadow: 0 28px 90px rgba(0,0,0,0.36);
    }
    body[data-theme="soft-light"] .modal-card { background: rgba(249,249,249,0.94); }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
    }
    .close-pill {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.05);
      color: var(--text);
      border-radius: 20px;
      padding: 14px 18px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .modal-title { margin: 0 0 6px; font-size: clamp(30px, 5vw, 56px); font-weight: 800; }
    .modal-subtitle { margin: 0; color: var(--muted); font-size: 15px; line-height: 1.6; }
    .settings-section-title,
    .share-section-title {
      margin: 20px 0 12px;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: .10em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .setting-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
    .setting-btn {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.05);
      color: var(--text);
      border-radius: 18px;
      padding: 14px 18px;
      font-weight: 800;
      cursor: pointer;
      min-width: 120px;
    }
    .setting-btn.compact { min-width: 82px; }
    .setting-btn.active {
      border-color: rgba(244,181,77,0.52);
      background: linear-gradient(180deg, rgba(244,181,77,0.42), rgba(244,181,77,0.20));
      color: #111;
    }
    .setting-btn.success.active {
      border-color: rgba(34,197,94,0.42);
      background: linear-gradient(180deg, rgba(34,197,94,0.42), rgba(34,197,94,0.22));
      color: white;
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
      position: relative;
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
    .preview-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(3,8,18,0.05) 0%, rgba(3,8,18,0.65) 100%);
    }
    .preview-badge,
    .preview-topic {
      position: absolute;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: white;
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: 0 8px 18px rgba(0,0,0,0.24);
    }
    .preview-badge {
      top: 8px;
      left: 8px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    .preview-badge.truth { background: #22c55e; }
    .preview-badge.rumor { background: #ef4444; }
    .preview-topic {
      top: 8px;
      right: 8px;
      min-width: 30px;
      height: 30px;
      padding: 0 8px;
      border-radius: 999px;
      background: rgba(13, 22, 40, 0.82);
      font-size: 14px;
    }
    .preview-kicker-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .preview-kicker,
    .preview-category-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .04em;
    }
    .preview-kicker.truth { background: rgba(34,197,94,0.18); color: #bbf7d0; }
    .preview-kicker.rumor { background: rgba(239,68,68,0.18); color: #fecaca; }
    .preview-category-chip { background: rgba(255,255,255,0.06); color: var(--text); }
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
    .mode-grid,
    .share-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .mode-btn,
    .share-card {
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.05);
      color: var(--text);
      border-radius: 20px;
      padding: 18px;
      cursor: pointer;
      font-weight: 800;
    }
    .mode-btn.active {
      border-color: rgba(244,181,77,0.56);
      background: linear-gradient(180deg, rgba(244,181,77,0.36), rgba(244,181,77,0.16));
      box-shadow: 0 0 0 1px rgba(244,181,77,0.12) inset;
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
      border: 1px solid rgba(244,181,77,0.34);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
      flex: 0 0 auto;
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
    #qrCanvas canvas,
    #qrCanvas img {
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
      bottom: 24px;
      transform: translateX(-50%) translateY(18px);
      opacity: 0;
      background: rgba(12,18,34,0.92);
      color: white;
      padding: 12px 18px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.16);
      backdrop-filter: blur(16px);
      z-index: 80;
      transition: opacity .22s ease, transform .22s ease;
    }
    .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    @media (max-width: 760px) {
      .page-shell { width: calc(100% - 16px); padding-top: 12px; }
      .preview-card { grid-template-columns: 1fr; }
      .preview-media { width: 110px; height: 110px; }
      .action-btn { min-height: 66px; font-size: 17px; }
      .content-wrap { padding: 18px 14px 24px; }
    }
    @media (max-width: 520px) {
      .topbar { gap: 8px; padding: 10px 12px; }
      .top-link, .brand-link { font-size: 13px; padding: 10px 12px; }
      .brand-link { padding-right: 0; }
      .article-title { font-size: clamp(28px, 9vw, 42px); }
      .mode-grid, .share-grid { grid-template-columns: 1fr; }
      .action-btn { flex-basis: 100%; }
      .floating-accessibility-btn { width: 76px; height: 76px; border-radius: 24px; }
      .floating-accessibility-btn svg { width: 38px; height: 38px; }
      .preview-title { font-size: clamp(24px, 10vw, 42px); }
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
        <div class="hero-verdict ${status === "rumor" ? "rumor" : "truth"}">
          <span class="verdict-icon">${escapeHtml(statusSymbol)}</span>
          <span>${escapeHtml(statusLabel)}</span>
        </div>
        <div class="hero-topic">
          <span class="hero-topic-icon">${escapeHtml(categoryIcon)}</span>
          <span>${escapeHtml(category)}</span>
        </div>
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
          <button class="action-btn" id="listenBtn" type="button"><span class="icon">🔊</span><span>${escapeHtml(labels.listen)}</span></button>
          <button class="action-btn primary" id="shareBtn" type="button"><span class="icon">⤴</span><span>${escapeHtml(labels.share)}</span></button>
          <a class="action-btn" id="sourceBtn" href="${escapeHtml(sourceUrl || "#")}" target="_blank" rel="noopener noreferrer" ${sourceUrl ? "" : "hidden"}><span class="icon">↗</span><span>${escapeHtml(labels.source)}</span></a>
        </div>
      </div>
    </article>
  </div>

  <button class="floating-accessibility-btn" id="accessibilityBtn" aria-label="${escapeHtml(labels.accessibility)}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="4.5" r="1.6"></circle>
      <path d="M6 8.2h12"></path>
      <path d="M12 6v6.2"></path>
      <path d="M9.4 19.2l2.6-5.6 2.6 5.6"></path>
    </svg>
    <span class="accessibility-status">✓</span>
  </button>

  <div class="modal-backdrop" id="accessibilityBackdrop">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-header">
        <button class="close-pill" type="button" id="accessibilityClose">‹ ${escapeHtml(labels.close)}</button>
        <div>
          <h2 class="modal-title">${escapeHtml(labels.accessibility)}</h2>
          <p class="modal-subtitle">${escapeHtml(labels.readingNote)}</p>
        </div>
      </div>

      <div>
        <p class="settings-section-title">${escapeHtml(labels.theme)}</p>
        <div class="setting-row">
          <button class="setting-btn" data-theme-value="dark">${escapeHtml(labels.dark)}</button>
          <button class="setting-btn" data-theme-value="sepia">${escapeHtml(labels.sepia)}</button>
          <button class="setting-btn" data-theme-value="soft-light">${escapeHtml(labels.soft)}</button>
        </div>

        <p class="settings-section-title">${escapeHtml(labels.readerWidth)}</p>
        <div class="setting-row">
          <button class="setting-btn" data-width-value="narrow">${escapeHtml(labels.narrow)}</button>
          <button class="setting-btn" data-width-value="normal">${escapeHtml(labels.normal)}</button>
          <button class="setting-btn" data-width-value="wide">${escapeHtml(labels.wide)}</button>
        </div>

        <p class="settings-section-title">${escapeHtml(labels.textSize)}</p>
        <div class="setting-row">
          <button class="setting-btn compact" id="fontMinus">A-</button>
          <button class="setting-btn compact" id="fontPlus">A+</button>
        </div>

        <p class="settings-section-title">${escapeHtml(labels.lineSpace)}</p>
        <div class="setting-row">
          <button class="setting-btn" data-spacing-value="tight">${escapeHtml(labels.tight)}</button>
          <button class="setting-btn" data-spacing-value="relaxed">${escapeHtml(labels.relaxed)}</button>
        </div>

        <p class="settings-section-title">${escapeHtml(labels.readerMode)}</p>
        <div class="setting-row">
          <button class="setting-btn" id="readerModeBtn">${escapeHtml(labels.toggleReaderMode)}</button>
          <button class="setting-btn" id="readerReset">${escapeHtml(labels.reset)}</button>
        </div>

        <p class="settings-section-title">${escapeHtml(labels.hapticsAndAutoScroll)}</p>
        <div class="setting-row">
          <button class="setting-btn success" id="hapticsBtn">${escapeHtml(labels.hapticsOn)}</button>
          <button class="setting-btn" id="autoScrollBtn">${escapeHtml(labels.autoScrollOff)}</button>
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
        <button class="close-pill" type="button" id="shareClose">×</button>
      </div>

      <div class="preview-card">
        <div class="preview-media">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" onerror="this.src='${escapeHtml(`${SITE_URL}/logo.png`)}'" />
          <div class="preview-overlay"></div>
          <span class="preview-badge ${status === "rumor" ? "rumor" : "truth"}">${escapeHtml(statusSymbol)}</span>
          <span class="preview-topic">${escapeHtml(categoryIcon)}</span>
        </div>
        <div>
          <div class="preview-kicker-row">
            <span class="preview-kicker ${status === "rumor" ? "rumor" : "truth"}">${escapeHtml(statusLabel)}</span>
            <span class="preview-category-chip">${escapeHtml(categoryIcon)} ${escapeHtml(category)}</span>
          </div>
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
    const readerDefaults = {
      theme: "dark",
      width: "normal",
      fontSize: 18,
      spacing: "tight",
      readerMode: false,
      haptics: true,
      autoScroll: false
    };
    const widthMap = { narrow: 760, normal: 860, wide: 1040 };
    const spacingMap = { tight: 1.9, relaxed: 2.2 };
    let readerPrefs = { ...readerDefaults };
    let currentShareMode = "full";
    let currentUtterance = null;
    let toastTimer = null;
    let autoScrollTimer = null;

    function showToast(message) {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
    }

    function vibrateSoft() {
      if (readerPrefs.haptics && navigator.vibrate) {
        navigator.vibrate(18);
      }
    }

    function safeJsonParse(value, fallback) {
      try { return JSON.parse(value); } catch { return fallback; }
    }

    function saveReaderPrefs() {
      localStorage.setItem(articleData.readerPrefKey, JSON.stringify(readerPrefs));
    }

    function loadReaderPrefs() {
      const saved = safeJsonParse(localStorage.getItem(articleData.readerPrefKey), null);
      if (saved) {
        readerPrefs = { ...readerDefaults, ...saved };
      }
      applyReaderPrefs();
    }

    function applyReaderPrefs() {
      document.body.dataset.theme = readerPrefs.theme;
      document.documentElement.style.setProperty("--reader-width", widthMap[readerPrefs.width] + "px");
      document.documentElement.style.setProperty("--reader-font-size", readerPrefs.fontSize + "px");
      document.documentElement.style.setProperty("--reader-line-height", String(spacingMap[readerPrefs.spacing]));
      document.body.classList.toggle("reader-mode", !!readerPrefs.readerMode);

      document.querySelectorAll("[data-theme-value]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.themeValue === readerPrefs.theme);
      });
      document.querySelectorAll("[data-width-value]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.widthValue === readerPrefs.width);
      });
      document.querySelectorAll("[data-spacing-value]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.spacingValue === readerPrefs.spacing);
      });

      const readerModeBtn = document.getElementById("readerModeBtn");
      if (readerModeBtn) {
        readerModeBtn.classList.toggle("active", !!readerPrefs.readerMode);
      }

      const hapticsBtn = document.getElementById("hapticsBtn");
      if (hapticsBtn) {
        hapticsBtn.textContent = readerPrefs.haptics ? labels.hapticsOn : labels.hapticsOff;
        hapticsBtn.classList.toggle("active", !!readerPrefs.haptics);
      }

      const autoScrollBtn = document.getElementById("autoScrollBtn");
      if (autoScrollBtn) {
        autoScrollBtn.textContent = readerPrefs.autoScroll ? labels.autoScrollOn : labels.autoScrollOff;
        autoScrollBtn.classList.toggle("active", !!readerPrefs.autoScroll);
      }

      syncAutoScroll();
    }

    function resetReaderPrefs() {
      readerPrefs = { ...readerDefaults };
      saveReaderPrefs();
      applyReaderPrefs();
      showToast(labels.reset);
      vibrateSoft();
    }

    function syncAutoScroll() {
      if (autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
      if (readerPrefs.autoScroll) {
        autoScrollTimer = setInterval(() => {
          window.scrollBy({ top: 1, left: 0, behavior: "auto" });
        }, 45);
      }
    }

    function openAccessibilityModal() {
      document.getElementById("accessibilityBackdrop").classList.add("show");
      vibrateSoft();
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
      vibrateSoft();
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
            vibrateSoft();
            return;
          } catch (error) {
            if (error && error.name === "AbortError") return;
          }
        }
        await navigator.clipboard.writeText(payload.text);
        showToast(labels.copied);
        updateShareCount(true);
        vibrateSoft();
        return;
      }

      if (action === "copy") {
        await navigator.clipboard.writeText(payload.url);
        showToast(labels.copied);
        updateShareCount(true);
        vibrateSoft();
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
        vibrateSoft();
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
        vibrateSoft();
      }
    }

    function stopSpeech() {
      if (currentUtterance) {
        speechSynthesis.cancel();
        currentUtterance = null;
      }
      const listenBtnText = document.getElementById("listenBtnText");
      if (listenBtnText) listenBtnText.textContent = labels.listen;
    }

    function toggleSpeech() {
      const listenBtnText = document.getElementById("listenBtnText");
      if (!listenBtnText) return;

      if (currentUtterance) {
        stopSpeech();
        vibrateSoft();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(articleData.speechText);
      utterance.lang = articleData.lang === "bn" ? "bn-BD" : "en-US";
      utterance.onend = stopSpeech;
      utterance.onerror = stopSpeech;
      currentUtterance = utterance;
      listenBtnText.textContent = labels.stop;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      vibrateSoft();
    }

    function openSource(event) {
      if (!articleData.sourceUrl) {
        event.preventDefault();
        showToast(labels.noSource);
        return;
      }
      vibrateSoft();
    }

    document.getElementById("shareBtn").addEventListener("click", openShareModal);
    document.getElementById("listenBtn").addEventListener("click", toggleSpeech);
    document.getElementById("sourceBtn").addEventListener("click", openSource);
    document.getElementById("accessibilityBtn").addEventListener("click", openAccessibilityModal);
    document.getElementById("accessibilityClose").addEventListener("click", () => closeAccessibilityModal());
    document.getElementById("shareClose").addEventListener("click", () => closeShareModal());
    document.getElementById("accessibilityBackdrop").addEventListener("click", closeAccessibilityModal);
    document.getElementById("shareBackdrop").addEventListener("click", closeShareModal);
    document.getElementById("readerReset").addEventListener("click", resetReaderPrefs);
    document.getElementById("readerModeBtn").addEventListener("click", () => {
      readerPrefs.readerMode = !readerPrefs.readerMode;
      saveReaderPrefs();
      applyReaderPrefs();
      vibrateSoft();
    });
    document.getElementById("hapticsBtn").addEventListener("click", () => {
      readerPrefs.haptics = !readerPrefs.haptics;
      saveReaderPrefs();
      applyReaderPrefs();
      vibrateSoft();
    });
    document.getElementById("autoScrollBtn").addEventListener("click", () => {
      readerPrefs.autoScroll = !readerPrefs.autoScroll;
      saveReaderPrefs();
      applyReaderPrefs();
      vibrateSoft();
    });
    document.getElementById("fontMinus").addEventListener("click", () => {
      readerPrefs.fontSize = Math.max(14, readerPrefs.fontSize - 1);
      saveReaderPrefs();
      applyReaderPrefs();
      vibrateSoft();
    });
    document.getElementById("fontPlus").addEventListener("click", () => {
      readerPrefs.fontSize = Math.min(28, readerPrefs.fontSize + 1);
      saveReaderPrefs();
      applyReaderPrefs();
      vibrateSoft();
    });
    document.querySelectorAll("[data-theme-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        readerPrefs.theme = btn.dataset.themeValue;
        saveReaderPrefs();
        applyReaderPrefs();
        vibrateSoft();
      });
    });
    document.querySelectorAll("[data-width-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        readerPrefs.width = btn.dataset.widthValue;
        saveReaderPrefs();
        applyReaderPrefs();
        vibrateSoft();
      });
    });
    document.querySelectorAll("[data-spacing-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        readerPrefs.spacing = btn.dataset.spacingValue;
        saveReaderPrefs();
        applyReaderPrefs();
        vibrateSoft();
      });
    });
    document.querySelectorAll("[data-share-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentShareMode = btn.dataset.shareMode;
        renderShareModal();
        vibrateSoft();
      });
    });
    document.querySelectorAll("[data-share-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await doShareAction(btn.dataset.shareAction);
        } catch (error) {
          showToast(labels.actionFailed);
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
