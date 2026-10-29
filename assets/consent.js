(function () {
  'use strict';
  var COOKIE = 'numberstuff_consent';
  var MAX_AGE = 180 * 24 * 60 * 60;
  var config = window.numberstuffConfig;
  var banner = document.getElementById('numberstuff-banner');
  if (!config || !banner || !window.numberstuff) {
    return;
  }

  function readChoice() {
    var match = document.cookie.match(/(?:^|;\s*)numberstuff_consent=(granted|denied)(?:;|$)/);
    return match ? match[1] : null;
  }

  function writeChoice(choice) {
    document.cookie = COOKIE + '=' + choice + '; Max-Age=' + MAX_AGE + '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }

  function removeAnalyticsCookies() {
    var host = location.hostname;
    var domains = ['', host, '.' + host.replace(/^www\./, '')];
    document.cookie.split(';').forEach(function (pair) {
      var name = pair.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0) {
        return;
      }
      domains.forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; Path=/' + (domain ? '; Domain=' + domain : '');
      });
    });
  }

  function report(choice) {
    try {
      fetch(config.counterUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: choice }),
        keepalive: true,
        credentials: 'omit'
      }).catch(function () {});
    } catch (e) {}
  }

  function choose(choice) {
    var previous = readChoice();
    writeChoice(choice);
    banner.hidden = true;
    if (previous === null) {
      report(choice);
    }
    if (choice === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
      window.numberstuff.loadGtm();
      window.dataLayer.push({ event: 'consent_choice', choice: 'granted' });
      return;
    }
    if (previous === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      removeAnalyticsCookies();
      location.reload();
    }
  }

  if (navigator.globalPrivacyControl) {
    return;
  }

  banner.addEventListener('click', function (event) {
    var button = event.target.closest('[data-numberstuff-choice]');
    if (button) {
      choose(button.getAttribute('data-numberstuff-choice'));
    }
  });

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-numberstuff-consent]');
    if (opener) {
      event.preventDefault();
      banner.hidden = false;
    }
  });

  if (readChoice() === null) {
    banner.hidden = false;
  }
})();
