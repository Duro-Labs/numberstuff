window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
window.numberstuff = {
  gtmId: window.numberstuffGtmId,
  loaded: false,
  loadGtm: function () {
    if (this.loaded) { return; }
    this.loaded = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(this.gtmId);
    document.head.appendChild(s);
  },
  granted: function () {
    return !navigator.globalPrivacyControl && /(?:^|;\s*)numberstuff_consent=granted(?:;|$)/.test(document.cookie);
  },
  recheck: function () {
    if (window.numberstuff.loaded && !window.numberstuff.granted()) { location.reload(); }
  }
};
if (window.numberstuff.granted()) {
  gtag('consent','update',{analytics_storage:'granted'});
  window.numberstuff.loadGtm();
}
window.addEventListener('pageshow', window.numberstuff.recheck);
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') { window.numberstuff.recheck(); }
});
