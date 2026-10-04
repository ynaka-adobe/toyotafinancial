# AEM Block Collection

This project provides a foundation for starting an AEM Edge Delivery Services project. It includes many common blocks and features a project might need.

## DA compatible

This specific repo has been _slightly_ modified to be compatible with DA's live preview.

## Getting started

### 1. Github
1. Use this template to make a new repo.
1. Install [AEM Code Sync](https://github.com/apps/aem-code-sync).

### 2. DA content
1. Browse to https://da.live/start.
2. Follow the steps.

### 3. Local development
1. Clone your new repo to your computer.
1. Install the AEM CLI using your terminal: `sudo npm install -g @adobe/aem-cli`
1. Start the AEM CLI: `aem up`.
1. Open the `{repo}` folder in your favorite code editor and buil something.
1. **Recommended:** Install common npm packages like linting and testing: `npm i`.

## Embedding the header/footer in other apps

`scripts/aem-embed.js` defines `<aem-header>` and `<aem-footer>`, which render this site's header and footer blocks (Shadow DOM) on external sites such as the DSS app ([ynakagawa/toyotafinancial](https://github.com/ynakagawa/toyotafinancial)):

```html
<script type="module" src="https://main--toyotafinancial--ynaka-adobe.aem.live/scripts/aem-embed.js"></script>
<aem-header locale="/us/en" link-base="https://toyotafinancial.ynaka-adobe.com"></aem-header>
<aem-footer locale="/us/en" link-base="https://toyotafinancial.ynaka-adobe.com"></aem-footer>
```

Cross-origin hosts must be allowed in the site config `headers` (Admin API `config/ynaka-adobe/sites/toyotafinancial/headers.json`). Set `access-control-allow-origin` for `/nav.plain.html`, `/footer.plain.html`, `/**/nav.plain.html`, `/**/footer.plain.html`, `/scripts/**`, `/blocks/**` and `/styles/**`. It currently allows `https://dss.toyotafinancial.ynaka-adobe.com`. Other origins can use a same-origin proxy and the `base` attribute (e.g. `base="/aem"`).
