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
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
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
    post.long_description ||
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
  if (c.includes("politic") || c.includes("government") || c.includes("election") || c.includes("national")) return "🏛";
  if (c.includes("world") || c.includes("international") || c.includes("global")) return "🌍";
  if (c.includes("business") || c.includes("econom") || c.includes("trade") || c.includes("market")) return "💹";
  if (c.includes("sport")) return "🏅";
  if (c.includes("tech") || c.includes("science")) return "🧪";
  if (c.includes("health")) return "🩺";
  if (c.includes("crime") || c.includes("law")) return "⚖️";
  if (c.includes("entertainment") || c.includes("culture")) return "🎭";
  return "•";
}

function getLabels(lang) {
  if (lang === "bn") {
    return {
      siteName: "TruthOrRumor",
      backHome: "← Back to Home",
      share: "Share",
      source: "Source",
      listen: "শুনুন",
      stopListening: "শোনা বন্ধ করুন",
      accessibility: "Accessibility",
      close: "Close",
      theme: "THEME",
      dark: "Dark",
      sepia: "Sepia",
      softLight: "Soft Light",
      readerWidth: "READER WIDTH",
      narrow: "Narrow",
      normal: "Normal",
      wide: "Wide",
      fontSize: "FONT SIZE",
      lineSpacing: "LINE SPACING",
      tight: "Tight",
      relaxed: "Relaxed",
      readerMode: "READER MODE",
      toggleReaderMode: "Toggle Reader Mode",
      reset: "Reset",
      hapticsAndAutoScroll: "HAPTIC FEEDBACK & AUTO SCROLL",
      hapticsOn: "Haptics On",
      hapticsOff: "Haptics Off",
      autoScrollOn: "Auto Scroll On",
      autoScrollOff: "Auto Scroll Off",
      readNote: "উন্নত রিডিং কন্ট্রোল ব্যবহার করে আরও স্বচ্ছল, ব্যক্তিগত ও আরামদায়ক পড়ার অভিজ্ঞতা উপভোগ করুন।",
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
      savedForLater: "Saved for later",
      noSource: "Source not available",
      verifiedNews: "Verified News",
      rumorDetected: "Rumor Detected",
      updated: "Update",
      topic: "Topic",
      sourceOpenFail: "Source not available",
      shareFail: "Sharing is not available",
      readMore: "আরও পড়ুন"
    };
  }

  return {
    siteName: "TruthOrRumor",
    backHome: "← Back to Home",
    share: "Share",
    source: "Source",
    listen: "Tap To Listen",
    stopListening: "Stop Listening",
    accessibility: "Accessibility",
    close: "Close",
    theme: "THEME",
    dark: "Dark",
    sepia: "Sepia",
    softLight: "Soft Light",
    readerWidth: "READER WIDTH",
    narrow: "Narrow",
    normal: "Normal",
    wide: "Wide",
    fontSize: "FONT SIZE",
    lineSpacing: "LINE SPACING",
    tight: "Tight",
    relaxed: "Relaxed",
    readerMode: "READER MODE",
    toggleReaderMode: "Toggle Reader Mode",
    reset: "Reset",
    hapticsAndAutoScroll: "HAPTIC FEEDBACK & AUTO SCROLL",
    hapticsOn: "Haptics On",
    hapticsOff: "Haptics Off",
    autoScrollOn: "Auto Scroll On",
    autoScrollOff: "Auto Scroll Off",
    readNote: "Use advanced reading controls for a smoother, more personal and comfortable reading experience.",
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
    savedForLater: "Saved for later",
    noSource: "Source not available",
    verifiedNews: "Verified News",
    rumorDetected: "Rumor Detected",
    updated: "Update",
    topic: "Topic",
    sourceOpenFail: "Source not available",
    shareFail: "Sharing is not available",
    readMore: "Read More"
  };
}

function verificationBadgeSvg(status) {
  const isTruth = status === "truth";
  const bg = isTruth ? "#22c55e" : "#ff453a";
  const path = isTruth
    ? `<path d="M40 75 L63 97 L113 47" fill="none" stroke="#ffffff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"></path>`
    : `<path d="M45 45 L105 105 M105 45 L45 105" fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round"></path>`;

  return `
<svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="75" cy="75" r="70" fill="${bg}"></circle>
  ${path}
</svg>`.trim();
}

function accessibilityIconSvg() {
  return `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="32" cy="12" r="5" fill="#ffffff"></circle>
  <rect x="13" y="23" width="38" height="6" rx="3" fill="#ffffff"></rect>
  <rect x="29" y="28" width="6" height="20" rx="3" fill="#ffffff"></rect>
  <path d="M32 48 L22 61" stroke="#ffffff" stroke-width="6" stroke-linecap="round"></path>
  <path d="M32 48 L42 61" stroke="#ffffff" stroke-width="6" stroke-linecap="round"></path>
</svg>`.trim();
}

function speakerIconSvg() {
  return `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M5 10h4l5-4v12l-5-4H5z" fill="currentColor"></path>
  <path d="M17 8c1.5 1 2.5 2.4 2.5 4S18.5 15 17 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"></path>
  <path d="M19 5c2.7 1.7 4 4.1 4 7s-1.3 5.3-4 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"></path>
</svg>`.trim();
}

function shareIconSvg() {
  return `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="18" cy="5" r="2.5" fill="currentColor"></circle>
  <circle cx="6" cy="12" r="2.5" fill="currentColor"></circle>
  <circle cx="18" cy="19" r="2.5" fill="currentColor"></circle>
  <path d="M8.2 11l7-4.2M8.2 13l7 4.2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"></path>
</svg>`.trim();
}

function sourceIconSvg() {
  return `
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M7 17l-2 2M5 15l4-4M15 9l4-4M17 19l2-2" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"></path>
  <path d="M9 15l6-6" stroke="currentColor" stroke-width="2.3" fill="none" stroke-linecap="round"></path>
  <path d="M7.5 9.5a4 4 0 015.7 0M10.8 18a4 4 0 005.7 0" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"></path>
</svg>`.trim();
}

