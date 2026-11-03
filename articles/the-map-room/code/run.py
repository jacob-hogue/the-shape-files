"""The Shape-Files, File 001: answering the overlay question the way a map room did.

The same synthetic area as File 017 (seed 1967): 26 land-capability parcels and
20 land-use parcels on a 12 x 8 km local grid in meters, with no real location.
Printed at 1:50,000, the area is a 24 x 16 cm sheet.

This is a modern simulation of the manual method's arithmetic, not a record of anyone's
work. It answers "how much class 1-2 land is forested?" by laying a dot grid over the
overlap and counting dots, at two common dot densities and many grid placements.
It records how many patches had to be outlined and how many dots counted, and repeats
the count for two other questions to show that each new question starts from scratch.
Writes results.json, figures/dot_grid.svg and the file001 block of the site's _variables.yml.
"""
import json, platform, datetime
from pathlib import Path
import numpy as np
import shapely
from shapely.geometry import box, MultiPoint, Point
from shapely.ops import voronoi_diagram, unary_union
import geopandas as gpd

HERE = Path(__file__).parent
W, H = 12_000.0, 8_000.0
EXTENT = box(0, 0, W, H)
rng = np.random.default_rng(1967)          # same seed and call order as File 017's run.py

def partition(n_seeds):
    pts = MultiPoint(rng.uniform([0, 0], [W, H], size=(n_seeds, 2)).tolist())
    cells = voronoi_diagram(pts, envelope=EXTENT)
    return [c.intersection(EXTENT) for c in cells.geoms]

cap_geoms = partition(26)
use_geoms = partition(20)
cap_class = rng.choice([1, 2, 3, 4, 5, 6, 7], size=len(cap_geoms), p=[0.10, 0.16, 0.20, 0.20, 0.14, 0.12, 0.08])
land_use = rng.choice(["forest", "cropland", "pasture", "wetland", "settlement"], size=len(use_geoms), p=[0.38, 0.30, 0.16, 0.10, 0.06])
cap = gpd.GeoDataFrame({"class": cap_class.astype(int)}, geometry=cap_geoms, crs=None)
use = gpd.GeoDataFrame({"use": land_use}, geometry=use_geoms, crs=None)

SCALE = 50_000                                  # 1:50,000, the scale of the main Canadian topographic sheets
INCH_M = 0.0254 * SCALE                         # ground meters per map inch (1,270 m)
QUESTIONS = {
    "class 1-2 under forest": ([1, 2], "forest"),
    "class 1-2 under cropland": ([1, 2], "cropland"),
    "class 3-4 under pasture": ([3, 4], "pasture"),
}

def overlap(classes, landuse):
    a = unary_union(cap[cap["class"].isin(classes)].geometry)
    b = unary_union(use[use["use"] == landuse].geometry)
    g = a.intersection(b)
    patches = [p for p in (g.geoms if hasattr(g, "geoms") else [g]) if p.area > 1]
    return g, patches

def dot_count(geom, per_sq_inch, dx, dy):
    """Count grid dots inside geom. Dots sit on a square grid of the given density on the map."""
    s = INCH_M / np.sqrt(per_sq_inch)          # ground spacing between dots
    xs = np.arange(dx * s, W, s); ys = np.arange(dy * s, H, s)
    X, Y = np.meshgrid(xs, ys)
    inside = shapely.contains_xy(geom, X.ravel(), Y.ravel())
    return int(inside.sum()), s, X.ravel()[inside], Y.ravel()[inside]

placements = np.random.default_rng(1854).uniform(0, 1, size=(200, 2))   # 200 random placements of the grid sheet
results = {"article": "File 001, The Map Room", "scale": f"1:{SCALE:,}",
           "sheet_cm": [W / SCALE * 100, H / SCALE * 100], "questions": {}}
for q, (classes, lu) in QUESTIONS.items():
    g, patches = overlap(classes, lu)
    true_ha = g.area / 10_000
    out = {"true_hectares": round(true_ha, 1), "patches_to_outline": len(patches), "grids": {}}
    for dens in (16, 64):
        counts = [dot_count(g, dens, dx, dy)[0] for dx, dy in placements]
        s = INCH_M / np.sqrt(dens); ha_per_dot = s * s / 10_000
        est = np.array(counts) * ha_per_dot
        out["grids"][str(dens)] = {
            "dot_spacing_m": round(s, 1), "hectares_per_dot": round(ha_per_dot, 2),
            "dots_counted_median": int(np.median(counts)),
            "estimate_median_ha": round(float(np.median(est)), 1),
            "estimate_p05_ha": round(float(np.percentile(est, 5)), 1),
            "estimate_p95_ha": round(float(np.percentile(est, 95)), 1),
            "error_p95_pct": round(float(np.percentile(np.abs(est - true_ha) / true_ha * 100, 95)), 1),
        }
    results["questions"][q] = out

