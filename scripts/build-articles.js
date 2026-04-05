const fs = require('fs');
const path = require('path');

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = String(process.env.SUPABASE_ANON_KEY || '');
const SITE_URL = String(process.env.SITE_URL || 'https://www.truthorrumor.com').replace(/\/$/, '');

function safeSlug(value) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderBody(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return raw
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function trimText(value, limit) {
  const text = stripHtml(value);
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function getLabels(lang) {
  if (lang === 'bn') {
    return {
      langCode: 'bn-BD',
      siteName: 'TruthOrRumor',
      backHome: '← Back to Home',
      share: 'Share',
      source: 'Source',
      listen: 'শুনুন',
      stopListening: 'শোনা বন্ধ করুন',
      accessibility: 'Accessibility',
      close: 'Close',
      theme: 'Theme',
      readerWidth: 'Reader Width',
      fontSize: 'Font Size',
      lineSpacing: 'Line Spacing',
      readerMode: 'Reader Mode',
      hapticsAuto: 'Haptic Feedback & Auto Scroll',
      dark: 'Dark',
      sepia: 'Sepia',
      softLight: 'Soft Light',
      narrow: 'Narrow',
      normal: 'Normal',
      wide: 'Wide',
      aMinus: 'A-',
      aPlus: 'A+',
      tight: 'Tight',
      relaxed: 'Relaxed',
      toggleReaderMode: 'Toggle Reader Mode',
      reset: 'Reset',
      hapticsOn: 'Haptics On',
      hapticsOff: 'Haptics Off',
      autoScrollOn: 'Auto Scroll On',
      autoScrollOff: 'Auto Scroll Off',
      accessibilityNote: 'উন্নত রিডিং কন্ট্রোল ব্যবহার করে আরও স্বচ্ছল, ব্যক্তিগত ও আরামদায়ক পড়ার অভিজ্ঞতা উপভোগ করুন।',
      shareStory: 'Share Story',
      sharedTimes: 'Shared 0 times',
      shareAs: 'Share As',
      fullArticle: 'Full Article',
      headlineOnly: 'Headline Only',
      shortSummary: 'Short Summary',
      quoteCard: 'Quote Card',
      quickShare: 'Quick Share',
      deviceShare: 'Device Share',
      copyLink: 'Copy Link',
      whatsapp: 'WhatsApp',
      facebook: 'Facebook',
      x: 'X',
      telegram: 'Telegram',
      email: 'Email',
      saveForLater: 'Save For Later',
      saved: 'Saved',
      downloadQr: 'Download QR',
      shareMode: 'Share mode',
      shareUrl: 'Share URL',
      qrCode: 'QR Code',
      qrNote: 'QR code generates automatically when this share popup opens.',
      copied: 'লিংক কপি হয়েছে',
      copyFailed: 'লিংক কপি করা যায়নি',
      savedForLater: 'পরে পড়ার জন্য সেভ হয়েছে',
      removedSaved: 'সেভ তালিকা থেকে সরানো হয়েছে',
      sourceUnavailable: 'Source not available',
      shareUnavailable: 'Sharing is not available',
      qrGenerating: 'QR code তৈরি হচ্ছে',
      autoScrollFinished: 'Auto scroll finished',
      themeUpdated: 'Theme updated',
      widthUpdated: 'Reader width updated',
      fontIncreased: 'Font size increased',
      fontDecreased: 'Font size decreased',
      spacingRelaxed: 'Line spacing relaxed',
      spacingTight: 'Line spacing tightened',
      readerModeEnabled: 'Reader mode enabled',
      readerModeDisabled: 'Reader mode disabled',
      settingsReset: 'Reading settings reset',
      hapticsEnabled: 'Haptics enabled',
      hapticsDisabled: 'Haptics disabled',
      autoScrollEnabled: 'Auto scroll enabled',
      autoScrollDisabled: 'Auto scroll disabled',
      aiSummaryLabel: 'AI Shirt Summary',
      verifiedNews: 'Verified News',
      rumorDetected: 'Rumor Detected',
      update: 'Update',
      topic: 'Topic'
    };
  }

  return {
    langCode: 'en-US',
    siteName: 'TruthOrRumor',
    backHome: '← Back to Home',
    share: 'Share',
    source: 'Source',
    listen: 'Tap To Listen',
    stopListening: 'Stop Listening',
    accessibility: 'Accessibility',
    close: 'Close',
    theme: 'Theme',
    readerWidth: 'Reader Width',
    fontSize: 'Font Size',
    lineSpacing: 'Line Spacing',
    readerMode: 'Reader Mode',
    hapticsAuto: 'Haptic Feedback & Auto Scroll',
    dark: 'Dark',
    sepia: 'Sepia',
    softLight: 'Soft Light',
    narrow: 'Narrow',
    normal: 'Normal',
    wide: 'Wide',
    aMinus: 'A-',
    aPlus: 'A+',
    tight: 'Tight',
    relaxed: 'Relaxed',
    toggleReaderMode: 'Toggle Reader Mode',
    reset: 'Reset',
    hapticsOn: 'Haptics On',
    hapticsOff: 'Haptics Off',
    autoScrollOn: 'Auto Scroll On',
    autoScrollOff: 'Auto Scroll Off',
    accessibilityNote: 'Use advanced reading controls for a smoother, more personal and comfortable reading experience.',
    shareStory: 'Share Story',
    sharedTimes: 'Shared 0 times',
    shareAs: 'Share As',
    fullArticle: 'Full Article',
    headlineOnly: 'Headline Only',
    shortSummary: 'Short Summary',
    quoteCard: 'Quote Card',
    quickShare: 'Quick Share',
    deviceShare: 'Device Share',
    copyLink: 'Copy Link',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    x: 'X',
    telegram: 'Telegram',
    email: 'Email',
    saveForLater: 'Save For Later',
    saved: 'Saved',
    downloadQr: 'Download QR',
    shareMode: 'Share mode',
    shareUrl: 'Share URL',
    qrCode: 'QR Code',
    qrNote: 'QR code generates automatically when this share popup opens.',
    copied: 'Link copied',
    copyFailed: 'Could not copy link',
    savedForLater: 'Saved for later',
    removedSaved: 'Removed from saved list',
    sourceUnavailable: 'Source not available',
    shareUnavailable: 'Sharing is not available',
    qrGenerating: 'QR code is generating',
    autoScrollFinished: 'Auto scroll finished',
    themeUpdated: 'Theme updated',
    widthUpdated: 'Reader width updated',
    fontIncreased: 'Font size increased',
    fontDecreased: 'Font size decreased',
    spacingRelaxed: 'Line spacing relaxed',
    spacingTight: 'Line spacing tightened',
    readerModeEnabled: 'Reader mode enabled',
    readerModeDisabled: 'Reader mode disabled',
    settingsReset: 'Reading settings reset',
    hapticsEnabled: 'Haptics enabled',
    hapticsDisabled: 'Haptics disabled',
    autoScrollEnabled: 'Auto scroll enabled',
    autoScrollDisabled: 'Auto scroll disabled',
    aiSummaryLabel: 'AI Shirt Summary',
    verifiedNews: 'Verified News',
    rumorDetected: 'Rumor Detected',
    update: 'Update',
    topic: 'Topic'
  };
}

function getImage(post) {
  const value = post.image_url || post.image || post.thumbnail || post.cover_image || '/logo.png';
  if (/^https?:\/\//i.test(String(value))) return String(value);
  return `${SITE_URL}${String(value).startsWith('/') ? '' : '/'}${value}`;
}

function getCategory(post) {
  return String(post.category || 'News').trim();
}

function getSourceUrl(post) {
  return String(post.source_url || post.source || post.reference_url || '').trim();
}

function getStatus(post) {
  const raw = String(post.verdict || post.status || post.type || 'truth').toLowerCase();
  return raw.includes('rumor') || raw.includes('গুজব') ? 'rumor' : 'truth';
}

function getDescription(post) {
  return String(post.excerpt || post.summary || post.description || post.long_description || post.title || '').trim();
}

function getBody(post) {
  return String(post.content || post.body || post.article_body || post.article_html || post.long_description || post.description || post.summary || '').trim();
}

function getAuthor(post) {
  return String(post.author || post.author_name || post.writer || 'TruthOrRumor').trim();
}

function formatDisplayDate(value, lang) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function getTopicIcon(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('energy') || c.includes('power') || c.includes('fuel')) return 'topic-energy';
  if (c.includes('politic') || c.includes('government') || c.includes('national') || c.includes('election')) return 'topic-politics';
  if (c.includes('world') || c.includes('international') || c.includes('global')) return 'topic-world';
  if (c.includes('business') || c.includes('econom') || c.includes('trade') || c.includes('market')) return 'topic-business';
  if (c.includes('health')) return 'topic-health';
  if (c.includes('science') || c.includes('tech')) return 'topic-science';
  if (c.includes('sport')) return 'topic-sports';
  if (c.includes('crime') || c.includes('law')) return 'topic-law';
  return 'topic-news';
}

function renderIcon(name, className = '') {
  const cls = className ? ` class="${className}"` : '';
  const icons = {
    'verdict-check': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 12.5 10.2 15.7 17.5 8.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'verdict-x': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7 17 17M17 7 7 17" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'listen': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 10h4l5-4v12l-5-4H5z" fill="currentColor"/><path d="M17 8c1.5 1 2.5 2.4 2.5 4S18.5 15 17 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 5c2.7 1.7 4 4.1 4 7s-1.3 5.3-4 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    'share': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="18" cy="5" r="2.5" fill="currentColor"/><circle cx="6" cy="12" r="2.5" fill="currentColor"/><circle cx="18" cy="19" r="2.5" fill="currentColor"/><path d="M8.2 11l7-4.2M8.2 13l7 4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    'source': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 5h5v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 14 19 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'device': `<svg${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.2"></rect><path d="M10 18h4"></path></svg>`,
    'link': `<svg${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1L11.2 4"></path><path d="M14 11a5 5 0 0 0-7.1 0L4.1 13.8a5 5 0 0 0 7.1 7.1l1.7-1.7"></path></svg>`,
    'whatsapp': `<svg${cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.2-.6-1.4-.7s-.4-.1-.6.1-.7.7-.8.8-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.5.2-.4a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9-.2-.4-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3.1 3.1 0 0 0-1 2.3c0 1.4 1 2.7 1.2 2.9.1.2 2 3.1 5 4.2.7.3 1.3.4 1.7.5.8.1 1.4.1 2-.1.6-.2 1.9-.8 2.1-1.6.3-.8.3-1.4.2-1.6 0-.1-.2-.2-.4-.3Z"></path></svg>`,
    'facebook': `<svg${cls} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z"></path></svg>`,
    'x': `<svg${cls} viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-6.3L6.6 22H3.5l7.2-8.3L1 2h6.2l4.3 5.7L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z"></path></svg>`,
    'telegram': `<svg${cls} viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 4.6c.3-1.2-.4-1.7-1.5-1.3L3.4 9.7c-1.1.4-1.1 1 .2 1.4l4.3 1.3 10-6.3c.5-.3 1-.1.6.2l-8.1 7.3-.3 4.5c.5 0 .7-.2 1-.5l2.1-2 4.4 3.2c.8.4 1.4.2 1.6-.8l2.3-13.4Z"></path></svg>`,
    'email': `<svg${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>`,
    'bookmark': `<svg${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-3.4L6 21V3Z"></path></svg>`,
    'qr': `<svg${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5h5V3Z"></path><path d="M21 3h-5v5h5V3Z"></path><path d="M8 16H3v5h5v-5Z"></path><path d="M21 14v7h-7"></path><path d="M14 14h2v2h-2z"></path><path d="M18 14h3"></path><path d="M14 18h2"></path><path d="M18 18h1"></path></svg>`,
    'accessibility': `<svg${cls} viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="12" r="5" fill="currentColor"></circle><rect x="13" y="23" width="38" height="6" rx="3" fill="currentColor"></rect><rect x="29" y="28" width="6" height="20" rx="3" fill="currentColor"></rect><path d="M32 48L22 61" stroke="currentColor" stroke-width="6" stroke-linecap="round"></path><path d="M32 48L42 61" stroke="currentColor" stroke-width="6" stroke-linecap="round"></path></svg>`,
    'topic-energy': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z" fill="currentColor"></path></svg>`,
    'topic-politics': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 9h18M5 9l2 10m10-10 2 10M9 9v10m6-10v10M2 22h20M12 3l9 4H3l9-4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
    'topic-world': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"></circle><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>`,
    'topic-business': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 19h16M6 16l4-4 3 3 5-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14 8h4v4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
    'topic-health': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s-7-4.7-7-10.4A4.1 4.1 0 0 1 9 6.5c1.1 0 2.2.5 3 1.4.8-.9 1.9-1.4 3-1.4a4.1 4.1 0 0 1 4 4.1C19 16.3 12 21 12 21Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path><path d="M12 9v6M9 12h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>`,
    'topic-science': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 2v6l-5.5 9.3A2 2 0 0 0 6.2 20h11.6a2 2 0 0 0 1.7-3L14 8V2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 13h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>`,
    'topic-sports': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 9.5 8H4l4.2 3.4L6.7 17 12 13.8 17.3 17l-1.5-5.6L20 8h-5.5L12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path></svg>`,
    'topic-law': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16M8 7h8M5 9l3 5H2l3-5Zm14 0 3 5h-6l3-5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
    'topic-news': `<svg${cls} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 5h10a2 2 0 0 1 2 2v12H8a3 3 0 0 1-3-3V6a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path><path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>`
  };
  return icons[name] || icons['topic-news'];
}

function renderVerdictIcon(status, className = '') {
  return renderIcon(status === 'rumor' ? 'verdict-x' : 'verdict-check', className);
}

async function fetchPublishedRows(table) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set('select', '*');
  url.searchParams.set('published', 'eq.true');
  url.searchParams.set('order', 'updated_at.desc.nullslast');

  const response = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`${table} fetch failed: ${response.status} ${await response.text()}`);
  }

  const json = await response.json();
  return Array.isArray(json) ? json : [];
}

