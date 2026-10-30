(function () {
  'use strict';
  window.dataLayer = window.dataLayer || [];

  function push(event, params) {
    window.dataLayer.push(Object.assign({ event: event }, params));
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link) {
      return;
    }
    var url;
    try {
      url = new URL(link.getAttribute('href'), location.href);
    } catch (e) {
      return;
    }
    if (link.closest('.lang-item')) {
      push('language_switch', { language_from: document.documentElement.lang, language_to: link.getAttribute('lang') || '' });
      return;
    }
    if (/\.pdf$/i.test(url.pathname)) {
      push('file_download', { file_name: url.pathname.split('/').pop(), link_url: url.href });
      return;
    }
    if (url.protocol === 'mailto:' || (/^https?:$/.test(url.protocol) && url.hostname !== location.hostname)) {
      push('outbound_click', { link_url: url.href });
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.jQuery) {
      return;
    }
    window.jQuery(document).on('wpformsAjaxSubmitSuccess', function (event) {
      push('generate_lead', { form_id: String(event.target.getAttribute('data-formid') || '') });
    });
  });
})();