# figure: the dot grid over the forested class 1-2 land, at 16 dots per square inch, first placement
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MplPolygon
g, patches = overlap([1, 2], "forest")
n, s, xin, yin = dot_count(g, 16, *placements[0])
s_all = INCH_M / 4
xs = np.arange(placements[0][0] * s_all, W, s_all); ys = np.arange(placements[0][1] * s_all, H, s_all)
X, Y = np.meshgrid(xs, ys)
fig = plt.figure(figsize=(9, 6)); ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W); ax.set_ylim(0, H); ax.set_aspect("equal"); ax.axis("off")
for geom in use.geometry:
    for p in ([geom] if geom.geom_type == "Polygon" else geom.geoms):
        ax.add_patch(MplPolygon(np.array(p.exterior.coords), closed=True, facecolor="#010101", edgecolor="#020202", linewidth=0.6))
for p in patches:
    ax.add_patch(MplPolygon(np.array(p.exterior.coords), closed=True, facecolor="#030303", edgecolor="#040404", linewidth=1.2))
ax.scatter(X.ravel(), Y.ravel(), s=7, c="#050505", linewidths=0)
ax.scatter(xin, yin, s=20, c="#060606", linewidths=0)
fig.savefig(HERE.parent / "figures" / "dot_grid.svg", format="svg", transparent=True); plt.close(fig)
svg = (HERE.parent / "figures" / "dot_grid.svg").read_text()
for hexc, var in (("#010101", "var(--paper-sunk)"), ("#020202", "var(--ink-faint)"), ("#030303", "var(--magenta-soft, var(--magenta-light))"),
                  ("#040404", "var(--magenta)"), ("#050505", "var(--ink-faint)"), ("#060606", "var(--ink)")):
    svg = svg.replace(hexc, var)
svg = svg.replace('width="648pt" height="432pt"', 'width="100%" height="auto" preserveAspectRatio="xMidYMid meet"')
import re as _re
svg = svg[svg.index("<svg"):]                                   # drop the XML prolog and doctype
svg = _re.sub(r"<metadata>.*?</metadata>", "", svg, flags=_re.S)
(HERE.parent / "figures" / "dot_grid.svg").write_text(svg)

results["figure"] = {"dots_inside_first_placement_16": n}
results["executed_utc"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
results["environment"] = {"python": platform.python_version(), "geopandas": gpd.__version__, "shapely": shapely.__version__, "numpy": np.__version__}
(HERE / "results.json").write_text(json.dumps(results, indent=1))

import yaml
vf = HERE.parents[2] / "_variables.yml"
allvars = yaml.safe_load(vf.read_text()) if vf.exists() else {}
q = results["questions"]["class 1-2 under forest"]
allvars["file001"] = {
    "true": f"{q['true_hectares']:,.1f}", "patches": str(q["patches_to_outline"]),
    "d16spacing": f"{q['grids']['16']['dot_spacing_m']:,.0f}", "d16ha": f"{q['grids']['16']['hectares_per_dot']:.1f}",
    "d16dots": str(q["grids"]["16"]["dots_counted_median"]), "d16lo": f"{q['grids']['16']['estimate_p05_ha']:,.0f}", "d16hi": f"{q['grids']['16']['estimate_p95_ha']:,.0f}",
    "d16err": f"{q['grids']['16']['error_p95_pct']:.0f}",
    "d64spacing": f"{q['grids']['64']['dot_spacing_m']:,.0f}", "d64ha": f"{q['grids']['64']['hectares_per_dot']:.2f}",
    "d64dots": str(q["grids"]["64"]["dots_counted_median"]), "d64lo": f"{q['grids']['64']['estimate_p05_ha']:,.0f}", "d64hi": f"{q['grids']['64']['estimate_p95_ha']:,.0f}",
    "d64err": f"{q['grids']['64']['error_p95_pct']:.0f}",
    "crop_true": f"{results['questions']['class 1-2 under cropland']['true_hectares']:,.1f}",
    "past_true": f"{results['questions']['class 3-4 under pasture']['true_hectares']:,.1f}",
    "fig16": str(results["figure"]["dots_inside_first_placement_16"]),
    "date": results["executed_utc"][:10],
    "env": f"Python {platform.python_version()}, GeoPandas {gpd.__version__}, Shapely {shapely.__version__}, NumPy {np.__version__}",
}
vf.write_text(yaml.safe_dump(allvars, sort_keys=False))
print(json.dumps(results, indent=1))
