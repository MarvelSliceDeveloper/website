let isInitialized = false;
let activeMeasurementId = null;

/**
 * Initializes Google Analytics 4 (GA4) dynamically.
 * @param {string} measurementId - E.g., 'G-XXXXXXXXXX'
 */
export function initAnalytics(measurementId) {
  const id = measurementId || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GA_MEASUREMENT_ID : null);
  if (!id || typeof window === 'undefined') return;

  activeMeasurementId = id.trim();
  if (isInitialized && window.gtag) return;

  // Initialize dataLayer & gtag function
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', activeMeasurementId, {
    send_page_view: false, // Managed manually in React Router SPA
    cookie_flags: 'SameSite=None;Secure',
  });

  // Inject Google Tag script if not already present
  const scriptId = 'google-analytics-script';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(activeMeasurementId)}`;
    document.head.appendChild(script);
  }

  isInitialized = true;
}

/**
 * Generic GA4 Event Sender
 */
export function trackEvent(action, params = {}, category = 'engagement') {
  if (typeof window === 'undefined' || !window.gtag) return;
  try {
    const payload = typeof params === 'string' 
      ? { event_label: params, event_category: category } 
      : { event_category: category, ...params };
    window.gtag('event', action, payload);
  } catch (err) {
    console.debug('GA4 tracking error:', err);
  }
}

/**
 * Page Views (SPA Navigation)
 */
export function trackPageView(path, title) {
  if (typeof window === 'undefined') return;
  const pageTitle = title || document.title;
  const pagePath = path || window.location.pathname;

  if (window.gtag && activeMeasurementId) {
    try {
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_path: pagePath,
        page_location: window.location.href,
        send_to: activeMeasurementId,
      });
    } catch {}
  } else {
    trackEvent('page_view', { page_title: pageTitle, page_path: pagePath }, 'navigation');
  }
}

/**
 * Form Submissions (Lead Generation)
 */
export function trackFormSubmit(formName, metadata = {}) {
  trackEvent('generate_lead', {
    form_name: formName,
    ...metadata
  }, 'leads');
  trackEvent('form_submit', { form_name: formName, ...metadata }, 'forms');
}

/**
 * PDF Brochure & Asset Downloads
 */
export function trackDownload(fileName, fileType = 'brochure_pdf') {
  trackEvent('file_download', {
    file_name: fileName,
    file_extension: 'pdf',
    file_type: fileType,
    link_text: `Download ${fileName}`
  }, 'downloads');
}

/**
 * Call-to-Action & Button Clicks
 */
export function trackCtaClick(ctaName, location = 'page') {
  trackEvent('cta_click', {
    cta_name: ctaName,
    cta_location: location
  }, 'engagement');
}

/**
 * Phone Number Clicks (tel: links)
 */
export function trackPhoneClick(phone, location = 'header') {
  trackEvent('contact_click', {
    contact_method: 'phone',
    contact_value: phone,
    location
  }, 'leads');
}

/**
 * Email Clicks (mailto: links)
 */
export function trackEmailClick(email, location = 'footer') {
  trackEvent('contact_click', {
    contact_method: 'email',
    contact_value: email,
    location
  }, 'leads');
}

/**
 * Social Media Clicks
 */
export function trackSocialClick(platform, url) {
  trackEvent('social_click', {
    platform,
    target_url: url
  }, 'engagement');
}

/**
 * Course View (GA4 view_item)
 */
export function trackCourseView(courseName, category = '') {
  trackEvent('view_item', {
    item_name: courseName,
    item_category: category,
    content_type: 'course'
  }, 'courses');
}

/**
 * Course Enrollment / Admission Click
 */
export function trackEnroll(courseName, category = '') {
  trackEvent('begin_checkout', {
    item_name: courseName,
    item_category: category,
    content_type: 'enrollment'
  }, 'conversions');
  trackEvent('enroll_click', { course_name: courseName, category }, 'conversions');
}

/**
 * Internal Search Queries
 */
export function trackSearch(query, resultCount = null) {
  trackEvent('search', {
    search_term: query,
    result_count: resultCount
  }, 'search');
}

/**
 * Live Chat Telemetry
 */
export function trackChat(action, details = {}) {
  trackEvent('chat_interaction', {
    chat_action: action, // 'open', 'start_conversation', 'send_message', 'rate'
    ...details
  }, 'chat');
}

/**
 * Tab Switching (Courses, Banking, FAQs)
 */
export function trackTabClick(tabName, section = 'tabs') {
  trackEvent('select_tab', {
    tab_name: tabName,
    section
  }, 'navigation');
}

/**
 * Video Plays
 */
export function trackVideoPlay(videoTitle) {
  trackEvent('video_play', {
    video_title: videoTitle
  }, 'media');
}

/**
 * Auth Telemetry
 */
export function trackLogin(method = 'admin') {
  trackEvent('login', { method }, 'auth');
}

export function trackLogout() {
  trackEvent('logout', { method: 'admin' }, 'auth');
}

export function trackRegister(name) {
  trackEvent('register', { name }, 'conversions');
}