function buildArticleScript(article, labels) {
  return `
(function () {
  const article = ${safeJson(article)};
  const labels = ${safeJson(labels)};
  const PREF_KEY = 'tor_reader_prefs_v2';
  const SAVE_KEY = 'tor_saved_articles_v2';
  const SHARE_COUNT_KEY = 'tor_share_counts_v2';
  const body = document.body;

  const uiPrefs = Object.assign({
    theme: 'dark',
    width: '980px',
    fontSize: 17,
    lineHeight: 1.9,
    readerMode: false,
    haptics: true,
    autoScroll: false
  }, loadPrefs());

  let speaking = false;
  let speechUtterance = null;
  let autoScrollRaf = null;
  let autoScrollLastTs = 0;
  let autoScrollPauseUntil = 0;
  let shareMode = 'full';
  let shareQrDataUrl = '';
  let shareQrRetryTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function safeParse(text, fallback) {
    try { return JSON.parse(text); } catch (e) { return fallback; }
  }

  function loadPrefs() {
    return safeParse(localStorage.getItem(PREF_KEY) || 'null', {}) || {};
  }

  function savePrefs() {
    localStorage.setItem(PREF_KEY, JSON.stringify(uiPrefs));
  }

  function performHapticFeedback(level) {
    if (!uiPrefs.haptics) return;
    try {
      const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback;
      if (tg && typeof tg.impactOccurred === 'function') {
        tg.impactOccurred(level === 'medium' ? 'medium' : 'light');
        return;
      }
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate(level === 'medium' ? 18 : 10);
  }

  function showToast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 1900);
  }
  window.showToast = showToast;

  function animatePressedButton(button) {
    if (!button) return;
    button.classList.remove('pop-click');
    void button.offsetWidth;
    button.classList.add('pop-click');
    setTimeout(function () { button.classList.remove('pop-click'); }, 220);
  }

  function settingFeedback(message, button, level) {
    animatePressedButton(button);
    showToast(message);
    performHapticFeedback(level || 'light');
  }

  function updateAccessibilityButtons() {
    const mapping = {
      themeDarkBtn: uiPrefs.theme === 'dark',
      themeSepiaBtn: uiPrefs.theme === 'sepia',
      themeSoftBtn: uiPrefs.theme === 'soft-light',
      widthNarrowBtn: uiPrefs.width === '760px',
      widthNormalBtn: uiPrefs.width === '980px',
      widthWideBtn: uiPrefs.width === '1140px',
      spacingTightBtn: uiPrefs.lineHeight <= 1.9,
      spacingRelaxedBtn: uiPrefs.lineHeight > 1.9,
      readerModeBtn: !!uiPrefs.readerMode,
      hapticToggleBtn: !!uiPrefs.haptics,
      autoScrollToggleBtn: !!uiPrefs.autoScroll
    };

    Object.keys(mapping).forEach(function (id) {
      const el = $(id);
      if (el) el.classList.toggle('active', !!mapping[id]);
    });

    if ($('hapticToggleBtn')) $('hapticToggleBtn').textContent = uiPrefs.haptics ? labels.hapticsOn : labels.hapticsOff;
    if ($('autoScrollToggleBtn')) $('autoScrollToggleBtn').textContent = uiPrefs.autoScroll ? labels.autoScrollOn : labels.autoScrollOff;
  }

  function applyPrefs() {
    body.dataset.theme = uiPrefs.theme;
    document.documentElement.style.setProperty('--reader-width', uiPrefs.width);
    document.documentElement.style.setProperty('--reader-font-size', uiPrefs.fontSize + 'px');
    document.documentElement.style.setProperty('--reader-line-height', String(uiPrefs.lineHeight));
    body.classList.toggle('reader-mode', !!uiPrefs.readerMode);
    updateAccessibilityButtons();
    if (uiPrefs.autoScroll) startAutoScroll(); else stopAutoScroll();
  }

  function setTheme(theme, button) {
    uiPrefs.theme = theme;
    savePrefs();
    applyPrefs();
    settingFeedback(labels.themeUpdated, button, 'light');
  }

  function setReaderWidth(width, button) {
    uiPrefs.width = width;
    savePrefs();
    applyPrefs();
    settingFeedback(labels.widthUpdated, button, 'light');
  }

  function changeFontSize(delta, button) {
    uiPrefs.fontSize = Math.max(14, Math.min(24, uiPrefs.fontSize + delta));
    savePrefs();
    applyPrefs();
    settingFeedback(delta > 0 ? labels.fontIncreased : labels.fontDecreased, button, 'light');
  }

  function changeLineSpacing(delta, button) {
    uiPrefs.lineHeight = Math.max(1.5, Math.min(2.4, +(uiPrefs.lineHeight + delta).toFixed(1)));
    savePrefs();
    applyPrefs();
    settingFeedback(delta > 0 ? labels.spacingRelaxed : labels.spacingTight, button, 'light');
  }

  function toggleReaderMode(button) {
    uiPrefs.readerMode = !uiPrefs.readerMode;
    savePrefs();
    applyPrefs();
    settingFeedback(uiPrefs.readerMode ? labels.readerModeEnabled : labels.readerModeDisabled, button, 'medium');
  }

  function resetReadingSettings(button) {
    uiPrefs.theme = 'dark';
    uiPrefs.width = '980px';
    uiPrefs.fontSize = 17;
    uiPrefs.lineHeight = 1.9;
    uiPrefs.readerMode = false;
    uiPrefs.haptics = true;
    uiPrefs.autoScroll = false;
    savePrefs();
    applyPrefs();
    settingFeedback(labels.settingsReset, button, 'medium');
  }

  function toggleHaptics(button) {
    uiPrefs.haptics = !uiPrefs.haptics;
    savePrefs();
    applyPrefs();
    animatePressedButton(button);
    if (uiPrefs.haptics) performHapticFeedback('medium');
    showToast(uiPrefs.haptics ? labels.hapticsEnabled : labels.hapticsDisabled);
  }

  function pauseAutoScroll(duration) {
    if (!uiPrefs.autoScroll) return;
    autoScrollPauseUntil = performance.now() + (duration || 1800);
  }

  function stopAutoScroll() {
    if (autoScrollRaf) cancelAnimationFrame(autoScrollRaf);
    autoScrollRaf = null;
    autoScrollLastTs = 0;
    autoScrollPauseUntil = 0;
  }

  function autoScrollStep(ts) {
    if (!uiPrefs.autoScroll) {
      stopAutoScroll();
      return;
    }

    const shareOpen = $('shareBackdrop').classList.contains('show');
    const accessOpen = $('accessibilityBackdrop').classList.contains('show');
    if (document.hidden || shareOpen || accessOpen) {
      autoScrollLastTs = ts;
      autoScrollRaf = requestAnimationFrame(autoScrollStep);
      return;
    }

    if (autoScrollPauseUntil && ts < autoScrollPauseUntil) {
      autoScrollLastTs = ts;
      autoScrollRaf = requestAnimationFrame(autoScrollStep);
      return;
    }

    if (!autoScrollLastTs) autoScrollLastTs = ts;
    const delta = Math.min(32, ts - autoScrollLastTs);
    autoScrollLastTs = ts;

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const current = window.scrollY || window.pageYOffset || 0;
    if (current >= maxScroll - 2) {
      uiPrefs.autoScroll = false;
      savePrefs();
      applyPrefs();
      showToast(labels.autoScrollFinished);
      return;
    }

    window.scrollTo(0, Math.min(maxScroll, current + (40 * delta / 1000)));
    autoScrollRaf = requestAnimationFrame(autoScrollStep);
  }

  function startAutoScroll() {
    if (autoScrollRaf) return;
    autoScrollLastTs = 0;
    autoScrollPauseUntil = 0;
    autoScrollRaf = requestAnimationFrame(autoScrollStep);
  }

  function setAutoScroll(enabled, button) {
    uiPrefs.autoScroll = !!enabled;
    savePrefs();
    applyPrefs();
    settingFeedback(uiPrefs.autoScroll ? labels.autoScrollEnabled : labels.autoScrollDisabled, button, uiPrefs.autoScroll ? 'medium' : 'light');
  }

  function toggleAutoScroll(button) {
    setAutoScroll(!uiPrefs.autoScroll, button);
  }

  function bindAutoScrollPause() {
    const pause = function () { pauseAutoScroll(1800); };
    window.addEventListener('wheel', pause, { passive: true });
    window.addEventListener('touchmove', pause, { passive: true });
    window.addEventListener('pointerdown', pause, { passive: true });
    window.addEventListener('keydown', function (event) {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'].includes(event.key)) pause();
    }, { passive: true });
  }

  function openAccessibilityModal() {
    $('accessibilityBackdrop').classList.add('show');
    document.body.classList.add('body-no-scroll');
    updateAccessibilityButtons();
  }

  function closeAccessibilityModal(event) {
    if (event && event.target && event.target.id !== 'accessibilityBackdrop') return;
    $('accessibilityBackdrop').classList.remove('show');
    document.body.classList.remove('body-no-scroll');
  }

  function getShareCounts() {
    return safeParse(localStorage.getItem(SHARE_COUNT_KEY) || '{}', {});
  }

  function increaseShareCount(slug) {
    if (!slug) return 0;
    const counts = getShareCounts();
    counts[slug] = (counts[slug] || 0) + 1;
    localStorage.setItem(SHARE_COUNT_KEY, JSON.stringify(counts));
    return counts[slug];
  }

  function getSavedArticles() {
    return safeParse(localStorage.getItem(SAVE_KEY) || '[]', []);
  }

  function setSavedArticles(items) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(items));
  }

  function getTrackedShareUrl() {
    const url = new URL(article.url);
    url.searchParams.set('utm_source', 'share');
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', article.lang === 'bn' ? 'bangla_share' : 'english_share');
    return url.toString();
  }

  function shortenText(text, maxLength) {
    const clean = String(text || '').replace(/\\s+/g, ' ').trim();
    if (clean.length <= maxLength) return clean;
    return clean.slice(0, Math.max(0, maxLength - 3)).trim() + '...';
  }

  function getSharePayload(mode) {
    const title = article.title || labels.siteName;
    const excerpt = article.aiSummary || '';
    const trackedUrl = getTrackedShareUrl();
    const intro = (article.verdictStatus === 'rumor' ? labels.rumorDetected : labels.verifiedNews) + ' | ' + title;
    const shortSummary = shortenText(excerpt, 150);
    const quote = '“' + shortenText(excerpt, 110) + '”';
    const map = {
      full: {
        label: labels.fullArticle,
        preview: excerpt,
        text: intro + '\\n\\n' + excerpt + '\\n\\n' + trackedUrl
      },
      headline: {
        label: labels.headlineOnly,
        preview: title,
        text: intro + '\\n\\n' + trackedUrl
      },
      summary: {
        label: labels.shortSummary,
        preview: shortSummary,
        text: intro + '\\n\\n' + shortSummary + '\\n\\n' + trackedUrl
      },
      quote: {
        label: labels.quoteCard,
        preview: quote,
        text: intro + '\\n\\n' + quote + '\\n\\n' + trackedUrl
      }
    };
    return Object.assign({ url: trackedUrl, title: title, excerpt: excerpt }, map[mode] || map.full);
  }

  function renderShareQr(url) {
    const image = $('shareQrImage');
    clearTimeout(shareQrRetryTimer);
    shareQrDataUrl = '';
    if (!image || !url) return;
    image.removeAttribute('src');

    const generate = function () {
      if (typeof window.qrcode !== 'function') {
        shareQrRetryTimer = setTimeout(generate, 160);
        return;
      }
      try {
        const qr = window.qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        const svg = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
        shareQrDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        image.src = shareQrDataUrl;
      } catch (error) {
        console.error(error);
      }
    };

    generate();
  }

  function updateSaveForLaterButton() {
    const saved = getSavedArticles().includes(article.slug || '');
    $('saveForLaterText').textContent = saved ? labels.saved : labels.saveForLater;
  }

  function renderShareModal() {
    const payload = getSharePayload(shareMode);
    $('sharePreviewImage').src = article.image || '/logo.png';
    $('sharePreviewImage').onerror = function () { this.onerror = null; this.src = '/logo.png'; };
    $('sharePreviewEyebrow').textContent = article.verdictStatus === 'rumor' ? labels.rumorDetected : labels.verifiedNews;
    $('sharePreviewTitle').textContent = payload.title;
    $('sharePreviewText').textContent = payload.preview;
    $('shareModeLabel').textContent = payload.label;
    $('shareUrlText').textContent = payload.url;
    $('shareCountText').textContent = 'Shared ' + (getShareCounts()[article.slug || ''] || 0) + ' times';
    document.querySelectorAll('[data-share-mode]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-share-mode') === shareMode);
    });
    updateSaveForLaterButton();
    renderShareQr(payload.url);
  }

  function openShareModal() {
    $('shareBackdrop').classList.add('show');
    document.body.classList.add('body-no-scroll');
    shareMode = 'full';
    clearTimeout(shareQrRetryTimer);
    shareQrDataUrl = '';
    renderShareModal();
  }

  function closeShareModal(event) {
    if (event && event.target && event.target.id !== 'shareBackdrop') return;
    $('shareBackdrop').classList.remove('show');
    document.body.classList.remove('body-no-scroll');
  }

  function setShareMode(mode) {
    shareMode = mode;
    renderShareModal();
  }

  async function shareWithDevice() {
    const payload = getSharePayload(shareMode);
    if (navigator.share) {
      try {
        await navigator.share({ title: payload.title, text: payload.preview, url: payload.url });
        increaseShareCount(article.slug || '');
        renderShareModal();
      } catch (error) {
        if (error && error.name !== 'AbortError') console.error(error);
      }
    } else {
      copyShareLink();
    }
  }

  async function copyShareLink() {
    const payload = getSharePayload(shareMode);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload.url);
      } else {
        const helper = document.createElement('textarea');
        helper.value = payload.url;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      }
      increaseShareCount(article.slug || '');
      renderShareModal();
      showToast(labels.copied);
    } catch (error) {
      console.error(error);
      showToast(labels.copyFailed);
    }
  }

  function shareToPlatform(platform) {
    const payload = getSharePayload(shareMode);
    const encodedUrl = encodeURIComponent(payload.url);
    const encodedText = encodeURIComponent(payload.text);
    const targets = {
      whatsapp: 'https://wa.me/?text=' + encodedText,
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
      x: 'https://x.com/intent/tweet?text=' + encodeURIComponent(payload.title) + '&url=' + encodedUrl,
      telegram: 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodeURIComponent(payload.title)
    };
    if (!targets[platform]) return;
    increaseShareCount(article.slug || '');
    renderShareModal();
    window.open(targets[platform], '_blank', 'noopener,noreferrer');
  }

  function shareToEmail() {
    const payload = getSharePayload(shareMode);
    const subject = encodeURIComponent(payload.title);
    const body = encodeURIComponent(payload.preview + '\\n\\n' + payload.url);
    increaseShareCount(article.slug || '');
    renderShareModal();
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  }

  function toggleSaveForLater() {
    const slug = article.slug || '';
    if (!slug) return;
    const saved = getSavedArticles();
    const exists = saved.includes(slug);
    const next = exists ? saved.filter(function (item) { return item !== slug; }) : saved.concat(slug);
    setSavedArticles(next);
    updateSaveForLaterButton();
    showToast(exists ? labels.removedSaved : labels.savedForLater);
  }

  function downloadShareQr() {
    const qrUrl = shareQrDataUrl || ($('shareQrImage') && $('shareQrImage').src) || '';
    if (!qrUrl) {
      renderShareModal();
      showToast(labels.qrGenerating);
      return;
    }
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = (article.slug || 'story') + '-qr.svg';
    link.click();
    increaseShareCount(article.slug || '');
    renderShareModal();
  }

  function openSource() {
    if (!article.sourceUrl) {
      showToast(labels.sourceUnavailable);
      return;
    }
    window.open(article.sourceUrl, '_blank', 'noopener,noreferrer');
  }

  function stopListening() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    speaking = false;
    speechUtterance = null;
    $('listenText').textContent = labels.listen;
  }

  function startListening() {
    if (!window.speechSynthesis) {
      showToast(labels.shareUnavailable);
      return;
    }
    stopListening();
    const text = [article.title, article.aiSummary, article.plainBody].filter(Boolean).join('. ');
    speechUtterance = new SpeechSynthesisUtterance(text);
    speechUtterance.lang = labels.langCode;
    speechUtterance.rate = 0.95;
    speechUtterance.onend = stopListening;
    speechUtterance.onerror = stopListening;
    speaking = true;
    $('listenText').textContent = labels.stopListening;
    window.speechSynthesis.speak(speechUtterance);
  }

  function toggleListen() {
    if (speaking) stopListening(); else startListening();
  }

  window.setTheme = setTheme;
  window.setReaderWidth = setReaderWidth;
  window.changeFontSize = changeFontSize;
  window.changeLineSpacing = changeLineSpacing;
  window.toggleReaderMode = toggleReaderMode;
  window.resetReadingSettings = resetReadingSettings;
  window.toggleHaptics = toggleHaptics;
  window.toggleAutoScroll = toggleAutoScroll;
  window.openAccessibilityModal = openAccessibilityModal;
  window.closeAccessibilityModal = closeAccessibilityModal;
  window.openShareModal = openShareModal;
  window.closeShareModal = closeShareModal;
  window.setShareMode = setShareMode;
  window.shareWithDevice = shareWithDevice;
  window.copyShareLink = copyShareLink;
  window.shareToPlatform = shareToPlatform;
  window.shareToEmail = shareToEmail;
  window.toggleSaveForLater = toggleSaveForLater;
  window.downloadShareQr = downloadShareQr;

  $('listenBtn').addEventListener('click', function () { toggleListen(); performHapticFeedback('medium'); });
  $('sourceBtn').addEventListener('click', function () { openSource(); performHapticFeedback('medium'); });
  $('shareBtn').addEventListener('click', function () { openShareModal(); performHapticFeedback('medium'); });
  $('floatingAccessibilityBtn').addEventListener('click', function () { openAccessibilityModal(); performHapticFeedback('medium'); });

  document.addEventListener('click', function (event) {
    const target = event.target.closest('button, a');
    if (!target || target.disabled) return;
    performHapticFeedback(target.classList.contains('share-card-btn') ? 'light' : 'medium');
  }, true);

  bindAutoScrollPause();
  applyPrefs();
})();
  `.trim();
}

