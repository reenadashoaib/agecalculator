/*
 * Ad settings. This is the only file you need to edit to turn ads on.
 *
 * 1. Set `client` to your AdSense publisher ID (looks like "ca-pub-1234567890123456").
 * 2. In AdSense, create a display ad unit for each slot below and paste its
 *    data-ad-slot number into `slot`.
 *
 * Until `client` is set, every slot shows a grey placeholder with its size,
 * so you can check the layout before your account is approved.
 */
window.AD_CONFIG = {
  client: "",

  slots: {
    // Banner above the header on every page (728x90 desktop, responsive on mobile)
    top:           { slot: "", size: "728 × 90", format: "horizontal", responsive: true },
    // Banner above the footer on every page
    bottom:        { slot: "", size: "728 × 90", format: "horizontal", responsive: true },
    // Vertical banner, left side, screens 1400px and wider
    railLeft:      { slot: "", size: "160 × 600", format: "vertical" },
    // Right sidebar, screens 1024px and wider
    sidebarTop:    { slot: "", size: "300 × 250", format: "rectangle" },
    sidebarSticky: { slot: "", size: "300 × 600", format: "vertical" },
    // Grid of tile ads under the calculator
    tile1:         { slot: "", size: "300 × 250", format: "rectangle" },
    tile2:         { slot: "", size: "300 × 250", format: "rectangle" },
    tile3:         { slot: "", size: "300 × 250", format: "rectangle" },
    tile4:         { slot: "", size: "300 × 250", format: "rectangle" },
    // Inside the article text
    inArticle:     { slot: "", size: "Responsive", format: "fluid", layout: "in-article" },
    // Full-screen pop-up
    interstitial:  { slot: "", size: "Responsive", format: "auto" },
    // Bottom-right corner unit
    video:         { slot: "", size: "16 : 9", format: "auto" }
  },

  // Bottom-right corner video ad
  video: {
    enabled: true,
    showAfterSeconds: 5,
    // Optional: paste the embed code from a video ad network here (as a string).
    // When set it is used instead of the AdSense slot above.
    embedHtml: ""
  },

  // Full-screen pop-up ad. Shown at most once per browser session.
  interstitial: {
    enabled: true,
    // Show after the visitor's Nth calculation (0 turns this trigger off)
    afterCalculations: 2,
    // Show when the visitor clicks a link to another page on this site,
    // then continue to that page when the ad is closed
    onInternalLink: true,
    // Show after this many seconds on the page (0 turns this trigger off)
    afterSeconds: 0
  }
};
