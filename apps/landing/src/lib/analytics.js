export function trackEvent(action, label, category, value) {
  if (!window.gtag) return;
  try {
    window.gtag("event", action, {
      event_category: category || "engagement",
      event_label: label || "",
      value: value || null,
    });
  } catch {}
}

export function trackFormSubmit(formName) {
  trackEvent("form_submit", formName, "engagement");
}

export function trackSearch(query) {
  trackEvent("search", query, "engagement");
}

export function trackCtaClick(ctaName, location) {
  trackEvent("cta_click", `${ctaName} - ${location}`, "engagement");
}

export function trackVideoPlay(videoTitle) {
  trackEvent("video_play", videoTitle, "engagement");
}

export function trackDownload(fileName) {
  trackEvent("download", fileName, "engagement");
}

export function trackChat(action) {
  trackEvent("chat", action, "engagement");
}

export function trackLogin(method) {
  trackEvent("login", method, "engagement");
}

export function trackLogout() {
  trackEvent("logout", "", "engagement");
}

export function trackPageView(path, title) {
  trackEvent("page_view", title || path, "navigation");
}

export function trackEnroll(courseName) {
  trackEvent("enroll", courseName, "engagement");
}

export function trackRegister(name) {
  trackEvent("register", name, "engagement");
}