function buildArticleHtml(post, lang) {
  const labels = getLabels(lang);
  const slug = safeSlug(post.slug);
  const title = String(post.title || 'Article').trim();
  const description = getDescription(post);
  const body = getBody(post);
  const plainBody = stripHtml(body);
  const aiSummary = trimText(description || plainBody, 220);
  const category = getCategory(post);
  const topicIcon = getTopicIcon(category);
  const image = getImage(post);
  const sourceUrl = getSourceUrl(post);
  const author = getAuthor(post);
  const status = getStatus(post);
  const verdictLabel = status === 'truth' ? labels.verifiedNews : labels.rumorDetected;
  const verdictColor = status === 'truth' ? '#22c55e' : '#ff453a';
  const updated = post.updated_at || post.created_at || new Date().toISOString();
  const created = post.created_at || updated;
  const bodyHtml = renderBody(body);
  const articleUrl = lang === 'bn' ? `${SITE_URL}/bd/article/${encodeURIComponent(slug)}` : `${SITE_URL}/article/${encodeURIComponent(slug)}`;
  const homeUrl = lang === 'bn' ? `${SITE_URL}/bd` : `${SITE_URL}/`;

  const articleData = {
    slug,
    lang,
    title,
    image,
    category,
    sourceUrl,
    url: articleUrl,
    verdictStatus: status,
    aiSummary,
    plainBody: trimText(plainBody, 3000)
  };

  return `<!doctype html>
<html lang="${lang === 'bn' ? 'bn' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | TruthOrRumor</title>
  <meta name="description" content="${escapeHtml(aiSummary)}">
  <link rel="canonical" href="${escapeHtml(articleUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(aiSummary)}">
  <meta property="og:url" content="${escapeHtml(articleUrl)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(aiSummary)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
  <script type="application/ld+json">${safeJson({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    datePublished: created,
    dateModified: updated,
    image: [image],
    description: aiSummary,
    mainEntityOfPage: articleUrl,
    articleSection: category,
    author: { '@type': 'Person', name: author },
    publisher: { '@type': 'Organization', name: 'TruthOrRumor', logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } }
  })}</script>
  <style>
    :root {
      --reader-width: 980px;
      --reader-font-size: 17px;
      --reader-line-height: 1.9;
      --bg: #031226;
      --card: rgba(13,24,52,0.78);
      --text: #f8fafc;
      --muted: rgba(241,245,249,0.74);
      --line: rgba(255,255,255,0.12);
      --gold: #f2b53a;
      --orange: #ff8d3a;
      --cyan: #57d0ff;
      --summary-label: #9fe8ff;
      --summary-border: rgba(96,165,250,0.28);
      --summary-bg-1: rgba(34,211,238,0.16);
      --summary-bg-2: rgba(59,130,246,0.18);
      --shadow: 0 20px 50px rgba(2,8,23,0.36);
      --page-bg:
        radial-gradient(circle at 14% 18%, rgba(255,255,255,0.06), transparent 18%),
        radial-gradient(circle at 82% 78%, rgba(242,181,58,0.16), transparent 22%),
        radial-gradient(circle at 20% 80%, rgba(34,197,94,0.12), transparent 16%),
        radial-gradient(circle at 80% 30%, rgba(59,130,246,0.14), transparent 16%),
        linear-gradient(180deg, #021025 0%, #041938 100%);
    }

    html { scroll-behavior: smooth; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: var(--text);
      background: var(--page-bg);
      font-size: var(--reader-font-size);
      line-height: var(--reader-line-height);
      transition: background .22s ease, color .22s ease;
    }
    body.body-no-scroll { overflow: hidden; }
    body.reader-mode { --page-bg: linear-gradient(180deg, rgba(1,10,28,.98), rgba(1,10,28,1)); }

    body[data-theme='sepia'] {
      --card: rgba(248,239,223,0.86);
      --text: #312412;
      --muted: rgba(49,36,18,0.72);
      --line: rgba(49,36,18,0.12);
      --gold: #b2781f;
      --orange: #cb7b22;
      --cyan: #0f6db0;
      --summary-label: #0f6db0;
      --summary-border: rgba(15,109,176,0.22);
      --summary-bg-1: rgba(15,109,176,0.12);
      --summary-bg-2: rgba(178,120,31,0.10);
      --shadow: 0 20px 50px rgba(83,63,24,0.16);
      --page-bg:
        radial-gradient(circle at 82% 78%, rgba(178,120,31,0.13), transparent 18%),
        radial-gradient(circle at 20% 80%, rgba(111,160,58,0.10), transparent 16%),
        linear-gradient(180deg, #f6ecdb 0%, #ebd7b0 100%);
    }

    body[data-theme='soft-light'] {
      --card: rgba(255,255,255,0.82);
      --text: #18283d;
      --muted: rgba(24,40,61,0.70);
      --line: rgba(24,40,61,0.10);
      --gold: #2d72ff;
      --orange: #5f8eff;
      --cyan: #0284c7;
      --summary-label: #2563eb;
      --summary-border: rgba(37,99,235,0.20);
      --summary-bg-1: rgba(37,99,235,0.12);
      --summary-bg-2: rgba(14,165,233,0.12);
      --shadow: 0 20px 50px rgba(40,64,112,0.14);
      --page-bg:
        radial-gradient(circle at 18% 18%, rgba(45,114,255,0.12), transparent 18%),
        radial-gradient(circle at 82% 78%, rgba(14,165,233,0.12), transparent 18%),
        linear-gradient(180deg, #edf4ff 0%, #dce8ff 100%);
    }

    body[data-theme='soft-light'] .share-modal,
    body[data-theme='soft-light'] .accessibility-modal,
    body[data-theme='soft-light'] .share-card-btn,
    body[data-theme='soft-light'] .share-mode-btn,
    body[data-theme='soft-light'] .tool-btn,
    body[data-theme='soft-light'] .modal-close,
    body[data-theme='soft-light'] .share-close,
    body[data-theme='soft-light'] .action-btn,
    body[data-theme='soft-light'] .home-btn,
    body[data-theme='soft-light'] .share-preview,
    body[data-theme='soft-light'] .share-url-box,
    body[data-theme='soft-light'] .share-qr-box {
      color: #18283d;
      background: rgba(255,255,255,0.82);
    }

    a { color: inherit; }
    button { font: inherit; }

    .page-shell {
      width: min(100%, calc(var(--reader-width) + 36px));
      margin: 0 auto;
      padding: 18px 12px 90px;
    }

    .liquid-card {
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
      box-shadow: var(--shadow);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .article-shell {
      border-radius: 28px;
      padding: 14px;
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
      border-radius: 26px;
      padding: 12px;
    }

    .home-btn {
      min-height: 48px;
      padding: 0 18px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.06);
      color: var(--text);
      font-size: 15px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      white-space: nowrap;
    }

    .site-name {
      font-size: clamp(22px, 4.8vw, 30px);
      line-height: 1;
      font-weight: 900;
      letter-spacing: -0.04em;
      text-align: right;
    }

    .hero {
      position: relative;
      overflow: hidden;
      border-radius: 26px;
      margin-bottom: 16px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.04);
    }

    .hero img {
      width: 100%;
      display: block;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      background: #0f172a;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      padding: 14px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      background: linear-gradient(180deg, rgba(3,10,25,0.12), rgba(1,10,28,0.22) 55%, rgba(1,10,28,0.34));
    }

    .hero-badges {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    .hero-verdict,
    .hero-topic {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 8px 14px;
      border: 1px solid rgba(255,255,255,0.12);
      color: #fff;
      font-size: 14px;
      font-weight: 900;
      line-height: 1;
      box-shadow: 0 10px 24px rgba(2,8,23,0.25);
      max-width: calc(100% - 4px);
    }

    .hero-verdict { background: ${verdictColor}; }
    .hero-topic { background: rgba(17,29,60,0.90); }

    .hero-verdict-icon,
    .hero-topic-icon {
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex: 0 0 auto;
    }

    .hero-verdict-icon svg,
    .hero-topic-icon svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      color: var(--muted);
      font-size: 14px;
      margin-bottom: 12px;
    }

    .category-line {
      margin: 0 0 10px;
      color: var(--gold);
      font-size: clamp(14px, 2.5vw, 18px);
      font-weight: 900;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 12px;
      font-size: clamp(34px, 7vw, 58px);
      line-height: 1.10;
      letter-spacing: -0.05em;
      font-weight: 900;
    }

    .summary-box {
      margin: 0 0 18px;
      border-radius: 22px;
      padding: 16px;
      border: 1px solid var(--summary-border);
      background:
        radial-gradient(circle at 90% 15%, var(--summary-bg-1), transparent 22%),
        radial-gradient(circle at 12% 88%, rgba(168,85,247,0.12), transparent 22%),
        linear-gradient(135deg, var(--summary-bg-2), rgba(255,255,255,0.06));
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
    }

    .summary-box-label {
      margin: 0 0 8px;
      color: var(--summary-label);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      text-shadow: 0 1px 0 rgba(255,255,255,0.06);
    }

    .summary-box-text {
      margin: 0;
      color: var(--text);
      font-size: 15px;
      font-weight: 600;
      line-height: 1.75;
    }

    .article-body p {
      margin: 0 0 1.08em;
      color: var(--text);
    }

    .article-body img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 1.1em auto;
      border-radius: 18px;
    }

    .action-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-top: 16px;
    }

    .action-btn {
      width: 100%;
      min-height: 50px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
      color: var(--text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 900;
      white-space: nowrap;
      cursor: pointer;
      transition: transform .18s ease, background .18s ease, border-color .18s ease;
    }

    .action-btn.primary {
      background: linear-gradient(90deg, rgba(242,181,58,0.28), rgba(255,141,58,0.24));
      border-color: rgba(242,181,58,0.42);
    }

    .action-btn svg {
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      display: block;
    }

    .floating-accessibility-btn {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 95;
      width: 58px;
      height: 58px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08));
      color: var(--text);
      box-shadow: var(--shadow);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .floating-accessibility-btn svg.main {
      width: 26px;
      height: 26px;
    }

    .check-badge {
      position: absolute;
      right: -4px;
      top: -4px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${verdictColor};
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #0b1222;
      font-size: 13px;
      font-weight: 900;
      line-height: 1;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.46);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 120;
    }

    .modal-backdrop.show { display: flex; }

    .accessibility-modal {
      width: min(640px, 100%);
      max-height: min(88vh, 860px);
      overflow-y: auto;
      border-radius: 30px;
      padding: 20px;
      position: relative;
    }

    .modal-close {
      min-height: 48px;
      padding: 0 18px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.08);
      color: var(--text);
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .modal-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 12px;
    }

    .modal-title {
      margin: 0;
      font-size: clamp(28px, 6vw, 42px);
      line-height: 1.02;
      font-weight: 900;
      letter-spacing: -0.04em;
    }

    .modal-note {
      margin-top: 8px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.7;
    }

    .share-section-title {
      margin: 18px 0 10px;
      color: var(--text);
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .tool-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .tool-btn {
      min-height: 48px;
      padding: 0 18px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.08);
      color: var(--text);
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      transition: transform .18s ease, background .18s ease, border-color .18s ease;
    }

    .tool-btn.active {
      background: linear-gradient(90deg, rgba(242,181,58,0.28), rgba(255,141,58,0.24));
      border-color: rgba(242,181,58,0.42);
      box-shadow: 0 0 0 1px rgba(242,181,58,0.12) inset;
      color: var(--text);
    }

    .share-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(2,8,23,0.54);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 126;
      opacity: 0;
      transition: opacity 0.24s ease;
    }

    .share-backdrop.show {
      display: flex;
      opacity: 1;
    }

    .share-modal {
      width: min(640px, 100%);
      max-height: min(88vh, 860px);
      overflow-y: auto;
      overscroll-behavior: contain;
      border-radius: 30px;
      padding: 20px;
      position: relative;
      border: 1px solid rgba(255,255,255,0.10);
      box-shadow: 0 30px 80px rgba(2, 8, 23, 0.36);
      transform: translateY(18px) scale(0.98);
      opacity: 0;
      transition: transform 0.24s ease, opacity 0.24s ease;
      color: var(--text);
    }

    .share-backdrop.show .share-modal {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .share-modal::-webkit-scrollbar,
    .accessibility-modal::-webkit-scrollbar { width: 7px; }
    .share-modal::-webkit-scrollbar-thumb,
    .accessibility-modal::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.16); border-radius: 999px; }

    .share-modal-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 16px;
    }

    .share-modal-title {
      margin: 0;
      font-size: clamp(28px, 6vw, 42px);
      line-height: 1.02;
      font-weight: 900;
      letter-spacing: -0.04em;
    }

    .share-modal-sub {
      margin-top: 8px;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.6;
    }

    .share-close {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.08);
      color: var(--text);
      font-size: 30px;
      line-height: 1;
      cursor: pointer;
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .share-preview {
      border-radius: 24px;
      padding: 15px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.06);
      display: grid;
      grid-template-columns: 92px 1fr;
      gap: 14px;
      margin-bottom: 16px;
      align-items: start;
    }

    .share-preview-thumb-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
    }

    .share-preview-thumb {
      width: 100%;
      height: 100%;
      border-radius: 18px;
      object-fit: cover;
      background: radial-gradient(circle at 22% 18%, rgba(255,255,255,0.10), transparent 18%), linear-gradient(135deg, #0f172a, #1e293b);
    }

    .share-preview-badges {
      position: absolute;
      inset: 8px 8px auto 8px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 6px;
      pointer-events: none;
    }

    .thumb-badge {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: 0 8px 18px rgba(2,8,23,0.28);
    }

    .thumb-badge.verdict { background: ${verdictColor}; }
    .thumb-badge.topic { background: rgba(17,29,60,0.92); }

    .thumb-badge-icon,
    .share-icon-svg {
      width: 15px;
      height: 15px;
      display: block;
      color: currentColor;
    }

    .share-preview-eyebrow {
      margin: 0 0 6px;
      color: var(--gold);
      text-shadow: 0 1px 0 rgba(255,255,255,0.05);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      line-height: 1.5;
    }

    .share-preview-title {
      margin: 0 0 8px;
      font-size: clamp(20px, 4vw, 30px);
      line-height: 1.25;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: var(--text);
    }

    .share-preview-text {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.68;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 5;
      overflow: hidden;
    }

    .share-section-label {
      margin: 0 0 10px;
      color: var(--text);
      font-size: 15px;
      font-weight: 900;
    }

    .share-mode-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }

    .share-mode-btn {
      min-height: 46px;
      padding: 0 14px;
      border-radius: 16px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.08);
      color: var(--text);
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      text-align: center;
      line-height: 1.2;
    }

    .share-mode-btn.active {
      background: linear-gradient(90deg, rgba(242,181,58,0.28), rgba(255,141,58,0.24));
      border-color: rgba(242,181,58,0.42);
      box-shadow: 0 0 0 1px rgba(242,181,58,0.12) inset;
    }

    .share-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 16px;
    }

    .share-card-btn {
      min-height: 76px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.12);
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      color: var(--text);
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      text-align: left;
      width: 100%;
    }

    .share-icon-bubble {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      border: 1px solid rgba(242,181,58,0.22);
      background: rgba(242,181,58,0.10);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      color: var(--text);
      line-height: 1;
    }

    .share-icon-bubble svg {
      width: 22px;
      height: 22px;
      display: block;
    }

    .share-card-label {
      display: block;
      min-width: 0;
      line-height: 1.22;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .share-url-box,
    .share-qr-box {
      border-radius: 18px;
      padding: 14px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.05);
      margin-top: 14px;
    }

    .share-url-title {
      margin: 0 0 8px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 800;
      line-height: 1.6;
    }

    .share-url-text {
      color: var(--text);
      font-size: 14px;
      line-height: 1.7;
      word-break: break-word;
    }

    .share-qr-box { text-align: center; }

    .share-qr-image {
      width: min(100%, 220px);
      aspect-ratio: 1 / 1;
      background: #fff;
      padding: 10px;
      border-radius: 18px;
      display: block;
      margin: 8px auto 10px;
      object-fit: contain;
    }

    .share-mini-note {
      margin-top: 0;
      font-size: 13px;
      line-height: 1.6;
      color: var(--muted);
    }

    .toast {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translateX(-50%) translateY(16px);
      opacity: 0;
      pointer-events: none;
      z-index: 130;
      background: rgba(15,23,42,0.95);
      color: #fff;
      padding: 12px 18px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 20px 40px rgba(2,8,23,0.35);
      transition: opacity .2s ease, transform .2s ease;
      font-size: 14px;
      font-weight: 800;
      white-space: nowrap;
      max-width: calc(100% - 24px);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .pop-click { animation: popClick 0.22s ease; }

    @keyframes popClick {
      0% { transform: scale(1); }
      50% { transform: scale(0.96); }
      100% { transform: scale(1); }
    }

    @media (max-width: 768px) {
      .page-shell { padding: 10px 10px 86px; }
      .top-row { padding: 10px; border-radius: 22px; }
      .home-btn { min-height: 44px; padding: 0 14px; font-size: 14px; }
      .site-name { font-size: 17px; }
      .article-shell { padding: 12px; border-radius: 24px; }
      .hero { border-radius: 22px; }
      .hero-overlay { padding: 10px; }
      .hero-verdict, .hero-topic { padding: 6px 10px; font-size: 11px; gap: 6px; }
      .hero-verdict-icon, .hero-topic-icon { width: 12px; height: 12px; }
      .meta-row { font-size: 12px; }
      .category-line { font-size: 13px; }
      h1 { font-size: clamp(28px, 8vw, 38px); }
      .summary-box { padding: 13px; border-radius: 18px; }
      .summary-box-label { font-size: 10px; }
      .summary-box-text { font-size: 13px; }
      .action-btn { min-height: 42px; padding: 0 10px; font-size: 12px; gap: 6px; }
      .action-btn svg { width: 16px; height: 16px; }
      .floating-accessibility-btn { width: 58px; height: 58px; border-radius: 18px; }
      .floating-accessibility-btn svg.main { width: 24px; height: 24px; }
      .check-badge { width: 22px; height: 22px; font-size: 12px; }
      .modal-backdrop { align-items: flex-end; padding: 10px 10px max(10px, env(safe-area-inset-bottom)); }
      .accessibility-modal,
      .share-modal { width: 100%; max-height: min(84vh, 820px); padding: 14px; border-radius: 24px 24px 18px 18px; }
      .modal-title, .share-modal-title { font-size: clamp(26px, 9vw, 34px); }
      .modal-close { min-height: 44px; padding: 0 14px; font-size: 14px; }
      .tool-row { gap: 9px; }
      .tool-btn { min-height: 44px; padding: 0 14px; border-radius: 16px; font-size: 13px; }
      .share-preview { grid-template-columns: 72px 1fr; gap: 10px; padding: 12px; }
      .share-preview-thumb { border-radius: 16px; }
      .share-preview-title { font-size: clamp(19px, 7vw, 26px); }
      .share-preview-text { font-size: 13px; }
      .share-mode-row, .share-grid { gap: 9px; }
      .share-card-btn { min-height: 68px; padding: 10px; border-radius: 16px; font-size: 13px; }
      .share-icon-bubble { width: 40px; height: 40px; }
      .share-icon-bubble svg { width: 20px; height: 20px; }
      .share-qr-image { width: min(100%, 190px); }
    }
  </style>
</head>
<body data-theme="dark">
  <div class="page-shell">
    <article class="article-shell liquid-card">
      <div class="top-row liquid-card">
        <a class="home-btn" href="${escapeHtml(homeUrl)}">${escapeHtml(labels.backHome)}</a>
        <div class="site-name">${escapeHtml(labels.siteName)}</div>
      </div>

      <div class="hero">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">
        <div class="hero-overlay">
          <div class="hero-badges">
            <span class="hero-verdict">${renderVerdictIcon(status, 'hero-verdict-icon')}<span>${escapeHtml(verdictLabel)}</span></span>
            <span class="hero-topic">${renderIcon(topicIcon, 'hero-topic-icon')}<span>${escapeHtml(category)}</span></span>
          </div>
        </div>
      </div>

      <div class="meta-row">
        <span><strong>${escapeHtml(labels.update)}:</strong> ${escapeHtml(formatDisplayDate(updated, lang))}</span>
        <span><strong>${escapeHtml(labels.topic)}:</strong> ${escapeHtml(category)}</span>
        <span>${escapeHtml(author)}</span>
      </div>

      <p class="category-line">${escapeHtml(category)}</p>
      <h1>${escapeHtml(title)}</h1>

      <div class="summary-box">
        <p class="summary-box-label">${escapeHtml(labels.aiSummaryLabel)}</p>
        <p class="summary-box-text">${escapeHtml(aiSummary)}</p>
      </div>

      <div class="article-body">${bodyHtml}</div>

      <div class="action-row">
        <button class="action-btn" id="listenBtn" type="button" aria-label="${escapeHtml(labels.listen)}">
          ${renderIcon('listen', 'share-icon-svg')}
          <span id="listenText">${escapeHtml(labels.listen)}</span>
        </button>

        <button class="action-btn primary" id="shareBtn" type="button" aria-label="${escapeHtml(labels.share)}">
          ${renderIcon('share', 'share-icon-svg')}
          <span>${escapeHtml(labels.share)}</span>
        </button>

        <button class="action-btn" id="sourceBtn" type="button" aria-label="${escapeHtml(labels.source)}">
          ${renderIcon('source', 'share-icon-svg')}
          <span>${escapeHtml(labels.source)}</span>
        </button>
      </div>
    </article>
  </div>

  <button class="floating-accessibility-btn" id="floatingAccessibilityBtn" type="button" aria-label="${escapeHtml(labels.accessibility)}">
    ${renderIcon('accessibility', 'main')}
    <span class="check-badge">${status === 'truth' ? '✓' : '✕'}</span>
  </button>

  <div id="accessibilityBackdrop" class="modal-backdrop" onclick="closeAccessibilityModal(event)">
    <div class="accessibility-modal liquid-card" onclick="event.stopPropagation()">
      <div class="modal-head">
        <button class="modal-close" type="button" onclick="closeAccessibilityModal(); showToast('${escapeHtml(labels.close)}')">‹ ${escapeHtml(labels.close)}</button>
        <div>
          <h3 class="modal-title">${escapeHtml(labels.accessibility)}</h3>
          <div class="modal-note">${escapeHtml(labels.accessibilityNote)}</div>
        </div>
      </div>

      <p class="share-section-title">${escapeHtml(labels.theme)}</p>
      <div class="tool-row">
        <button class="tool-btn active" id="themeDarkBtn" type="button" onclick="setTheme('dark', this)">${escapeHtml(labels.dark)}</button>
        <button class="tool-btn" id="themeSepiaBtn" type="button" onclick="setTheme('sepia', this)">${escapeHtml(labels.sepia)}</button>
        <button class="tool-btn" id="themeSoftBtn" type="button" onclick="setTheme('soft-light', this)">${escapeHtml(labels.softLight)}</button>
      </div>

      <p class="share-section-title">${escapeHtml(labels.readerWidth)}</p>
      <div class="tool-row">
        <button class="tool-btn" id="widthNarrowBtn" type="button" onclick="setReaderWidth('760px', this)">${escapeHtml(labels.narrow)}</button>
        <button class="tool-btn active" id="widthNormalBtn" type="button" onclick="setReaderWidth('980px', this)">${escapeHtml(labels.normal)}</button>
        <button class="tool-btn" id="widthWideBtn" type="button" onclick="setReaderWidth('1140px', this)">${escapeHtml(labels.wide)}</button>
      </div>

      <p class="share-section-title">${escapeHtml(labels.fontSize)}</p>
      <div class="tool-row">
        <button class="tool-btn" type="button" onclick="changeFontSize(-1, this)">${escapeHtml(labels.aMinus)}</button>
        <button class="tool-btn" type="button" onclick="changeFontSize(1, this)">${escapeHtml(labels.aPlus)}</button>
      </div>

      <p class="share-section-title">${escapeHtml(labels.lineSpacing)}</p>
      <div class="tool-row">
        <button class="tool-btn active" id="spacingTightBtn" type="button" onclick="changeLineSpacing(-0.1, this)">${escapeHtml(labels.tight)}</button>
        <button class="tool-btn" id="spacingRelaxedBtn" type="button" onclick="changeLineSpacing(0.1, this)">${escapeHtml(labels.relaxed)}</button>
      </div>

      <p class="share-section-title">${escapeHtml(labels.readerMode)}</p>
      <div class="tool-row">
        <button class="tool-btn" id="readerModeBtn" type="button" onclick="toggleReaderMode(this)">${escapeHtml(labels.toggleReaderMode)}</button>
        <button class="tool-btn" type="button" onclick="resetReadingSettings(this)">${escapeHtml(labels.reset)}</button>
      </div>

      <p class="share-section-title">${escapeHtml(labels.hapticsAuto)}</p>
      <div class="tool-row">
        <button class="tool-btn active" id="hapticToggleBtn" type="button" onclick="toggleHaptics(this)">${escapeHtml(labels.hapticsOn)}</button>
        <button class="tool-btn" id="autoScrollToggleBtn" type="button" onclick="toggleAutoScroll(this)">${escapeHtml(labels.autoScrollOff)}</button>
      </div>
    </div>
  </div>

  <div id="shareBackdrop" class="share-backdrop" onclick="closeShareModal(event)">
    <div class="share-modal liquid-card" onclick="event.stopPropagation()">
      <div class="share-modal-top">
        <div>
          <h3 class="share-modal-title">${escapeHtml(labels.shareStory)}</h3>
          <div class="share-modal-sub" id="shareCountText">${escapeHtml(labels.sharedTimes)}</div>
        </div>
        <button class="share-close" type="button" onclick="closeShareModal()">×</button>
      </div>

      <div class="share-preview">
        <div class="share-preview-thumb-wrap">
          <img id="sharePreviewImage" class="share-preview-thumb" src="${escapeHtml(image)}" alt="Share preview image">
          <div class="share-preview-badges">
            <span class="thumb-badge verdict">${renderVerdictIcon(status, 'thumb-badge-icon')}</span>
            <span class="thumb-badge topic">${renderIcon(topicIcon, 'thumb-badge-icon')}</span>
          </div>
        </div>
        <div>
          <p class="share-preview-eyebrow" id="sharePreviewEyebrow">${escapeHtml(verdictLabel)}</p>
          <h4 class="share-preview-title" id="sharePreviewTitle">${escapeHtml(title)}</h4>
          <p class="share-preview-text" id="sharePreviewText">${escapeHtml(aiSummary)}</p>
        </div>
      </div>

      <p class="share-section-label">${escapeHtml(labels.shareAs)}</p>
      <div class="share-mode-row">
        <button class="share-mode-btn active" type="button" data-share-mode="full" onclick="setShareMode('full')">${escapeHtml(labels.fullArticle)}</button>
        <button class="share-mode-btn" type="button" data-share-mode="headline" onclick="setShareMode('headline')">${escapeHtml(labels.headlineOnly)}</button>
        <button class="share-mode-btn" type="button" data-share-mode="summary" onclick="setShareMode('summary')">${escapeHtml(labels.shortSummary)}</button>
        <button class="share-mode-btn" type="button" data-share-mode="quote" onclick="setShareMode('quote')">${escapeHtml(labels.quoteCard)}</button>
      </div>

      <p class="share-section-label">${escapeHtml(labels.quickShare)}</p>
      <div class="share-grid">
        <button class="share-card-btn" type="button" onclick="shareWithDevice()"><span class="share-icon-bubble">${renderIcon('device', 'share-icon-svg')}</span><span class="share-card-label">${escapeHtml(labels.deviceShare)}</span></button>
        <button class="share-card-btn" type="button" onclick="copyShareLink()"><span class="share-icon-bubble">${renderIcon('link', 'share-icon-svg')}</span><span class="share-card-label">${escapeHtml(labels.copyLink)}</span></button>
        <button class="share-card-btn" type="button" onclick="shareToPlatform('whatsapp')"><span class="share-icon-bubble">${renderIcon('whatsapp', 'share-icon-svg')}</span><span class="share-card-label">${escapeHtml(labels.whatsapp)}</span></button>
        <button class="share-card-btn" type="button" onclick="shareToPlatform('facebook')"><span class="share-icon-bubble">${renderIcon('facebook', 'share-icon-svg')}</span><span class="share-card-label">${escapeHtml(labels.facebook)}</span></button>
        <button class="share-card-btn" type="button" onclick="shareToPlatform('x')"><span class="share-icon-bubble">${renderIcon('x', 'share-icon-svg')}</span><span class="share-card-label">${escapeHtml(labels.x)}</span></button>
        <button class="share-card-btn" type="button" onclick="shareToPlatform('telegram')"><span class="share-icon-bubble">${renderIcon('telegram', 'share-icon-svg')}</span><span class="share-card-label">${escapeHtml(labels.telegram)}</span></button>
        <button class="share-card-btn" type="button" onclick="shareToEmail()"><span class="share-icon-bubble">${renderIcon('email', 'share-icon-svg')}</span><span class="share-card-label">${escapeHtml(labels.email)}</span></button>
        <button class="share-card-btn" type="button" onclick="toggleSaveForLater()"><span class="share-icon-bubble">${renderIcon('bookmark', 'share-icon-svg')}</span><span class="share-card-label" id="saveForLaterText">${escapeHtml(labels.saveForLater)}</span></button>
        <button class="share-card-btn" type="button" onclick="downloadShareQr()"><span class="share-icon-bubble">${renderIcon('qr', 'share-icon-svg')}</span><span class="share-card-label">${escapeHtml(labels.downloadQr)}</span></button>
      </div>

      <div class="share-url-box">
        <p class="share-url-title">${escapeHtml(labels.shareMode)}: <strong id="shareModeLabel">${escapeHtml(labels.fullArticle)}</strong></p>
        <p class="share-url-title">${escapeHtml(labels.shareUrl)}:</p>
        <div class="share-url-text" id="shareUrlText">${escapeHtml(articleUrl)}</div>
      </div>

      <div class="share-qr-box">
        <p class="share-url-title">${escapeHtml(labels.qrCode)}</p>
        <img id="shareQrImage" class="share-qr-image" src="" alt="QR code for the share link">
        <div class="share-mini-note">${escapeHtml(labels.qrNote)}</div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast" aria-live="polite"></div>

  <script>${buildArticleScript(articleData, labels)}</script>
</body>
</html>`;
}

function writeFile(outputPath, content) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf8');
}

async function run() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  const [englishPosts, banglaPosts] = await Promise.all([
    fetchPublishedRows('posts'),
    fetchPublishedRows('posts_bd')
  ]);

  englishPosts.forEach((post) => {
    const slug = safeSlug(post.slug);
    if (!slug) return;
    const html = buildArticleHtml(post, 'en');
    writeFile(path.join(process.cwd(), 'article', slug, 'index.html'), html);
  });

  banglaPosts.forEach((post) => {
    const slug = safeSlug(post.slug);
    if (!slug) return;
    const html = buildArticleHtml(post, 'bn');
    writeFile(path.join(process.cwd(), 'bd', 'article', slug, 'index.html'), html);
  });

  console.log('Built ' + englishPosts.length + ' English articles');
  console.log('Built ' + banglaPosts.length + ' Bangla articles');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
