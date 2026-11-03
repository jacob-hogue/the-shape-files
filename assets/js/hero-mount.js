/* Mounts a HeroScene banner into every element with class sf-hero-mount.
   Attributes: data-height, data-seed, data-shift, data-title, data-layers (JSON, top layer first). */
(function () {
  function mount() {
    var S = window.ShapeFiles;
    if (!S || !window.React || !window.ReactDOM) return;
    document.querySelectorAll(".sf-hero-mount").forEach(function (el) {
      if (el.dataset.mounted) return;
      el.dataset.mounted = "1";
      var props = { height: Number(el.dataset.height || 320), seed: Number(el.dataset.seed || 7) };
      if (el.dataset.shift) props.shift = Number(el.dataset.shift);
      if (el.dataset.title) props.title = el.dataset.title;
      try { if (el.dataset.layers) props.layers = JSON.parse(el.dataset.layers); } catch (e) { /* fall back to the default stack */ }
      if (el.dataset.stack) {
        /* "ext, role, motif[, subject]; ..." with the top layer first */
        props.layers = el.dataset.stack.split(";").map(function (part) {
          var f = part.split(",").map(function (x) { return x.trim(); });
          var L = { role: f[1], motif: f[2], subject: f[3] === "subject" };
          if (f[0].charAt(0) === "=") L.label = f[0].slice(1); else L.ext = f[0];   /* "=word" draws a plain label instead of a file extension */
          return L;
        }).filter(function (L) { return L.ext || L.label; });
      }
      ReactDOM.createRoot(el).render(React.createElement(S.HeroScene, props));
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
