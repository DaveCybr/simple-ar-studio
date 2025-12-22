// analytics-tracking.js - Add this to AR viewer pages
// This script tracks user interactions and sends to analytics table

class ARAnalytics {
  constructor(projectId, supabaseUrl, supabaseAnonKey) {
    this.projectId = projectId;
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.scanCount = 0;
    this.deviceType = this.detectDevice();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad/i.test(ua)) return "tablet";
    if (/mobile|android|iphone/i.test(ua)) return "mobile";
    return "desktop";
  }

  async trackEvent(eventType, data = {}) {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/ar_analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAnonKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          project_id: this.projectId,
          session_id: this.sessionId,
          event_type: eventType,
          device_type: this.deviceType,
          user_agent: navigator.userAgent,
          marker_name: data.markerName || null,
          duration: data.duration || null,
          ...data,
        }),
      });

      if (!response.ok) {
        console.error("Analytics tracking failed:", response.statusText);
      }
    } catch (error) {
      console.error("Analytics error:", error);
    }
  }

  // Track page view
  trackView() {
    this.trackEvent("view");
  }

  // Track marker scan
  trackScan(markerName) {
    this.scanCount++;
    this.trackEvent("scan", { markerName });
  }

  // Track marker lost
  trackMarkerLost(markerName, duration) {
    this.trackEvent("marker_lost", { markerName, duration });
  }

  // Track session end
  trackSessionEnd() {
    const duration = Math.floor((Date.now() - this.sessionStart) / 1000);
    this.trackEvent("session_end", {
      duration,
      total_scans: this.scanCount,
    });
  }

  // Auto track on page unload
  init() {
    this.trackView();

    window.addEventListener("beforeunload", () => {
      this.trackSessionEnd();
    });

    // Track if page is hidden (mobile app switching)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.trackSessionEnd();
      }
    });
  }
}

// Usage example in AR viewer:
/*
// Initialize at page load
const analytics = new ARAnalytics(
  projectId,
  "https://your-project.supabase.co",
  "your-anon-key"
);
analytics.init();

// Track marker found
markerEntity.addEventListener("markerFound", () => {
  analytics.trackScan(markerName);
  markerFoundTime = Date.now();
});

// Track marker lost
markerEntity.addEventListener("markerLost", () => {
  const duration = Math.floor((Date.now() - markerFoundTime) / 1000);
  analytics.trackMarkerLost(markerName, duration);
});
*/