function topicBadgeHtml(category) {
  const icon = getTopicIcon(category);
  return `<span class="hero-topic-badge"><span class="hero-topic-icon">${escapeHtml(icon)}</span><span>${escapeHtml(category)}</span></span>`;
}

function verificationLabel(status, labels) {
  return status === "truth" ? labels.verifiedNews : labels.rumorDetected;
}

function buildClientScript(article, labels) {
  return `
(function () {
  const article = ${safeJson(article)};
  const labels = ${safeJson(labels)};
  const STORAGE_KEY = "tor-article-reading-settings";
  const SAVE_KEY = "tor-saved-articles";
  const body = document.body;

  const shareBtn = document.getElementById("shareBtn");
  const sourceBtn = document.getElementById("sourceBtn");
  const listenBtn = document.getElementById("listenBtn");
  const accessibilityFab = document.getElementById("accessibilityFab");
  const accessModal = document.getElementById("accessibilityModal");
  const accessCloseBtn = document.getElementById("accessCloseBtn");
  const resetBtn = document.getElementById("resetPrefsBtn");
  const readerToggleBtn = document.getElementById("readerToggleBtn");
  const hapticsBtn = document.getElementById("hapticsBtn");
  const autoScrollBtn = document.getElementById("autoScrollBtn");
  const shareModal = document.getElementById("shareModal");
  const shareCloseBtn = document.getElementById("shareCloseBtn");
  const shareOpenBtn = document.getElementById("shareOpenBtn");
  const shareUrlBox = document.getElementById("shareUrlBox");
  const shareModeText = document.getElementById("shareModeText");
  const qrImage = document.getElementById("qrImage");
  const qrDownloadBtn = document.getElementById("qrDownloadBtn");
  const toast = document.getElementById("toast");
  const fullArticleBtn = document.getElementById("modeFullArticle");
  const headlineOnlyBtn = document.getElementById("modeHeadlineOnly");
  const shortSummaryBtn = document.getElementById("modeShortSummary");
  const quoteCardBtn = document.getElementById("modeQuoteCard");
  const deviceShareBtn = document.getElementById("deviceShareBtn");
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const whatsappBtn = document.getElementById("whatsappBtn");
  const facebookBtn = document.getElementById("facebookBtn");
  const xBtn = document.getElementById("xBtn");
  const telegramBtn = document.getElementById("telegramBtn");
  const emailBtn = document.getElementById("emailBtn");
  const saveForLaterBtn = document.getElementById("saveForLaterBtn");
  const previewTitle = document.getElementById("sharePreviewTitle");
  const previewSummary = document.getElementById("sharePreviewSummary");
  const previewBadge = document.getElementById("sharePreviewBadge");
  const previewTopic = document.getElementById("sharePreviewTopic");
  const previewTopicIcon = document.getElementById("sharePreviewTopicIcon");
  const sharePreviewCard = document.getElementById("sharePreviewCard");
  const articleBody = document.getElementById("articleBody");

  let utterance = null;
  let speaking = false;
  let autoScrollTimer = null;

  const defaults = {
    theme: "dark",
    width: "normal",
    fontScale: 1,
    spacing: "tight",
    readerMode: false,
    haptics: true,
    autoScroll: false
  };

  function vibrate() {
    const settings = getSettings();
    if (settings.haptics && navigator.vibrate) {
      navigator.vibrate(18);
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.__torToastTimer);
    window.__torToastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2000);
  }

  function getSettings() {
    try {
      return Object.assign({}, defaults, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function saveSettings(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function applySettings() {
    const settings = getSettings();

    body.setAttribute("data-theme", settings.theme);
    body.setAttribute("data-width", settings.width);
    body.setAttribute("data-spacing", settings.spacing);
    body.classList.toggle("reader-mode", !!settings.readerMode);
    body.style.setProperty("--reader-font-scale", String(settings.fontScale));

    document.querySelectorAll("[data-setting-theme]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-setting-theme") === settings.theme);
    });

    document.querySelectorAll("[data-setting-width]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-setting-width") === settings.width);
    });

    document.querySelectorAll("[data-setting-spacing]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-setting-spacing") === settings.spacing);
    });

    hapticsBtn.textContent = settings.haptics ? labels.hapticsOn : labels.hapticsOff;
    hapticsBtn.classList.toggle("is-active", settings.haptics);

    autoScrollBtn.textContent = settings.autoScroll ? labels.autoScrollOn : labels.autoScrollOff;
    autoScrollBtn.classList.toggle("is-active", settings.autoScroll);

    if (settings.autoScroll) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
  }

  function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    saveSettings(settings);
    applySettings();
    vibrate();
  }

  function adjustFont(delta) {
    const settings = getSettings();
    settings.fontScale = Math.max(0.9, Math.min(1.35, +(settings.fontScale + delta).toFixed(2)));
    saveSettings(settings);
    applySettings();
    vibrate();
  }

  function resetSettings() {
    saveSettings(Object.assign({}, defaults));
    applySettings();
    vibrate();
  }

  function openAccessModal() {
    accessModal.hidden = false;
    requestAnimationFrame(function () {
      accessModal.classList.add("is-open");
    });
    vibrate();
  }

  function closeAccessModal() {
    accessModal.classList.remove("is-open");
    setTimeout(function () {
      accessModal.hidden = true;
    }, 180);
  }

  function openShareModal() {
    shareModal.hidden = false;
    requestAnimationFrame(function () {
      shareModal.classList.add("is-open");
    });
    setShareMode(currentShareMode);
    vibrate();
  }

  function closeShareModal() {
    shareModal.classList.remove("is-open");
    setTimeout(function () {
      shareModal.hidden = true;
    }, 180);
  }

  function getBaseShareUrl() {
    return article.url;
  }

  function buildShareContent(mode) {
    const baseUrl = getBaseShareUrl();
    const title = article.title;
    const summary = article.summary || "";
    const quote = summary || title;

    if (mode === "headline") {
      return {
        modeName: labels.headlineOnly,
        shareText: title,
        shareUrl: baseUrl + "?utm_source=share&utm_medium=social&utm_campaign=headline_share",
        previewTitleText: title,
        previewSummaryText: summary
      };
    }

    if (mode === "summary") {
      return {
        modeName: labels.shortSummary,
        shareText: title + " — " + quote,
        shareUrl: baseUrl + "?utm_source=share&utm_medium=social&utm_campaign=summary_share",
        previewTitleText: title,
        previewSummaryText: quote
      };
    }

    if (mode === "quote") {
      return {
        modeName: labels.quoteCard,
        shareText: quote,
        shareUrl: baseUrl + "?utm_source=share&utm_medium=social&utm_campaign=quote_share",
        previewTitleText: title,
        previewSummaryText: quote
      };
    }

    return {
      modeName: labels.fullArticle,
      shareText: title + " — " + quote,
      shareUrl: baseUrl + "?utm_source=share&utm_medium=social&utm_campaign=" + article.lang + "_share",
      previewTitleText: title,
      previewSummaryText: quote
    };
  }

  let currentShareMode = "full";

  function setShareMode(mode) {
    currentShareMode = mode;

    [fullArticleBtn, headlineOnlyBtn, shortSummaryBtn, quoteCardBtn].forEach(function (btn) {
      btn.classList.remove("is-active");
    });

    if (mode === "full") fullArticleBtn.classList.add("is-active");
    if (mode === "headline") headlineOnlyBtn.classList.add("is-active");
    if (mode === "summary") shortSummaryBtn.classList.add("is-active");
    if (mode === "quote") quoteCardBtn.classList.add("is-active");

    const content = buildShareContent(mode);
    shareModeText.textContent = content.modeName;
    shareUrlBox.textContent = content.shareUrl;
    previewTitle.textContent = content.previewTitleText;
    previewSummary.textContent = content.previewSummaryText;

    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=" + encodeURIComponent(content.shareUrl);
    qrImage.src = qrUrl;
    qrImage.alt = "QR";

    sharePreviewCard.setAttribute("data-share-mode", mode);
  }

  function openSource() {
    if (!article.sourceUrl) {
      showToast(labels.noSource);
      return;
    }
    vibrate();
    window.open(article.sourceUrl, "_blank", "noopener,noreferrer");
  }

  function stopListening() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speaking = false;
    utterance = null;
    listenBtn.innerHTML = article.icons.speaker + "<span>" + labels.listen + "</span>";
  }

  function startListening() {
    if (!window.speechSynthesis) {
      showToast(labels.shareFail);
      return;
    }

    stopListening();

    const text = [article.title, article.summary, article.plainBody].filter(Boolean).join(". ");
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = article.lang === "bn" ? "bn-BD" : "en-US";
    utterance.rate = 0.95;
    utterance.onend = stopListening;
    utterance.onerror = stopListening;

    speaking = true;
    listenBtn.innerHTML = article.icons.speaker + "<span>" + labels.stopListening + "</span>";
    window.speechSynthesis.speak(utterance);
    vibrate();
  }

  function toggleListen() {
    if (speaking) {
      stopListening();
    } else {
      startListening();
    }
  }

  function startAutoScroll() {
    stopAutoScroll();
    autoScrollTimer = setInterval(function () {
      window.scrollBy({ top: 1, left: 0, behavior: "auto" });
    }, 28);
  }

  function stopAutoScroll() {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
  }

  async function deviceShare() {
    const content = buildShareContent(currentShareMode);
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: content.shareText,
          url: content.shareUrl
        });
        vibrate();
      } else {
        showToast(labels.shareFail);
      }
    } catch (e) {}
  }

  async function copyLink() {
    const content = buildShareContent(currentShareMode);
    try {
      await navigator.clipboard.writeText(content.shareUrl);
      showToast(labels.copied);
      vibrate();
    } catch (e) {
      showToast(labels.actionFailed || "Failed");
    }
  }

  function shareTo(service) {
    const content = buildShareContent(currentShareMode);
    const encodedUrl = encodeURIComponent(content.shareUrl);
    const encodedText = encodeURIComponent(content.shareText);
    let url = "";

    if (service === "whatsapp") url = "https://wa.me/?text=" + encodedText + "%20" + encodedUrl;
    if (service === "facebook") url = "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl;
    if (service === "x") url = "https://twitter.com/intent/tweet?text=" + encodedText + "&url=" + encodedUrl;
    if (service === "telegram") url = "https://t.me/share/url?url=" + encodedUrl + "&text=" + encodedText;
    if (service === "email") url = "mailto:?subject=" + encodeURIComponent(article.title) + "&body=" + encodedText + "%0A%0A" + encodedUrl;

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      vibrate();
    }
  }

  function saveForLater() {
    try {
      const current = JSON.parse(localStorage.getItem(SAVE_KEY) || "[]");
      const next = current.filter(function (item) {
        return item.url !== article.url;
      });
      next.unshift({
        title: article.title,
        url: article.url,
        image: article.image,
        summary: article.summary,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(SAVE_KEY, JSON.stringify(next.slice(0, 50)));
      showToast(labels.savedForLater);
      vibrate();
    } catch (e) {
      showToast(labels.savedForLater);
    }
  }

  function downloadQr() {
    const content = buildShareContent(currentShareMode);
    const link = document.createElement("a");
    link.href = "https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=" + encodeURIComponent(content.shareUrl);
    link.download = "truth-or-rumor-qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    vibrate();
  }

  document.querySelectorAll("[data-setting-theme]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      updateSetting("theme", btn.getAttribute("data-setting-theme"));
    });
  });

  document.querySelectorAll("[data-setting-width]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      updateSetting("width", btn.getAttribute("data-setting-width"));
    });
  });

  document.querySelectorAll("[data-setting-spacing]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      updateSetting("spacing", btn.getAttribute("data-setting-spacing"));
    });
  });

  document.getElementById("fontMinusBtn").addEventListener("click", function () {
    adjustFont(-0.05);
  });

  document.getElementById("fontPlusBtn").addEventListener("click", function () {
    adjustFont(0.05);
  });

  readerToggleBtn.addEventListener("click", function () {
    const settings = getSettings();
    settings.readerMode = !settings.readerMode;
    saveSettings(settings);
    applySettings();
    vibrate();
  });

  hapticsBtn.addEventListener("click", function () {
    const settings = getSettings();
    settings.haptics = !settings.haptics;
    saveSettings(settings);
    applySettings();
    vibrate();
  });

  autoScrollBtn.addEventListener("click", function () {
    const settings = getSettings();
    settings.autoScroll = !settings.autoScroll;
    saveSettings(settings);
    applySettings();
    vibrate();
  });

  resetBtn.addEventListener("click", resetSettings);
  accessibilityFab.addEventListener("click", openAccessModal);
  accessCloseBtn.addEventListener("click", closeAccessModal);

  shareBtn.addEventListener("click", openShareModal);
  shareOpenBtn.addEventListener("click", openShareModal);
  shareCloseBtn.addEventListener("click", closeShareModal);

  sourceBtn.addEventListener("click", openSource);
  listenBtn.addEventListener("click", toggleListen);

  fullArticleBtn.addEventListener("click", function () { setShareMode("full"); });
  headlineOnlyBtn.addEventListener("click", function () { setShareMode("headline"); });
  shortSummaryBtn.addEventListener("click", function () { setShareMode("summary"); });
  quoteCardBtn.addEventListener("click", function () { setShareMode("quote"); });

  deviceShareBtn.addEventListener("click", deviceShare);
  copyLinkBtn.addEventListener("click", copyLink);
  whatsappBtn.addEventListener("click", function () { shareTo("whatsapp"); });
  facebookBtn.addEventListener("click", function () { shareTo("facebook"); });
  xBtn.addEventListener("click", function () { shareTo("x"); });
  telegramBtn.addEventListener("click", function () { shareTo("telegram"); });
  emailBtn.addEventListener("click", function () { shareTo("email"); });
  saveForLaterBtn.addEventListener("click", saveForLater);
  qrDownloadBtn.addEventListener("click", downloadQr);

  document.querySelectorAll("[data-overlay-close]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      if (event.target === el) {
        if (el === accessModal) closeAccessModal();
        if (el === shareModal) closeShareModal();
      }
    });
  });

  window.addEventListener("beforeunload", function () {
    stopListening();
    stopAutoScroll();
  });

  applySettings();
  setShareMode("full");
})();
`.trim();
}

