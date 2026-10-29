# numberstuff

WordPress plugin: loads Google Tag Manager only after the visitor accepts, pushes growth events to the dataLayer, counts consent choices anonymously, and keeps the GTM container and GA4 key events as code.

## Configure

Set in the environment or as `wp-config.php` constants:

- `NUMBERSTUFF_GTM_ID` — GTM container ID (`GTM-…`). Without it the plugin does nothing.
- `NUMBERSTUFF_PRIVACY_URL` — optional privacy policy URL (absolute or `/path/`).

Add `data-numberstuff-consent` to any link to reopen the banner.

Filters: `numberstuff_banner_text` changes the banner text; `numberstuff_privacy_url` receives the configured privacy URL (or `null`) and returns the one to link, for example a per-language page. Return `null` or an empty string for no link.

## Events

`generate_lead`, `file_download`, `language_switch`, `outbound_click`, `consent_choice` — pushed to `window.dataLayer`; GTM reads them only after consent.

## Develop

Prerequisites: Docker, Node 22.

```bash
npm install
npx wp-env start            # http://localhost:8888, admin/password
bin/wpenv-composer install
bin/phpunit && bin/phpcs
npx playwright install chromium && npx playwright test
```

## GTM and GA4

`gtm/container.json` describes the container; `gtm/targets.json` holds container and GA4 IDs per target. Uses Google Application Default Credentials (gcloud) with Tag Manager and Analytics scopes.

```bash
npm run gtm:apply -- dev --dry-run   # show differences against the live version
npm run gtm:apply -- dev             # sync a workspace and create a version
npm run gtm:publish -- dev <versionId>
```
