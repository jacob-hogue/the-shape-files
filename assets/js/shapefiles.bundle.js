/* @ds-bundle: {"format":4,"namespace":"ShapeFiles","components":[{"name":"HeroScene"},{"name":"Figure"},{"name":"Legend"},{"name":"IsoFeatures"},{"name":"LayerStack"},{"name":"FileSet"},{"name":"GeometrySketch"},{"name":"ByteLayout"},{"name":"Timeline"},{"name":"EvidenceBadge"},{"name":"ClaimTag"},{"name":"Callout"},{"name":"ArticleCard"},{"name":"PrereqPanel"},{"name":"Button"},{"name":"Glyph"}]} */
(function () {
  "use strict";
  var R = window.React, h = R.createElement;
  var C30 = Math.cos(Math.PI / 6), S30 = 0.5;

  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(" "); }
  function f2(n) { return Math.round(n * 100) / 100; }
  function pts(arr) { return arr.map(function (p) { return f2(p[0]) + "," + f2(p[1]); }).join(" "); }
  function omit(o, keys) { var r = {}; for (var k in o) { if (keys.indexOf(k) < 0) r[k] = o[k]; } return r; }
  /* true isometric: x runs down-right, y runs down-left, z up */
  function iso(x, y, z, u) { return [(x - y) * C30 * u, (x + y) * S30 * u - (z || 0) * u]; }
  function bounds(list) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    list.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); });
    return b;
  }
  function svgBox(b, pad, extraRight, extraTop) {
    var x = b[0] - pad, y = b[1] - pad - (extraTop || 0);
    var w = b[2] - b[0] + pad * 2 + (extraRight || 0), hgt = b[3] - b[1] + pad * 2 + (extraTop || 0);
    return { viewBox: [f2(x), f2(y), f2(w), f2(hgt)].join(" "), w: w, h: hgt };
  }

  /* ---------- Glyph ---------- */
  var GLYPHS = {
    point: [["circle", { cx: 12, cy: 12, r: 3.5, fill: "currentColor", stroke: "none" }]],
    line: [["polyline", { points: "4,17 9,9 15,14 20,6" }], ["circle", { cx: 4, cy: 17, r: 2 }], ["circle", { cx: 20, cy: 6, r: 2 }]],
    polygon: [["polygon", { points: "5,8 12,4 19,9 17,19 7,18" }]],
    raster: [["rect", { x: 4, y: 4, width: 16, height: 16 }], ["path", { d: "M9.33 4v16M14.67 4v16M4 9.33h16M4 14.67h16" }], ["rect", { x: 4, y: 4, width: 5.33, height: 5.33, fill: "currentColor" }], ["rect", { x: 14.67, y: 9.33, width: 5.33, height: 5.33, fill: "currentColor" }], ["rect", { x: 9.33, y: 14.67, width: 5.33, height: 5.33, fill: "currentColor" }]],
    node: [["circle", { cx: 12, cy: 12, r: 5 }]],
    vertex: [["rect", { x: 7.5, y: 7.5, width: 9, height: 9 }]],
    layer: [["polygon", { points: "12,4 21,9 12,14 3,9" }], ["polyline", { points: "3,13 12,18 21,13" }], ["polyline", { points: "3,17 12,22 21,17" }]],
    file: [["path", { d: "M6 3h8l4 4v14H6z" }], ["path", { d: "M14 3v4h4" }]],
    table: [["rect", { x: 3.5, y: 5, width: 17, height: 14 }], ["path", { d: "M3.5 10h17M3.5 14.5h17M10 5v14" }]],
    graticule: [["circle", { cx: 12, cy: 12, r: 8.5 }], ["path", { d: "M3.5 12h17M5 7.5h14M5 16.5h14M12 3.5c-3.2 2.6-3.2 14.4 0 17M12 3.5c3.2 2.6 3.2 14.4 0 17" }]],
    index: [["rect", { x: 3.5, y: 3.5, width: 17, height: 17 }], ["rect", { x: 6, y: 6, width: 7, height: 6 }], ["rect", { x: 11, y: 11, width: 7, height: 7 }]],
    network: [["path", { d: "M6 7l6 10 6-10M6 7h12" }], ["circle", { cx: 6, cy: 7, r: 2 }], ["circle", { cx: 18, cy: 7, r: 2 }], ["circle", { cx: 12, cy: 17, r: 2 }]],
    axis: [["path", { d: "M5 19V5M5 19h14M5 5l-2 3M5 5l2 3M19 19l-3-2M19 19l-3 2" }], ["rect", { x: 10, y: 9, width: 4, height: 4, fill: "currentColor", stroke: "none" }]],
    stack: [["polygon", { points: "12,3 21,8 12,13 3,8", fill: "currentColor" }], ["polyline", { points: "3,12 12,17 21,12" }], ["polyline", { points: "3,16 12,21 21,16" }]],
    mark: [["polygon", { points: "12,3 18.3,6.5 18.3,9.5 12,13 3,8", fill: "currentColor" }], ["polygon", { points: "18.3,6.5 15.6,8 18.3,9.5" }], ["polyline", { points: "3,12 12,17 21,12" }], ["polyline", { points: "3,16 12,21 21,16" }]]
  };
  function Glyph(p) {
    var parts = GLYPHS[p.name] || GLYPHS.point, size = p.size || 20;
    return h("svg", {
      className: cx("sf-glyph", p.className), width: size, height: size, viewBox: "0 0 24 24", fill: "none",
      stroke: "currentColor", strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round",
      role: p.title ? "img" : undefined, "aria-label": p.title || undefined, "aria-hidden": p.title ? undefined : "true", focusable: "false"
    }, parts.map(function (e, i) { return h(e[0], Object.assign({ key: i }, e[1])); }));
  }
  Glyph.names = Object.keys(GLYPHS);

  /* ---------- Button ---------- */
  function Button(p) {
    var rest = omit(p, ["variant", "className", "glyph", "children"]);
    return h("button", Object.assign({ type: "button" }, rest, { className: cx("sf-btn", "sf-btn-" + (p.variant || "quiet"), p.className) }),
      p.glyph ? h(Glyph, { name: p.glyph, size: 16 }) : null, p.children);
  }

  /* ---------- Evidence ---------- */
  var LEVELS = { "E": "Examined", "E-auto": "Examined, automated", "S": "Secondary", "L": "Located", "U": "Unlocated" };
  function LevelMark(p) {
    var l = LEVELS[p.level] ? p.level : "U", s = p.size || 10, k = [];
    var frame = { x: 0.75, y: 0.75, width: 8.5, height: 8.5 };
    if (l === "E") k.push(h("rect", Object.assign({ key: "f", className: "sf-lm-fill" }, frame)));
    else {
      k.push(h("rect", Object.assign({ key: "o", className: cx("sf-lm-line", l === "U" && "sf-lm-dash") }, frame)));
      if (l === "E-auto") k.push(h("path", { key: "h", d: "M0.75 9.25L9.25 0.75V9.25Z", className: "sf-lm-fill" }));
      if (l === "S") k.push(h("rect", { key: "c", x: 3.5, y: 3.5, width: 3, height: 3, className: "sf-lm-fill" }));
    }
    return h("svg", { className: cx("sf-lm", p.subject && "sf-lm-subject"), width: s, height: s, viewBox: "0 0 10 10", "aria-hidden": "true", focusable: "false" }, k);
  }
  function EvidenceBadge(p) {
    var l = LEVELS[p.level] ? p.level : "U";
    return h("span", { className: cx("sf-ev", p.className), title: LEVELS[l] },
      h(LevelMark, { level: l }), h("span", { className: "sf-ev-code" }, l),
      p.showLabel === false ? null : h("span", { className: "sf-ev-label" }, p.label || LEVELS[l]));
  }
  var CLAIMS = { fact: "Fact", interpretation: "Interpretation", opinion: "Opinion" };
  function ClaimTag(p) {
    var k = CLAIMS[p.kind] ? p.kind : "fact";
    return h("span", { className: cx("sf-claim", "sf-claim-" + k, p.className) },
      p.id ? h("span", { className: "sf-claim-id" }, p.id) : null, h("span", null, CLAIMS[k]));
  }

  /* ---------- Callout ---------- */
  var CALLOUT = {
    note: "Note", reconstruction: "Historical reconstruction", illustrative: "Illustrative code, not executed",
    executed: "Executed", correction: "Correction"
  };
  var CALLOUT_ICON = {
    executed: "M3 8.5l3 3 7-7", correction: "M8 3v6M8 12.5v.5", reconstruction: "M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v2.6h2.6M8 5v3l2 1.5",
    illustrative: "M5.5 4L2 8l3.5 4M10.5 4L14 8l-3.5 4", note: "M8 7.5v4.5M8 4.5v.5"
  };
  function Callout(p) {
    var k = CALLOUT[p.kind] ? p.kind : "note";
    return h("aside", { className: cx("sf-callout", "sf-callout-" + k, p.className), "aria-label": p.title || CALLOUT[k] },
      h("div", { className: "sf-callout-head" },
        h("span", { className: "sf-callout-kind" },
          h("svg", { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, h("path", { d: CALLOUT_ICON[k] })),
          CALLOUT[k]),
        p.meta ? h("span", { className: "sf-callout-meta" }, p.meta) : null),
      p.title ? h("p", { className: "sf-callout-title" }, p.title) : null,
      h("div", { className: "sf-callout-body" }, p.children));
  }

  /* ---------- Figure + Legend ---------- */
  function Figure(p) {
    var t = p.ticks || {};
    var meta = [p.crs, p.scale, p.source].filter(Boolean).join(" · ");
    return h("figure", { className: cx("sf-fig", p.className) },
      (p.number != null || p.title) ? h("div", { className: "sf-fig-head" },
        p.number != null ? h("span", { className: "sf-fig-num" }, "Fig. " + p.number) : null,
        p.title ? h("span", { className: "sf-fig-title" }, p.title) : null) : null,
      h("div", { className: "sf-fig-frame" },
        ["tl", "tr", "bl", "br"].map(function (c) {
          return h("span", { key: c, className: "sf-fig-corner sf-fig-" + c, "aria-hidden": "true" }, t[c] ? h("span", { className: "sf-fig-tick" }, t[c]) : null);
        }),
        h("div", { className: "sf-fig-body" }, p.children)),
      (p.caption || meta || p.legend) ? h("figcaption", { className: "sf-fig-cap" },
        p.legend ? h(Legend, { items: p.legend }) : null,
        p.caption ? h("span", { className: "sf-fig-captext" }, p.caption) : null,
        meta ? h("span", { className: "sf-fig-meta" }, meta) : null) : null);
  }
  function Swatch(p) {
    var k = p.kind || "context", e;
    var sq = { x: 1.5, y: 1.5, width: 13, height: 13 };
    if (k === "subject") e = [h("rect", Object.assign({ key: 1, className: "sf-sw-subject" }, sq))];
    else if (k === "subject-area") e = [h("rect", Object.assign({ key: 1, className: "sf-sk-poly-subject" }, sq))];
    else if (k === "contrast") e = [h("rect", Object.assign({ key: 1, className: "sf-sw-contrast" }, sq))];
    else if (k === "hatch") e = [h("rect", Object.assign({ key: 1, className: "sf-sw-context" }, sq)), h("path", { key: 2, className: "sf-sw-hatch", d: "M1.5 6.5L6.5 1.5M1.5 11.5L11.5 1.5M1.5 14.5L14.5 1.5M4.5 14.5L14.5 4.5M9.5 14.5L14.5 9.5" })];
    else if (k === "vertex") e = [h("rect", { key: 1, className: "sf-vertex", x: 4.5, y: 4.5, width: 7, height: 7 })];
    else if (k === "node") e = [h("circle", { key: 1, className: "sf-node", cx: 8, cy: 8, r: 4.5 })];
    else if (k === "line-subject") e = [h("path", { key: 1, className: "sf-sk-line-subject", d: "M1 12L6 6l4 3 5-6" })];
    else if (k === "line-context") e = [h("path", { key: 1, className: "sf-sk-line-context", d: "M1 12L6 6l4 3 5-6" })];
    else if (k === "optional") e = [h("rect", Object.assign({ key: 1, className: "sf-sw-optional" }, sq))];
    else e = [h("rect", Object.assign({ key: 1, className: "sf-sw-context" }, sq))];
    return h("svg", { className: "sf-swatch", width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false" }, e);
  }
  function Legend(p) {
    return h("ul", { className: cx("sf-legend", p.className), "aria-label": p.title || "Legend" },
      (p.items || []).map(function (it, i) { return h("li", { key: i, className: "sf-legend-item" }, h(Swatch, { kind: it.kind }), h("span", null, it.label)); }));
  }

  /* ---------- IsoFeatures: extruded features on a ground plane ---------- */
  function IsoFeatures(p) {
    var u = p.unit || 26, cols = p.cols || 8, rows = p.rows || 6, feats = (p.features || []).slice();
    var ground = [iso(0, 0, 0, u), iso(cols, 0, 0, u), iso(cols, rows, 0, u), iso(0, rows, 0, u)];
    var all = ground.slice();
    feats.forEach(function (f) { all.push(iso(f.x, f.y, f.h || 0, u)); all.push(iso(f.x + f.w, f.y, f.h || 0, u)); });
    var hasLabel = feats.some(function (f) { return f.label; });
    var box = svgBox(bounds(all), 14, 0, hasLabel ? 30 : 0);
    var kids = [h("polygon", { key: "g", className: "sf-ground", points: pts(ground) })];
    if (p.showGrid !== false) {
      var d = "", i, a, b;
      for (i = 1; i < cols; i++) { a = iso(i, 0, 0, u); b = iso(i, rows, 0, u); d += "M" + f2(a[0]) + " " + f2(a[1]) + "L" + f2(b[0]) + " " + f2(b[1]); }
      for (i = 1; i < rows; i++) { a = iso(0, i, 0, u); b = iso(cols, i, 0, u); d += "M" + f2(a[0]) + " " + f2(a[1]) + "L" + f2(b[0]) + " " + f2(b[1]); }
      kids.push(h("path", { key: "grid", className: "sf-grid", d: d }));
    }
    feats.sort(function (A, B) { var fa = (A.h || 0) > 0 ? 1 : 0, fb = (B.h || 0) > 0 ? 1 : 0; if (fa !== fb) return fa - fb; return (A.x + A.y + (A.w + A.d) / 2) - (B.x + B.y + (B.w + B.d) / 2); });
    var labels = [];
    feats.forEach(function (f, n) {
      var z = f.h || 0, s = f.role === "subject" ? "subject" : "ctx", x2 = f.x + f.w, y2 = f.y + f.d;
      var top = [iso(f.x, f.y, z, u), iso(x2, f.y, z, u), iso(x2, y2, z, u), iso(f.x, y2, z, u)];
      if (z > 0) {
        kids.push(h("polygon", { key: n + "l", className: "sf-face sf-" + s + "-left", points: pts([iso(f.x, y2, 0, u), iso(x2, y2, 0, u), iso(x2, y2, z, u), iso(f.x, y2, z, u)]) }));
        kids.push(h("polygon", { key: n + "r", className: "sf-face sf-" + s + "-right", points: pts([iso(x2, f.y, 0, u), iso(x2, y2, 0, u), iso(x2, y2, z, u), iso(x2, f.y, z, u)]) }));
      }
      kids.push(h("polygon", { key: n + "t", className: "sf-face sf-" + s + "-top", points: pts(top) }));
      if (s === "subject" && p.showVertices !== false) {
        top.forEach(function (c, j) { kids.push(h("rect", { key: n + "v" + j, className: "sf-vertex sf-vertex-subject", x: f2(c[0] - 3.5), y: f2(c[1] - 3.5), width: 7, height: 7 })); });
      }
      if (f.label) {
        var tp = top[0];
        labels.push(h("g", { key: n + "lab" },
          h("path", { className: "sf-leader", d: "M" + f2(tp[0]) + " " + f2(tp[1] - 6) + "V" + f2(tp[1] - 22) }),
          h("text", { className: cx("sf-anno", s === "subject" ? "sf-anno-subject" : "", "sf-halo"), x: f2(tp[0] + 4), y: f2(tp[1] - 24) }, f.label)));
      }
    });
    return h("svg", {
      className: cx("sf-draw", p.className), viewBox: box.viewBox, width: p.width || f2(box.w), role: "img",
      "aria-label": p.title || "Isometric drawing of features on a ground plane", style: { maxWidth: "100%", height: "auto" }
    }, kids.concat(labels));
  }

  /* ---------- LayerStack: exploded GIS layers with data-type motifs ---------- */
  var MOTIF = {
    points: [[0.2, 0.3], [0.35, 0.7], [0.55, 0.25], [0.6, 0.6], [0.8, 0.4], [0.75, 0.82], [0.3, 0.5]],
    lines: [[[0.1, 0.8], [0.35, 0.55], [0.5, 0.6], [0.9, 0.2]], [[0.15, 0.25], [0.4, 0.35], [0.6, 0.9]]],
    polygons: [[[0.12, 0.15], [0.45, 0.12], [0.5, 0.45], [0.18, 0.5]], [[0.55, 0.55], [0.88, 0.5], [0.85, 0.88], [0.6, 0.85]], [[0.52, 0.12], [0.85, 0.18], [0.7, 0.42]]]
  };
  function LayerStack(p) {
    var layers = (p.layers || []).slice().reverse(); // bottom first for painting
    var S = p.size || 6, u = p.unit || 24, gap = p.gap || 2.9, th = 0.22, n = layers.length;
    var all = [];
    for (var i = 0; i < n; i++) { all.push(iso(0, 0, i * gap + th, u), iso(S, S, i * gap, u), iso(S, 0, i * gap, u), iso(0, S, i * gap, u)); }
    var b = bounds(all), labelX = b[2] + 28;
    var box = svgBox([b[0], b[1], labelX + (p.labelWidth || 150), b[3]], 12);
    var kids = [];
    layers.forEach(function (L, i) {
      var z = i * gap, s = L.role === "subject" ? "subject" : "ctx";
      var top = [iso(0, 0, z + th, u), iso(S, 0, z + th, u), iso(S, S, z + th, u), iso(0, S, z + th, u)];
      kids.push(h("polygon", { key: i + "l", className: "sf-face sf-" + s + "-left", points: pts([iso(0, S, z, u), iso(S, S, z, u), iso(S, S, z + th, u), iso(0, S, z + th, u)]) }));
      kids.push(h("polygon", { key: i + "r", className: "sf-face sf-" + s + "-right", points: pts([iso(S, 0, z, u), iso(S, S, z, u), iso(S, S, z + th, u), iso(S, 0, z + th, u)]) }));
      kids.push(h("polygon", { key: i + "t", className: "sf-face sf-" + s + "-top", points: pts(top) }));
      var mc = "sf-motif sf-motif-" + s, zz = z + th;
      var P = function (q) { return iso(q[0] * S, q[1] * S, zz, u); };
      if (L.motif === "points") MOTIF.points.forEach(function (q, j) { var c = P(q); kids.push(h("circle", { key: i + "p" + j, className: mc + " sf-motif-fill", cx: f2(c[0]), cy: f2(c[1]), r: 2.6 })); });
      if (L.motif === "lines") MOTIF.lines.forEach(function (ln, j) { kids.push(h("polyline", { key: i + "n" + j, className: mc + " sf-motif-stroke", points: pts(ln.map(P)) })); });
      if (L.motif === "polygons") MOTIF.polygons.forEach(function (pg, j) { kids.push(h("polygon", { key: i + "g" + j, className: mc + " sf-motif-stroke", points: pts(pg.map(P)) })); });
      if (L.motif === "raster") {
        var cells = 5, fillMap = [1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0];
        for (var r = 0; r < cells; r++) for (var c = 0; c < cells; c++) {
          if (!fillMap[r * cells + c]) continue;
          var u0 = c / cells, v0 = r / cells, w = 1 / cells;
          kids.push(h("polygon", { key: i + "c" + r + "-" + c, className: mc + " sf-motif-cell", points: pts([[u0, v0], [u0 + w, v0], [u0 + w, v0 + w], [u0, v0 + w]].map(P)) }));
        }
      }
      var rc = iso(S, 0, zz, u);
      kids.push(h("path", { key: i + "ld", className: "sf-leader", d: "M" + f2(rc[0] + 6) + " " + f2(rc[1]) + "H" + f2(labelX - 6) }));
      kids.push(h("text", { key: i + "t1", className: cx("sf-anno-strong", s === "subject" && "sf-anno-subject"), x: f2(labelX), y: f2(rc[1] - 2) }, L.label));
      if (L.sublabel) kids.push(h("text", { key: i + "t2", className: "sf-anno", x: f2(labelX), y: f2(rc[1] + 14) }, L.sublabel));
    });
    return h("svg", {
      className: cx("sf-draw", p.className), viewBox: box.viewBox, width: p.width || f2(box.w), role: "img",
      "aria-label": p.title || ("Layer stack: " + (p.layers || []).map(function (L) { return L.label; }).join(", ")), style: { maxWidth: "100%", height: "auto" }
    }, kids);
  }

  /* ---------- FileSet: a multi-file format as isometric tiles ---------- */
  function FileSet(p) {
    var files = p.files || [], u = p.unit || 22, W = 3.2, D = 4, gap = 0.7, th = 0.3;
    var all = [];
    files.forEach(function (f, i) { var x = i * (W + gap); all.push(iso(x, 0, th, u), iso(x + W, D, 0, u), iso(x + W, 0, th, u), iso(x, D, 0, u)); });
    var box = svgBox(bounds(all.length ? all : [[0, 0]]), 14);
    var kids = [];
    files.forEach(function (f, i) {
      var x = i * (W + gap), x2 = x + W, s = f.subject ? "subject" : (f.required === false ? "opt" : "ctx");
      kids.push(h("polygon", { key: i + "l", className: "sf-face sf-" + s + "-left", points: pts([iso(x, D, 0, u), iso(x2, D, 0, u), iso(x2, D, th, u), iso(x, D, th, u)]) }));
      kids.push(h("polygon", { key: i + "r", className: "sf-face sf-" + s + "-right", points: pts([iso(x2, 0, 0, u), iso(x2, D, 0, u), iso(x2, D, th, u), iso(x2, 0, th, u)]) }));
      kids.push(h("polygon", { key: i + "t", className: "sf-face sf-" + s + "-top", points: pts([iso(x, 0, th, u), iso(x2, 0, th, u), iso(x2, D, th, u), iso(x, D, th, u)]) }));
      kids.push(h("polygon", { key: i + "e", className: "sf-dogear sf-dogear-" + s, points: pts([iso(x2 - 0.8, 0, th, u), iso(x2, 0.8, th, u), iso(x2 - 0.8, 0.8, th, u)]) }));
      var o = iso(x, 0, th, u);
      var m = [C30 * u, S30 * u, -C30 * u, S30 * u, o[0], o[1]].map(f2).join(" ");
      kids.push(h("g", { key: i + "txt", transform: "matrix(" + m + ")" },
        h("text", { className: cx("sf-plane-ext", "sf-plane-" + s), x: 0.45, y: 1.6, fontSize: 0.95 }, "." + f.ext),
        f.role ? h("text", { className: cx("sf-plane-role", "sf-plane-" + s), x: 0.47, y: 2.35, fontSize: 0.46 }, f.role) : null,
        f.required === false ? h("text", { className: cx("sf-plane-role", "sf-plane-" + s), x: 0.47, y: 3.4, fontSize: 0.4 }, "optional") : null));
    });
    return h("svg", {
      className: cx("sf-draw", p.className), viewBox: box.viewBox, width: p.width || f2(box.w), role: "img",
      "aria-label": p.title || ((p.name || "dataset") + ": " + files.map(function (f) { return "." + f.ext + (f.required === false ? " (optional)" : ""); }).join(", ")),
      style: { maxWidth: "100%", height: "auto" }
    }, kids);
  }

  /* ---------- GeometrySketch: plan-view features with vertices and nodes ---------- */
  function GeometrySketch(p) {
    var W = p.width || 480, H = p.height || 280, kids = [];
    if (p.grid !== false) {
      var d = "", g = p.gridPitch || 24, i;
      for (i = g; i < W; i += g) d += "M" + i + " 0V" + H;
      for (i = g; i < H; i += g) d += "M0 " + i + "H" + W;
      kids.push(h("rect", { key: "bg", className: "sf-ground-flat", x: 0, y: 0, width: W, height: H }));
      kids.push(h("path", { key: "grid", className: "sf-grid", d: d }));
    }
    var marks = [], labels = [];
    (p.shapes || []).forEach(function (s, n) {
      var role = s.role === "subject" ? "subject" : (s.role === "contrast" ? "contrast" : "context"), c = s.coords || [];
      if (s.type === "polygon") kids.push(h("polygon", { key: n, className: "sf-sk-poly-" + role, points: pts(c) }));
      else if (s.type === "line") kids.push(h("polyline", { key: n, className: "sf-sk-line-" + role, points: pts(c) }));
      else c.forEach(function (q, j) { marks.push(h("circle", { key: n + "pt" + j, className: "sf-sk-point-" + role, cx: q[0], cy: q[1], r: role === "subject" ? 4.5 : 3.5 })); });
      if (s.type !== "point" && (s.vertices || (p.showVertices && s.vertices !== false))) {
        c.forEach(function (q, j) {
          var end = s.type === "line" && (j === 0 || j === c.length - 1);
          if (end && p.showNodes !== false) marks.push(h("circle", { key: n + "n" + j, className: "sf-node" + (role === "subject" ? " sf-node-subject" : ""), cx: q[0], cy: q[1], r: 4.5 }));
          else marks.push(h("rect", { key: n + "v" + j, className: "sf-vertex" + (role === "subject" ? " sf-vertex-subject" : ""), x: q[0] - 3.5, y: q[1] - 3.5, width: 7, height: 7 }));
        });
      }
      if (s.label) {
        var at = s.labelAt;
        if (!at) { var sx = 0, sy = 0; c.forEach(function (q) { sx += q[0]; sy += q[1]; }); at = [sx / c.length, sy / c.length]; }
        labels.push(h("text", { key: n + "lab", className: cx("sf-anno sf-halo", role === "subject" && "sf-anno-subject", role === "contrast" && "sf-anno-contrast"), x: at[0], y: at[1], textAnchor: s.anchor || "middle" }, s.label));
      }
    });
    return h("svg", {
      className: cx("sf-draw sf-sketch", p.className), viewBox: "0 0 " + W + " " + H, width: W, role: "img",
      "aria-label": p.title || "Plan-view sketch of geometries", style: { maxWidth: "100%", height: "auto" }
    }, kids.concat(marks, labels));
  }

  /* ---------- ByteLayout ---------- */
  function hex(n) { var s = n.toString(16); return "0x" + (s.length < 2 ? "0" + s : s); }
  function ByteLayout(p) {
    var scale = p.scale || 9, min = p.minWidth || 104;
    return h("div", { className: cx("sf-bytes", p.className), role: "table", "aria-label": p.title || "Byte layout" },
      h("div", { className: "sf-bytes-row", role: "row" },
        (p.fields || []).map(function (f, i) {
          var cls = cx("sf-byte", f.order === "BE" && "sf-byte-be", f.subject && "sf-byte-subject", f.unused && "sf-byte-unused");
          return h("div", { key: i, className: cls, role: "cell", style: { flexBasis: Math.max(min, f.size * scale) + "px" } },
            h("span", { className: "sf-byte-head" }, h("span", { className: "sf-byte-off" }, f.offset + " · " + hex(f.offset)), h("span", { className: "sf-byte-off" }, f.size + " B")),
            h("span", { className: "sf-byte-name" }, f.name),
            h("span", { className: "sf-byte-type" }, [f.type, f.order].filter(Boolean).join(" ")));
        })),
      p.note ? h("p", { className: "sf-bytes-note" }, p.note) : null);
  }

  /* ---------- Timeline ---------- */
  function Timeline(p) {
    return h("ol", { className: cx("sf-tl", p.className), "aria-label": p.title || "Timeline" },
      (p.events || []).map(function (e, i) {
        return h("li", { key: i, className: cx("sf-tl-item", e.subject && "sf-tl-subject") },
          h("span", { className: "sf-tl-date" }, e.date),
          h("span", { className: "sf-tl-mark" }, h(LevelMark, { level: e.level || "U", size: 12, subject: e.subject })),
          h("span", { className: "sf-tl-text" },
            h("span", { className: "sf-tl-label" }, e.label),
            e.note ? h("span", { className: "sf-tl-note" }, e.note) : null,
            e.level ? h("span", { className: "sf-tl-level" }, e.level + " · " + LEVELS[e.level]) : null));
      }));
  }

  /* ---------- ArticleCard + PrereqPanel ---------- */
  var STATUS = { idea: "Idea", researching: "Researching", outlined: "Outlined", drafted: "Drafted", reviewed: "Reviewed", approved: "Approved", published: "Published", "needs-revision": "Needs revision" };
  function ArticleCard(p) {
    var st = STATUS[p.status] ? p.status : "idea";
    var title = p.href ? h("a", { href: p.href, className: "sf-card-link" }, p.title) : p.title;
    return h("article", { className: cx("sf-card", p.className) },
      h("div", { className: "sf-card-top" },
        h("span", { className: "sf-card-vol" }, h(Glyph, { name: "mark", size: 14 }), "Volume " + p.volume + (p.week ? " · Week " + p.week : "")),
        p.id ? h("span", { className: "sf-card-id" }, p.id) : null),
      h("h3", { className: "sf-card-title" }, title),
      h("div", { className: "sf-card-meta" },
        h("span", null, [p.type, p.period].filter(Boolean).join(" · ")),
        h("span", { className: "sf-status sf-status-" + st }, STATUS[st])));
  }
  function PrereqList(p) {
    return h("div", { className: "sf-prereq-col" },
      h("p", { className: "sf-prereq-head" }, p.head),
      (p.items && p.items.length) ? h("ul", { className: "sf-prereq-list" }, p.items.map(function (it, i) {
        return h("li", { key: i }, h("span", { className: "sf-prereq-id" }, it.id), it.href ? h("a", { href: it.href }, it.title) : h("span", null, it.title));
      })) : h("p", { className: "sf-prereq-none" }, p.empty || "Nothing required"));
  }
  function PrereqPanel(p) {
    return h("nav", { className: cx("sf-prereq", p.className), "aria-label": "Reading path" },
      h(PrereqList, { head: p.beforeLabel || "Read first", items: p.before, empty: "Start here: no prerequisites" }),
      h(PrereqList, { head: p.afterLabel || "Leads to", items: p.after, empty: "End of this thread" }));
  }

  /* ---------- HeroScene: a lit 3D banner (needs window.THREE) ---------- */
  var HERO_LAYERS = [
    { ext: "shp", role: "geometry", motif: "polygons", subject: true },
    { ext: "shx", role: "index", motif: "index" },
    { ext: "dbf", role: "attributes", motif: "table" },
    { ext: "prj", role: "CRS", motif: "graticule" }
  ];
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cssTok(name, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim(); return v || fb; }
  function drawSlabTexture(L, pal, fam) {
    var cw = 1024, ch = 768, cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
    var g = cv.getContext("2d"), fg = L.subject ? pal.onMagenta : pal.ink, mut = L.subject ? pal.onMagenta : pal.inkMuted;
    g.fillStyle = L.subject ? pal.magenta : pal.raised; g.fillRect(0, 0, cw, ch);
    g.globalAlpha = L.subject ? 0.45 : 1; g.strokeStyle = L.subject ? pal.onMagenta : pal.line; g.lineWidth = 3; g.strokeRect(36, 36, cw - 72, ch - 72); g.globalAlpha = 1;
    g.fillStyle = fg; g.textBaseline = "alphabetic";
    /* label on the front edge (texture bottom): the slab above never hides it */
    g.font = "800 150px " + fam.display; g.fillText("." + (L.ext || ""), 76, ch - 150);
    g.font = "500 58px " + fam.mono; g.fillStyle = mut; g.fillText(L.role || "", 82, ch - 74);
    g.strokeStyle = mut; g.fillStyle = mut; g.lineWidth = 6; g.lineJoin = "round"; g.lineCap = "round";
    var x0 = 490, y0 = 150, w = 450, hh = 340, m = L.motif;
    function vtx(x, y) { g.save(); g.fillStyle = L.subject ? pal.magenta : pal.raised; g.fillRect(x - 11, y - 11, 22, 22); g.lineWidth = 4; g.strokeRect(x - 11, y - 11, 22, 22); g.restore(); }
    if (m === "polygons") {
      [[[0, 0.1], [0.42, 0], [0.5, 0.48], [0.06, 0.55]], [[0.55, 0.05], [1, 0.12], [0.94, 0.6], [0.56, 0.5]], [[0.08, 0.66], [0.6, 0.6], [0.66, 1], [0.12, 0.98]]].forEach(function (pg) {
        g.beginPath(); pg.forEach(function (q, i) { var X = x0 + q[0] * w, Y = y0 + q[1] * hh; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath(); g.stroke();
        pg.forEach(function (q) { vtx(x0 + q[0] * w, y0 + q[1] * hh); });
      });
    } else if (m === "table") {
      var rows = 6, cols = 4; g.globalAlpha = L.subject ? 0.35 : 0.18; g.fillRect(x0, y0, w, hh / rows); g.globalAlpha = 1; g.lineWidth = 4;
      for (var r = 0; r <= rows; r++) { g.beginPath(); g.moveTo(x0, y0 + r * hh / rows); g.lineTo(x0 + w, y0 + r * hh / rows); g.stroke(); }
      for (var c = 0; c <= cols; c++) { g.beginPath(); g.moveTo(x0 + c * w / cols, y0); g.lineTo(x0 + c * w / cols, y0 + hh); g.stroke(); }
    } else if (m === "index") {
      var lens = [0.9, 0.55, 0.75, 0.4, 0.85, 0.6, 0.7];
      lens.forEach(function (l, i) { var Y = y0 + 20 + i * 50; g.globalAlpha = 0.9; g.fillRect(x0 + 90, Y, (w - 90) * l, 22); g.font = "500 30px " + fam.mono; g.fillText(String(100 + i * 8), x0, Y + 22); });
      g.globalAlpha = 1;
    } else if (m === "graticule") {
      var cx0 = x0 + w / 2, cy0 = y0 + hh / 2, R0 = hh / 2; g.lineWidth = 4;
      g.beginPath(); g.arc(cx0, cy0, R0, 0, Math.PI * 2); g.stroke();
      [-0.66, -0.33, 0, 0.33, 0.66].forEach(function (k) { g.beginPath(); g.ellipse(cx0, cy0, Math.abs(k) * R0 || 1, R0, 0, 0, Math.PI * 2); g.stroke(); });
      [-0.5, 0, 0.5].forEach(function (k) { var yy = cy0 + k * R0, half = Math.sqrt(1 - k * k) * R0; g.beginPath(); g.moveTo(cx0 - half, yy); g.lineTo(cx0 + half, yy); g.stroke(); });
    } else if (m === "points") {
      [[0.1, 0.2], [0.3, 0.7], [0.5, 0.3], [0.7, 0.8], [0.9, 0.4], [0.6, 0.55], [0.2, 0.45]].forEach(function (q) { g.beginPath(); g.arc(x0 + q[0] * w, y0 + q[1] * hh, 14, 0, Math.PI * 2); g.fill(); });
    } else if (m === "lines") {
      [[[0, 0.9], [0.3, 0.5], [0.55, 0.6], [1, 0.1]], [[0.05, 0.2], [0.45, 0.35], [0.7, 1]]].forEach(function (ln) { g.beginPath(); ln.forEach(function (q, i) { var X = x0 + q[0] * w, Y = y0 + q[1] * hh; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke(); });
    } else if (m === "raster") {
      var n = 6, fill = [1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1];
      for (var rr = 0; rr < n; rr++) for (var cc = 0; cc < n; cc++) { g.globalAlpha = fill[rr * n + cc] ? 0.85 : 0.15; g.fillRect(x0 + cc * w / n + 3, y0 + rr * hh / n + 3, w / n - 6, hh / n - 6); }
      g.globalAlpha = 1;
    }
    return cv;
  }
  function buildHero(T, el, opts) {
    var W = el.clientWidth || 960, H = opts.height;
    var pal = {
      paper: cssTok("paper", "#fbf8fa"), sunk: cssTok("paper-sunk", "#f3ecf1"), raised: cssTok("paper-raised", "#ffffff"),
      line: cssTok("line", "#e6dbe3"), ink: cssTok("ink", "#1c1220"), inkMuted: cssTok("ink-muted", "#5e4f5d"), inkFaint: cssTok("ink-faint", "#9a8996"),
      magenta: cssTok("magenta", "#d9137f"), magentaInk: cssTok("magenta-ink", "#b0106a"), magentaLight: cssTok("magenta-light", "#f6a8d2"),
      magentaDeep: cssTok("magenta-deep", "#8a0d55"), onMagenta: cssTok("on-magenta", "#ffffff"), ctxTop: cssTok("ctx-top", "#ffffff"),
      ctxLeft: cssTok("ctx-left", "#efe6ec"), ctxRight: cssTok("ctx-right", "#ddd0d8")
    };
    var fam = { display: cssTok("font-display", "sans-serif"), mono: cssTok("font-mono", "monospace") };
    var dark = new T.Color(pal.paper).getHSL({ h: 0, s: 0, l: 0 }).l < 0.4;
    var renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setClearColor(new T.Color(pal.paper), 1);
    el.appendChild(renderer.domElement);
    var scene = new T.Scene();
    scene.fog = new T.Fog(new T.Color(pal.paper), 34, 96);
    var rand = mulberry(opts.seed || 7);
    var layers = opts.layers && opts.layers.length ? opts.layers : HERO_LAYERS;
    var SW = 8, SD = 6, TH = 0.34, GAP = 2.45, BASE = 1.4, EAR = 1.15, sx = 0, sz = 0;
    // ground, grid
    var ground = new T.Mesh(new T.PlaneGeometry(400, 400), new T.MeshStandardMaterial({ color: pal.sunk, roughness: 1, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    var grid = new T.GridHelper(240, 60, new T.Color(pal.line), new T.Color(pal.line));
    grid.position.set(2, 0.004, 2); grid.material.transparent = true; grid.material.opacity = dark ? 0.9 : 1; grid.material.fog = true; scene.add(grid);
    // clay city on 4-unit lots, kept clear of the stack
    var blocks = [];
    for (var gx = -64; gx <= 40; gx += 4) for (var gz = -84; gz <= 20; gz += 4) {
      if (Math.abs(gx - sx) < SW / 2 + 7 && Math.abs(gz - sz) < SD / 2 + 6) continue;
      var near = gz > 4 || (gx < -12 && gz > -12);
      if (rand() < (near ? 0.62 : 0.3)) continue;
      var bw = 1.5 + rand() * 1.5, bd = 1.5 + rand() * 1.5, far = Math.min(1, Math.max(0, (-gz - 6) / 60));
      var bh = near ? 0.25 + rand() * 0.7 : 0.3 + Math.pow(rand(), 2.4) * (1.6 + far * 6.5);
      blocks.push([gx, gz, bw, bd, bh]);
    }
    var box = new T.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
    var clay = new T.MeshStandardMaterial({ color: dark ? pal.ctxRight : pal.ctxTop, roughness: 0.92, metalness: 0 });
    var city = new T.InstancedMesh(box, clay, blocks.length), mtx = new T.Matrix4();
    blocks.forEach(function (b, i) { mtx.makeScale(b[2], b[4], b[3]); mtx.setPosition(b[0], 0, b[1]); city.setMatrixAt(i, mtx); });
    city.castShadow = true; city.receiveShadow = true; scene.add(city);
    // the exploded file stack
    var aniso = renderer.capabilities.getMaxAnisotropy();
    var shape = new T.Shape();
    shape.moveTo(0, 0); shape.lineTo(SW, 0); shape.lineTo(SW, SD - EAR); shape.lineTo(SW - EAR, SD); shape.lineTo(0, SD); shape.lineTo(0, 0);
    var slabGeo = new T.ExtrudeGeometry(shape, { depth: TH, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 1 });
    slabGeo.rotateX(-Math.PI / 2); slabGeo.translate(-SW / 2, 0, SD / 2);
    var earShape = new T.Shape(); earShape.moveTo(SW, SD - EAR); earShape.lineTo(SW - EAR, SD); earShape.lineTo(SW - EAR, SD - EAR); earShape.lineTo(SW, SD - EAR);
    var earGeo = new T.ShapeGeometry(earShape); earGeo.rotateX(-Math.PI / 2); earGeo.translate(-SW / 2, 0, SD / 2);
    var n = layers.length, topY = BASE + (n - 1) * GAP + TH;
    layers.forEach(function (L, i) {
      var y = BASE + (n - 1 - i) * GAP;
      var tex = new T.CanvasTexture(drawSlabTexture(L, pal, fam));
      tex.repeat.set(1 / SW, 1 / SD); tex.anisotropy = aniso;
      var cap = new T.MeshStandardMaterial({ map: tex, roughness: L.subject ? 0.5 : 0.85, metalness: 0, emissive: L.subject ? new T.Color(pal.magenta) : new T.Color(0x000000), emissiveIntensity: L.subject ? (dark ? 0.22 : 0.06) : 0 });
      var side = new T.MeshStandardMaterial({ color: L.subject ? pal.magentaDeep : pal.ctxRight, roughness: 0.7, metalness: 0 });
      var slab = new T.Mesh(slabGeo, [cap, side]); slab.position.set(sx, y, sz); slab.castShadow = true; slab.receiveShadow = false; scene.add(slab);
      var ear = new T.Mesh(earGeo, new T.MeshStandardMaterial({ color: L.subject ? pal.magentaLight : pal.ctxLeft, roughness: 0.8, side: T.DoubleSide }));
      ear.position.set(sx, y + TH + 0.06, sz); ear.castShadow = true; scene.add(ear);
      if (L.subject) {
        var hb = new T.BoxGeometry(0.34, 0.34, 0.34), hm = new T.MeshStandardMaterial({ color: pal.raised, roughness: 0.6 });
        var edge = new T.LineBasicMaterial({ color: pal.magentaInk });
        [[-SW / 2, SD / 2], [SW / 2, SD / 2], [-SW / 2, -SD / 2]].forEach(function (c) {
          var hmesh = new T.Mesh(hb, hm); hmesh.position.set(sx + c[0], y + TH + 0.2, sz + c[1]); hmesh.castShadow = true; scene.add(hmesh);
          var hl = new T.LineSegments(new T.EdgesGeometry(hb), edge); hl.position.copy(hmesh.position); scene.add(hl);
        });
      }
    });
    // exploded-view guides and the footprint on the ground
    var dash = new T.LineDashedMaterial({ color: pal.inkMuted, dashSize: 0.16, gapSize: 0.12, transparent: true, opacity: 0.75 });
    [[-SW / 2, SD / 2], [SW / 2, SD / 2], [-SW / 2, -SD / 2], [SW / 2, -SD / 2 + EAR]].forEach(function (c) {
      var gl = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(sx + c[0], 0.01, sz + c[1]), new T.Vector3(sx + c[0], topY, sz + c[1])]), dash);
      gl.computeLineDistances(); scene.add(gl);
    });
    var fp = [[-SW / 2, SD / 2], [SW / 2, SD / 2], [SW / 2, -SD / 2 + EAR], [SW / 2 - EAR, -SD / 2], [-SW / 2, -SD / 2], [-SW / 2, SD / 2]].map(function (c) { return new T.Vector3(sx + c[0], 0.02, sz + c[1]); });
    var fpl = new T.Line(new T.BufferGeometry().setFromPoints(fp), new T.LineDashedMaterial({ color: pal.magentaInk, dashSize: 0.3, gapSize: 0.18 }));
    fpl.computeLineDistances(); scene.add(fpl);
    // light from the upper left, soft fill
    scene.add(new T.HemisphereLight(new T.Color(pal.raised), new T.Color(pal.sunk), dark ? 0.55 : 0.62));
    scene.add(new T.AmbientLight(0xffffff, dark ? 0.12 : 0.1));
    var sun = new T.DirectionalLight(0xffffff, dark ? 0.62 : 0.55);
    sun.position.set(sx - 26, 42, sz + 16); sun.target.position.set(sx, 0, sz); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
    var sc = sun.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 140;
    scene.add(sun);
    var cam = new T.PerspectiveCamera(opts.fov || 22, W / H, 1, 400);
    cam.position.set(sx - 19, 16.5, sz + 25); cam.lookAt(sx - 0.6, (topY + BASE) / 2 - 0.9, sz - 1.2);
    function frame(w) { cam.aspect = w / H; var off = opts.align === "center" ? 0 : -w * (opts.shift == null ? 0.24 : opts.shift); cam.setViewOffset(w, H, off, 0, w, H); cam.updateProjectionMatrix(); }
    frame(W);
    renderer.render(scene, cam);
    return {
      resize: function (w) { renderer.setSize(w, H); frame(w); renderer.render(scene, cam); },
      dispose: function () {
        scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); });
        renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }
  function HeroScene(p) {
    var ref = R.useRef(null), st = R.useState(false), failed = st[0], setFailed = st[1];
    var height = p.height || 360, layers = p.layers || HERO_LAYERS;
    var key = JSON.stringify([layers, p.seed, p.align, p.shift, p.fov, height]);
    R.useEffect(function () {
      var el = ref.current, T = window.THREE, inst = null, dead = false, lastW = 0;
      if (!el || !T) { setFailed(true); return; }
      function make() {
        if (dead) return;
        if (inst) { inst.dispose(); inst = null; }
        try { inst = buildHero(T, el, { height: height, layers: layers, seed: p.seed, align: p.align, shift: p.shift, fov: p.fov }); lastW = el.clientWidth; }
        catch (e) { setFailed(true); }
      }
      var fonts = document.fonts;
      var ready = fonts ? Promise.race([Promise.all([fonts.load("800 100px " + cssTok("font-display", "sans-serif")), fonts.load("500 40px " + cssTok("font-mono", "monospace"))]).then(function () { return fonts.ready; }), new Promise(function (r) { setTimeout(r, 1500); })]) : Promise.resolve();
      ready.then(make, make);
      var mo = new MutationObserver(make); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
      var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
      if (mq && mq.addEventListener) mq.addEventListener("change", make);
      var ro = window.ResizeObserver ? new ResizeObserver(function () { var w = el.clientWidth; if (inst && w && Math.abs(w - lastW) > 1) { lastW = w; inst.resize(w); } }) : null;
      if (ro) ro.observe(el);
      return function () { dead = true; mo.disconnect(); if (mq && mq.removeEventListener) mq.removeEventListener("change", make); if (ro) ro.disconnect(); if (inst) inst.dispose(); };
    }, [key]);
    var label = p.title || ("3D illustration: " + layers.map(function (L) { return "." + L.ext; }).join(", ") + " floating above a city grid; ." + ((layers.filter(function (L) { return L.subject; })[0] || layers[0]).ext) + " is highlighted");
    if (failed) {
      return h("div", { className: cx("sf-hero sf-hero-fallback", p.className), style: { height: height + "px" } },
        h(LayerStack, { title: label, layers: layers.map(function (L) { return { label: "." + L.ext, sublabel: L.role, motif: L.motif === "table" || L.motif === "index" || L.motif === "graticule" ? "none" : L.motif, role: L.subject ? "subject" : "context" }; }) }));
    }
    return h("div", { ref: ref, className: cx("sf-hero", p.className), style: { height: height + "px" }, role: "img", "aria-label": label });
  }

  var C = window;
  C.ShapeFiles = C.ShapeFiles || {};
  Object.assign(C.ShapeFiles, {
    Figure: Figure, Legend: Legend, IsoFeatures: IsoFeatures, LayerStack: LayerStack, FileSet: FileSet,
    GeometrySketch: GeometrySketch, ByteLayout: ByteLayout, Timeline: Timeline, EvidenceBadge: EvidenceBadge,
    ClaimTag: ClaimTag, Callout: Callout, ArticleCard: ArticleCard, PrereqPanel: PrereqPanel, Button: Button,
    Glyph: Glyph, HeroScene: HeroScene, iso: iso
  });
})();
