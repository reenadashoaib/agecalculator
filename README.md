# Age Calculator

A static age calculator website with built-in ad slots for Google AdSense. Plain HTML, CSS and JavaScript, with no build step.

## What's in it

```
public/                 ← everything that gets deployed
  index.html            Calculator page
  about.html            About and contact page
  privacy.html          Privacy policy (covers AdSense cookies)
  404.html              "Page not found" page
  ads.txt               AdSense seller declaration (edit before going live)
  robots.txt, sitemap.xml
  _headers              Cloudflare security and cache headers
  assets/css/styles.css
  assets/js/ads-config.js   ← your AdSense IDs go here
  assets/js/ads.js          Renders the ad slots, corner video ad and pop-up ad
  assets/js/calculator.js   The age calculation
wrangler.jsonc          Cloudflare Workers deploy config
```

## Ad slots

| Slot name (in `ads-config.js`) | Where | Size | Shown on |
| --- | --- | --- | --- |
| `top` | Banner above the header | 728×90 (responsive on mobile) | All screens |
| `bottom` | Banner above the footer | 728×90 (responsive on mobile) | All screens |
| `railLeft` | Vertical banner, left side, sticky | 160×600 | 1400px and wider |
| `sidebarTop` | Right sidebar | 300×250 | 1024px and wider |
| `sidebarSticky` | Right sidebar, sticky | 300×600 | 1024px and wider |
| `tile1`–`tile4` | Tile grid under the calculator | 300×250 each | All screens |
| `inArticle` | Inside the article text | Responsive | All screens |
| `video` | Bottom-right corner, closable | 16:9 | All screens, after 5 seconds |
| `interstitial` | Full-screen pop-up, closable | Responsive | Once per visit |

The pop-up opens after the visitor's second calculation, or when they click a link to another page on the site (the page opens once they close the ad). Change these triggers in `ads-config.js`.

Until you add your publisher ID, each slot shows a grey placeholder with its size.

## Turn on AdSense

1. Deploy the site (below) and add your domain in AdSense.
2. Open `public/assets/js/ads-config.js` and set `client` to your publisher ID, for example `"ca-pub-1234567890123456"`.
3. In AdSense, go to **Ads → By ad unit**, create a display ad unit for each slot in the table above, and paste each unit's `data-ad-slot` number into that slot's `slot` field.
4. In `public/ads.txt`, replace `pub-0000000000000000` with your ID and delete the comment lines.
5. Replace `https://example.com` with your domain in every `<link rel="canonical">`, `robots.txt` and `sitemap.xml`, and replace `hello@example.com` in `about.html` and `privacy.html`.
6. For visitors in the EEA, UK and Switzerland, turn on a consent message in AdSense under **Privacy & messaging**.

### Video ads

AdSense doesn't offer a video unit you can place yourself, so the corner slot shows an AdSense display ad by default. If you sign up with a video ad network, paste its embed code into `video.embedHtml` in `ads-config.js` and it will be used instead.

### Before you go live

Google's ad policies and the [Better Ads Standards](https://www.betterads.org/standards/) restrict pop-ups and ad density, and Chrome can block every ad on a site that breaks them. In particular:

- AdSense doesn't allow its ads to be placed in pop-ups. For a full-screen ad, Google's own option is **Auto ads → Vignette ads** in AdSense. If you use that, set `interstitial.enabled` to `false` in `ads-config.js`.
- Too many ads compared with content can get a site rejected or limited. If approval is slow, try turning off some tiles first.

## Deploy on Cloudflare

**Option A: Cloudflare dashboard (no command line)**

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and pick this repository.
2. Leave the build command empty and set the build output directory to `public`.
3. Deploy, then add your domain under **Custom domains**.

**Option B: command line**

```bash
npx wrangler login
npx wrangler deploy
```

This uses `wrangler.jsonc` to publish the `public` folder as a Worker with static assets.

## Run locally

```bash
cd public
python3 -m http.server 8000
```

Then open http://localhost:8000.