function buildArticleHtml(post, lang) {
  const labels = getLabels(lang);
  const slug = safeSlug(post.slug);
  const status = getStatus(post);
  const title = post.title || "Article";
  const description = getDescription(post);
  const body = getBody(post);
  const plainBody = stripHtml(body);
  const bodyHtml = renderBody(body);
  const image = getImage(post);
  const author = getAuthor(post);
  const category = getCategory(post);
  const sourceUrl = getSourceUrl(post);
  const updated = post.updated_at || post.created_at || new Date().toISOString();
  const created = post.created_at || updated;
  const articleUrl =
    lang === "bn"
      ? `${SITE_URL}/bd/article/${encodeURIComponent(slug)}`
      : `${SITE_URL}/article/${encodeURIComponent(slug)}`;
  const homeUrl = lang === "bn" ? `${SITE_URL}/bd` : `${SITE_URL}/`;
  const summary = trimText(description, 220);
  const shareSummary = trimText(plainBody || description, 180);

  const articleData = {
    title,
    summary: shareSummary,
    image,
    category,
    sourceUrl,
    url: articleUrl,
    lang,
    verdictStatus: status,
    plainBody: trimText(plainBody, 2500),
    icons: {
      speaker: speakerIconSvg(),
      share: shareIconSvg(),
      source: sourceIconSvg(),
      accessibility: accessibilityIconSvg()
    }
  };

  const verdictLabel = verificationLabel(status, labels);
  const verdictClass = status === "truth" ? "is-truth" : "is-rumor";
  const topicIcon = getTopicIcon(category);

  return `<!doctype html>
<html lang="${lang === "bn" ? "bn" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | TruthOrRumor</title>
  <meta name="description" content="${escapeHtml(summary)}">
  <link rel="canonical" href="${escapeHtml(articleUrl)}">

  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(summary)}">
  <meta property="og:url" content="${escapeHtml(articleUrl)}">
  <meta property="og:image" content="${escapeHtml(image)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(summary)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">

  <script type="application/ld+json">${safeJson({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    image: [image],
    datePublished: created,
    dateModified: updated,
    author: { "@type": "Person", name: author },
    publisher: {
      "@type": "Organization",
      name: "TruthOrRumor",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` }
    },
    articleSection: category,
    mainEntityOfPage: articleUrl,
    description: summary
  })}</script>

  <style>
    :root{
      --bg:#021028;
      --bg-2:#041735;
      --surface:rgba(20,32,69,.72);
      --surface-2:rgba(23,38,79,.72);
      --border:rgba(255,255,255,.11);
      --text:#f5f7fb;
      --muted:rgba(244,247,255,.72);
      --gold:#f5b23d;
      --gold-2:#d79e35;
      --green:#22c55e;
      --red:#ff453a;
      --shadow:0 14px 44px rgba(0,0,0,.35);
      --radius:28px;
      --reader-max:820px;
      --reader-font-scale:1;
      --reader-line-height:1.76;
      --page-gradient:
        radial-gradient(circle at 12% 20%, rgba(244, 63, 94, .12), transparent 25%),
        radial-gradient(circle at 18% 75%, rgba(34, 197, 94, .16), transparent 20%),
        radial-gradient(circle at 80% 78%, rgba(245, 158, 11, .18), transparent 24%),
        radial-gradient(circle at 78% 32%, rgba(59, 130, 246, .16), transparent 23%),
        linear-gradient(180deg,#011129 0%,#02173a 100%);
    }

    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{
      margin:0;
      color:var(--text);
      font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
      background:var(--page-gradient);
      min-height:100vh;
      font-size:calc(18px * var(--reader-font-scale));
      line-height:var(--reader-line-height);
      transition:background .25s ease,color .25s ease;
    }

    body[data-theme="sepia"]{
      --text:#2b2316;
      --muted:rgba(43,35,22,.72);
      --surface:rgba(248,236,210,.84);
      --surface-2:rgba(245,225,192,.78);
      --border:rgba(86,62,25,.12);
      --gold:#b2781f;
      --gold-2:#9a6514;
      --page-gradient:
        radial-gradient(circle at 14% 18%, rgba(194,138,44,.10), transparent 22%),
        radial-gradient(circle at 79% 76%, rgba(154,101,20,.10), transparent 25%),
        linear-gradient(180deg,#f7edd8 0%,#ecd8b4 100%);
      --bg:#f7edd8;
      --bg-2:#ecd8b4;
      --shadow:0 14px 44px rgba(94,65,18,.18);
    }

    body[data-theme="soft-light"]{
      --text:#14243b;
      --muted:rgba(20,36,59,.65);
      --surface:rgba(255,255,255,.76);
      --surface-2:rgba(245,248,255,.84);
      --border:rgba(20,36,59,.1);
      --gold:#2d72ff;
      --gold-2:#225bd0;
      --page-gradient:
        radial-gradient(circle at 14% 18%, rgba(45,114,255,.12), transparent 22%),
        radial-gradient(circle at 82% 78%, rgba(34,197,94,.10), transparent 22%),
        linear-gradient(180deg,#edf5ff 0%,#dbe8ff 100%);
      --bg:#edf5ff;
      --bg-2:#dbe8ff;
      --shadow:0 14px 44px rgba(52,83,137,.16);
    }

    body.reader-mode{
      --page-gradient:
        linear-gradient(180deg, rgba(1,10,28,.96) 0%, rgba(1,10,28,.98) 100%);
    }

    body[data-width="narrow"]{ --reader-max:680px; }
    body[data-width="normal"]{ --reader-max:820px; }
    body[data-width="wide"]{ --reader-max:1020px; }

    body[data-spacing="tight"]{ --reader-line-height:1.72; }
    body[data-spacing="relaxed"]{ --reader-line-height:2; }

    a{color:inherit}
    button{font:inherit}

    .page-shell{
      width:min(100%, calc(var(--reader-max) + 56px));
      margin:0 auto;
      padding:24px 16px 120px;
    }

    .glass{
      backdrop-filter:blur(18px);
      -webkit-backdrop-filter:blur(18px);
      background:var(--surface);
      border:1px solid var(--border);
      box-shadow:var(--shadow);
    }

    .top-bar{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
      padding:14px;
      border-radius:34px;
      margin-bottom:18px;
      position:sticky;
      top:12px;
      z-index:20;
    }

    .home-btn{
      display:inline-flex;
      align-items:center;
      gap:10px;
      padding:14px 22px;
      border-radius:24px;
      border:1px solid var(--border);
      background:rgba(255,255,255,.04);
      text-decoration:none;
      font-weight:800;
      white-space:nowrap;
    }

    .site-name{
      font-size:clamp(22px,4vw,30px);
      font-weight:900;
      letter-spacing:-.03em;
      text-align:right;
    }

    .article-card{
      border-radius:34px;
      padding:18px;
    }

    .hero-media{
      position:relative;
      overflow:hidden;
      border-radius:28px;
      border:1px solid var(--border);
      background:rgba(255,255,255,.04);
      min-height:250px;
      margin-bottom:18px;
    }

    .hero-media img{
      display:block;
      width:100%;
      height:auto;
      min-height:250px;
      max-height:540px;
      object-fit:cover;
    }

    .hero-overlay{
      position:absolute;
      inset:0;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      padding:16px;
      pointer-events:none;
      background:linear-gradient(180deg, rgba(3,10,25,.18) 0%, rgba(1,10,28,.1) 30%, rgba(1,10,28,.38) 100%);
    }

    .hero-badges{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
      flex-wrap:wrap;
    }

    .verification-chip,
    .hero-topic-badge{
      display:inline-flex;
      align-items:center;
      gap:10px;
      border-radius:999px;
      padding:10px 16px;
      border:1px solid rgba(255,255,255,.12);
      color:#ffffff;
      font-weight:800;
      line-height:1;
      box-shadow:0 10px 24px rgba(0,0,0,.22);
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
    }

    .verification-chip.is-truth{ background:rgba(34,197,94,.88); }
    .verification-chip.is-rumor{ background:rgba(255,69,58,.9); }

    .verification-chip svg{
      width:20px;
      height:20px;
      display:block;
      flex:0 0 auto;
    }

    .hero-topic-badge{
      background:rgba(20,32,69,.82);
    }

    .hero-topic-icon{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:24px;
      height:24px;
      border-radius:50%;
      background:rgba(255,255,255,.1);
      font-size:14px;
    }

    .meta-row{
      display:flex;
      flex-wrap:wrap;
      gap:12px 18px;
      color:var(--muted);
      font-size:.9em;
      margin-bottom:14px;
    }

    h1{
      margin:0 0 14px;
      font-size:clamp(34px,7vw,58px);
      line-height:1.07;
      letter-spacing:-.04em;
    }

    .summary{
      margin:0 0 20px;
      color:var(--muted);
      font-size:1.05em;
    }

    .article-body{
      margin-top:10px;
    }

    .article-body p{
      margin:0 0 1.12em;
    }

    .article-body img{
      max-width:100%;
      border-radius:20px;
      margin:1.1em auto;
      display:block;
    }

    .article-actions{
      display:flex;
      flex-wrap:wrap;
      gap:12px;
      margin-top:26px;
    }

    .pill-btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:12px;
      min-width:180px;
      padding:18px 24px;
      border-radius:999px;
      border:1px solid var(--border);
      color:var(--text);
      text-decoration:none;
      background:rgba(255,255,255,.04);
      box-shadow:0 10px 26px rgba(0,0,0,.18);
      font-weight:800;
      cursor:pointer;
      transition:transform .18s ease, background .18s ease, border-color .18s ease;
    }

    .pill-btn:hover,
    .pill-btn:active{
      transform:translateY(-1px);
      background:rgba(255,255,255,.07);
    }

    .pill-btn--primary{
      background:linear-gradient(180deg, rgba(245,178,61,.34) 0%, rgba(215,158,53,.22) 100%);
      border-color:rgba(245,178,61,.44);
    }

    .pill-btn svg{
      width:28px;
      height:28px;
      display:block;
      color:currentColor;
      flex:0 0 auto;
    }

    .bottom-read-more{
      margin-top:28px;
      font-size:clamp(28px,5vw,40px);
      font-weight:900;
      color:#4cc9ff;
      letter-spacing:-.03em;
    }

    .fab{
      position:fixed;
      right:16px;
      bottom:16px;
      z-index:30;
      width:82px;
      height:82px;
      border-radius:28px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(89,102,140,.74);
      backdrop-filter:blur(18px);
      -webkit-backdrop-filter:blur(18px);
      box-shadow:0 16px 36px rgba(0,0,0,.35);
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      transition:transform .2s ease, background .2s ease;
    }

    .fab:hover,
    .fab:active{
      transform:translateY(-1px) scale(1.01);
    }

    .fab svg{
      width:52px;
      height:52px;
      display:block;
    }

    .modal-backdrop{
      position:fixed;
      inset:0;
      z-index:40;
      background:rgba(1,8,24,.58);
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      opacity:0;
      pointer-events:none;
      transition:opacity .18s ease;
      overflow:auto;
      padding:16px;
    }

    .modal-backdrop.is-open{
      opacity:1;
      pointer-events:auto;
    }

    .panel{
      width:min(100%, 720px);
      margin:40px auto;
      border-radius:34px;
      padding:18px;
      transform:translateY(16px);
      transition:transform .18s ease;
    }

    .modal-backdrop.is-open .panel{
      transform:translateY(0);
    }

    .panel-header{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
      margin-bottom:12px;
    }

    .panel-close{
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding:13px 18px;
      border-radius:999px;
      border:1px solid var(--border);
      background:rgba(255,255,255,.05);
      color:var(--text);
      cursor:pointer;
      font-weight:800;
    }

    .panel h2{
      margin:0;
      font-size:clamp(28px,4.8vw,46px);
      line-height:1.05;
      letter-spacing:-.03em;
    }

    .panel-note{
      margin:8px 0 0;
      color:var(--muted);
      max-width:32ch;
    }

    .section-label{
      margin:22px 0 10px;
      font-size:.82em;
      letter-spacing:.18em;
      color:var(--muted);
      font-weight:800;
    }

    .option-row{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
    }

    .chip-btn{
      border:1px solid var(--border);
      background:rgba(255,255,255,.05);
      color:var(--text);
      border-radius:22px;
      padding:14px 22px;
      font-weight:800;
      cursor:pointer;
      min-width:120px;
      text-align:center;
    }

    .chip-btn.is-active{
      background:linear-gradient(180deg, rgba(245,178,61,.96) 0%, rgba(245,178,61,.86) 100%);
      color:#091329;
      border-color:rgba(245,178,61,.96);
    }

    .chip-btn--wide{
      min-width:210px;
    }

    .share-preview-card{
      margin-top:10px;
      border-radius:28px;
      overflow:hidden;
      border:1px solid var(--border);
      background:linear-gradient(180deg, rgba(20,32,69,.76) 0%, rgba(18,30,62,.76) 100%);
    }

    .share-preview-media{
      position:relative;
      min-height:240px;
      background:#0c1d42;
    }

    .share-preview-media img{
      display:block;
      width:100%;
      height:100%;
      min-height:240px;
      max-height:380px;
      object-fit:cover;
    }

    .share-preview-overlay{
      position:absolute;
      inset:0;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      padding:18px;
      background:linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.40));
    }

    .share-preview-top{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:12px;
      flex-wrap:wrap;
    }

    .share-badge,
    .share-topic{
      display:inline-flex;
      align-items:center;
      gap:10px;
      border-radius:999px;
      padding:10px 16px;
      font-weight:800;
      border:1px solid rgba(255,255,255,.12);
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
    }

    .share-badge.is-truth{ background:rgba(34,197,94,.92); color:#fff; }
    .share-badge.is-rumor{ background:rgba(255,69,58,.92); color:#fff; }
    .share-badge svg{
      width:18px;
      height:18px;
      display:block;
    }

    .share-topic{
      background:rgba(20,32,69,.9);
      color:#fff;
    }

    .share-topic-icon{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:22px;
      height:22px;
      border-radius:50%;
      background:rgba(255,255,255,.1);
      font-size:13px;
    }

    .share-preview-content{
      padding:18px;
    }

    .share-preview-label{
      color:var(--gold);
      font-size:.8em;
      font-weight:800;
      letter-spacing:.14em;
      text-transform:uppercase;
      margin-bottom:10px;
    }

    .share-preview-title{
      font-size:clamp(28px,5vw,54px);
      line-height:1.06;
      letter-spacing:-.04em;
      margin:0 0 14px;
      font-weight:900;
    }

    .share-preview-summary{
      margin:0;
      color:rgba(255,255,255,.84);
      font-size:1em;
    }

    .share-grid{
      display:grid;
      grid-template-columns:repeat(2, minmax(0, 1fr));
      gap:12px;
      margin-top:16px;
    }

    .share-card-btn{
      width:100%;
      text-align:left;
      display:flex;
      align-items:center;
      gap:14px;
      border-radius:24px;
      border:1px solid var(--border);
      background:rgba(255,255,255,.05);
      color:var(--text);
      padding:18px;
      cursor:pointer;
      min-height:88px;
      font-weight:800;
    }

    .share-card-icon{
      width:56px;
      height:56px;
      border-radius:18px;
      border:1px solid rgba(245,178,61,.22);
      display:flex;
      align-items:center;
      justify-content:center;
      color:var(--gold);
      background:rgba(255,255,255,.03);
      flex:0 0 auto;
      font-size:28px;
      font-weight:900;
    }

    .share-meta{
      margin-top:16px;
      padding:20px;
      border-radius:24px;
      background:rgba(255,255,255,.04);
      border:1px solid var(--border);
    }

    .share-meta strong{
      display:block;
      margin-bottom:8px;
      color:var(--text);
    }

    .share-url-box{
      word-break:break-word;
      color:var(--muted);
      font-size:.95em;
      line-height:1.6;
    }

    .qr-card{
      margin-top:16px;
      padding:22px;
      border-radius:24px;
      background:rgba(255,255,255,.04);
      border:1px solid var(--border);
      text-align:center;
    }

    .qr-card img{
      width:min(100%, 320px);
      height:auto;
      display:block;
      margin:16px auto 12px;
      border-radius:18px;
      background:#fff;
      padding:12px;
    }

    .toast{
      position:fixed;
      left:50%;
      bottom:110px;
      transform:translateX(-50%) translateY(12px);
      z-index:60;
      padding:13px 18px;
      border-radius:999px;
      background:rgba(20,32,69,.94);
      color:#fff;
      border:1px solid rgba(255,255,255,.12);
      box-shadow:0 14px 34px rgba(0,0,0,.35);
      opacity:0;
      pointer-events:none;
      transition:all .2s ease;
      font-weight:800;
      white-space:nowrap;
    }

    .toast.show{
      opacity:1;
      transform:translateX(-50%) translateY(0);
    }

    @media (max-width: 720px){
      .top-bar{
        border-radius:28px;
      }

      .site-name{
        font-size:18px;
      }

      .home-btn{
        padding:12px 16px;
        font-size:14px;
      }

      .share-grid{
        grid-template-columns:1fr;
      }

      .pill-btn{
        min-width:unset;
        width:100%;
      }

      .panel{
        margin:20px auto;
      }

      .fab{
        width:76px;
        height:76px;
        border-radius:24px;
      }
    }
  </style>
</head>
<body data-theme="dark" data-width="normal" data-spacing="tight">
  <div class="page-shell">
    <div class="top-bar glass">
      <a class="home-btn" href="${escapeHtml(homeUrl)}">${escapeHtml(labels.backHome)}</a>
      <div class="site-name">${escapeHtml(labels.siteName)}</div>
    </div>

    <article class="article-card glass">
      <div class="hero-media">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">
        <div class="hero-overlay">
          <div class="hero-badges">
            <span class="verification-chip ${verdictClass}">
              <span aria-hidden="true">${status === "truth" ? "✓" : "✕"}</span>
              <span>${escapeHtml(verdictLabel)}</span>
            </span>
            ${topicBadgeHtml(category)}
          </div>
        </div>
      </div>

      <div class="meta-row">
        <span><strong>${escapeHtml(labels.updated)}:</strong> ${escapeHtml(formatDisplayDate(updated, lang))}</span>
        <span><strong>${escapeHtml(labels.topic)}:</strong> ${escapeHtml(category)}</span>
        <span>${escapeHtml(author)}</span>
      </div>

      <h1>${escapeHtml(title)}</h1>
      <p class="summary">${escapeHtml(summary)}</p>

      <div id="articleBody" class="article-body">${bodyHtml}</div>

      <div class="article-actions">
        <button id="listenBtn" class="pill-btn" type="button">
          ${speakerIconSvg()}
          <span>${escapeHtml(labels.listen)}</span>
        </button>

        <button id="shareBtn" class="pill-btn pill-btn--primary" type="button">
          ${shareIconSvg()}
          <span>${escapeHtml(labels.share)}</span>
        </button>

        <button id="sourceBtn" class="pill-btn" type="button">
          ${sourceIconSvg()}
          <span>${escapeHtml(labels.source)}</span>
        </button>
      </div>

      <div class="bottom-read-more">${escapeHtml(labels.readMore)}</div>
    </article>
  </div>

  <button id="accessibilityFab" class="fab" type="button" aria-label="${escapeHtml(labels.accessibility)}">
    ${accessibilityIconSvg()}
  </button>

  <div id="accessibilityModal" class="modal-backdrop" data-overlay-close hidden>
    <div class="panel glass">
      <div class="panel-header">
        <button id="accessCloseBtn" class="panel-close" type="button">‹ ${escapeHtml(labels.close)}</button>
        <div>
          <h2>${escapeHtml(labels.accessibility)}</h2>
          <p class="panel-note">${escapeHtml(labels.readNote)}</p>
        </div>
      </div>

      <div class="section-label">${escapeHtml(labels.theme)}</div>
      <div class="option-row">
        <button class="chip-btn is-active" data-setting-theme="dark" type="button">${escapeHtml(labels.dark)}</button>
        <button class="chip-btn" data-setting-theme="sepia" type="button">${escapeHtml(labels.sepia)}</button>
        <button class="chip-btn chip-btn--wide" data-setting-theme="soft-light" type="button">${escapeHtml(labels.softLight)}</button>
      </div>

      <div class="section-label">${escapeHtml(labels.readerWidth)}</div>
      <div class="option-row">
        <button class="chip-btn" data-setting-width="narrow" type="button">${escapeHtml(labels.narrow)}</button>
        <button class="chip-btn is-active" data-setting-width="normal" type="button">${escapeHtml(labels.normal)}</button>
        <button class="chip-btn" data-setting-width="wide" type="button">${escapeHtml(labels.wide)}</button>
      </div>

      <div class="section-label">${escapeHtml(labels.fontSize)}</div>
      <div class="option-row">
        <button id="fontMinusBtn" class="chip-btn" type="button">A-</button>
        <button id="fontPlusBtn" class="chip-btn" type="button">A+</button>
      </div>

      <div class="section-label">${escapeHtml(labels.lineSpacing)}</div>
      <div class="option-row">
        <button class="chip-btn is-active" data-setting-spacing="tight" type="button">${escapeHtml(labels.tight)}</button>
        <button class="chip-btn" data-setting-spacing="relaxed" type="button">${escapeHtml(labels.relaxed)}</button>
      </div>

      <div class="section-label">${escapeHtml(labels.readerMode)}</div>
      <div class="option-row">
        <button id="readerToggleBtn" class="chip-btn chip-btn--wide" type="button">${escapeHtml(labels.toggleReaderMode)}</button>
        <button id="resetPrefsBtn" class="chip-btn" type="button">${escapeHtml(labels.reset)}</button>
      </div>

      <div class="section-label">${escapeHtml(labels.hapticsAndAutoScroll)}</div>
      <div class="option-row">
        <button id="hapticsBtn" class="chip-btn chip-btn--wide is-active" type="button">${escapeHtml(labels.hapticsOn)}</button>
        <button id="autoScrollBtn" class="chip-btn chip-btn--wide" type="button">${escapeHtml(labels.autoScrollOff)}</button>
      </div>
    </div>
  </div>

  <div id="shareModal" class="modal-backdrop" data-overlay-close hidden>
    <div class="panel glass">
      <div class="panel-header">
        <div>
          <h2>${escapeHtml(labels.shareStory)}</h2>
          <p class="panel-note">${escapeHtml(labels.sharedTimes)}</p>
        </div>
        <button id="shareCloseBtn" class="panel-close" type="button">✕</button>
      </div>

      <div id="sharePreviewCard" class="share-preview-card">
        <div class="share-preview-media">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">
          <div class="share-preview-overlay">
            <div class="share-preview-top">
              <span id="sharePreviewBadge" class="share-badge ${verdictClass}">
                ${verificationBadgeSvg(status)}
                <span>${escapeHtml(verdictLabel)}</span>
              </span>

              <span id="sharePreviewTopic" class="share-topic">
                <span id="sharePreviewTopicIcon" class="share-topic-icon">${escapeHtml(topicIcon)}</span>
                <span>${escapeHtml(category)}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="share-preview-content">
          <div class="share-preview-label">TRUTH VERIFICATION</div>
          <h3 id="sharePreviewTitle" class="share-preview-title">${escapeHtml(title)}</h3>
          <p id="sharePreviewSummary" class="share-preview-summary">${escapeHtml(summary)}</p>
        </div>
      </div>

      <div class="section-label">${escapeHtml(labels.shareAs)}</div>
      <div class="option-row">
        <button id="modeFullArticle" class="chip-btn is-active chip-btn--wide" type="button">${escapeHtml(labels.fullArticle)}</button>
        <button id="modeHeadlineOnly" class="chip-btn chip-btn--wide" type="button">${escapeHtml(labels.headlineOnly)}</button>
        <button id="modeShortSummary" class="chip-btn chip-btn--wide" type="button">${escapeHtml(labels.shortSummary)}</button>
        <button id="modeQuoteCard" class="chip-btn chip-btn--wide" type="button">${escapeHtml(labels.quoteCard)}</button>
      </div>

      <div class="section-label">${escapeHtml(labels.quickShare)}</div>
      <div class="share-grid">
        <button id="deviceShareBtn" class="share-card-btn" type="button">
          <span class="share-card-icon">📱</span>
          <span>${escapeHtml(labels.deviceShare)}</span>
        </button>

        <button id="copyLinkBtn" class="share-card-btn" type="button">
          <span class="share-card-icon">🔗</span>
          <span>${escapeHtml(labels.copyLink)}</span>
        </button>

        <button id="whatsappBtn" class="share-card-btn" type="button">
          <span class="share-card-icon">◔</span>
          <span>${escapeHtml(labels.whatsapp)}</span>
        </button>

        <button id="facebookBtn" class="share-card-btn" type="button">
          <span class="share-card-icon">f</span>
          <span>${escapeHtml(labels.facebook)}</span>
        </button>

        <button id="xBtn" class="share-card-btn" type="button">
          <span class="share-card-icon">X</span>
          <span>${escapeHtml(labels.x)}</span>
        </button>

        <button id="telegramBtn" class="share-card-btn" type="button">
          <span class="share-card-icon">✈</span>
          <span>${escapeHtml(labels.telegram)}</span>
        </button>

        <button id="emailBtn" class="share-card-btn" type="button">
          <span class="share-card-icon">✉</span>
          <span>${escapeHtml(labels.email)}</span>
        </button>

        <button id="saveForLaterBtn" class="share-card-btn" type="button">
          <span class="share-card-icon">🔖</span>
          <span>${escapeHtml(labels.saveForLater)}</span>
        </button>

        <button id="qrDownloadBtn" class="share-card-btn" type="button">
          <span class="share-card-icon">⌘</span>
          <span>${escapeHtml(labels.downloadQr)}</span>
        </button>
      </div>

      <div class="share-meta">
        <strong>${escapeHtml(labels.shareMode)}: <span id="shareModeText">${escapeHtml(labels.fullArticle)}</span></strong>
        <strong>${escapeHtml(labels.shareUrl)}:</strong>
        <div id="shareUrlBox" class="share-url-box"></div>
      </div>

      <div class="qr-card">
        <strong>${escapeHtml(labels.qrCode)}</strong>
        <img id="qrImage" src="" alt="QR">
        <p class="panel-note" style="max-width:none;margin-top:10px;">${escapeHtml(labels.qrNote)}</p>
      </div>
    </div>
  </div>

  <div id="toast" class="toast" aria-live="polite"></div>

  <script>${buildClientScript(articleData, labels)}</script>
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
