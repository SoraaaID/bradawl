// Runs as a classic blocking script in <head> so the stored theme is applied
// before the stylesheet paints. Kept external because Astro's CSP only hashes
// processed scripts, not <script is:inline>.
try {
  var t = localStorage.getItem("bw-theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
