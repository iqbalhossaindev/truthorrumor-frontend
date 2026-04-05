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
      topic: 'Topic',
      truthEyebrow: 'TRUTH VERIFICATION',
      rumorEyebrow: 'RUMOR VERIFICATION'
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
    topic: 'Topic',
    truthEyebrow: 'TRUTH VERIFICATION',
    rumorEyebrow: 'RUMOR VERIFICATION'
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
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLength) return clean;
    return clean.slice(0, Math.max(0, maxLength - 3)).trim() + '...';
  }

  function getSharePayload(mode) {
    const title = article.title || labels.siteName;
    const excerpt = article.summary || '';
    const trackedUrl = getTrackedShareUrl();
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
    if (!target) return;
    if (target.disabled) return;
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
      --card-2: rgba(17,29,60,0.74);
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
      --bg: #efe0c4;
      --card: rgba(248,239,223,0.86);
      --card-2: rgba(243,231,210,0.84);
      --text: #312412;
      --muted: rgba(49,36,18,0.72);
      --line: rgba(49,36,18,0.12);
      --gold: #b2781f;
      --orange: #cb7b22;
      --cyan: #0f6db0;
      --summary-label: #0b6b87;
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
      --bg: #ecf4ff;
      --card: rgba(255,255,255,0.82);
      --card-2: rgba(246,249,255,0.86);
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
      --shadow: 0 20px 50px rgba(40,64,112,0
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

    .action-btn:hover,
    .action-btn:active,
    .tool-btn:hover,
    .tool-btn:active,
    .share-mode-btn:hover,
    .share-mode-btn:active,
    .share-card-btn:hover,
    .share-card-btn:active,
    .floating-accessibility-btn:hover,
    .floating-accessibility-btn:active,
    .modal-close:hover,
    .modal-close:active {
      transform: translateY(-1px);
    }

    .action-btn.primary {
      background: linear-gradient(90deg, rgba(242,181,58,0.28), rgba(255,141,58,0.24));
      border-color: rgba(242,181,58,0.42);
    }

    .action-btn svg {
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      display: block
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
      line-height: 1.6
