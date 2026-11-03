"""The Shape-Files, File 001: one question, three representations.

Question: how much class 1-2 land is currently forested?
The same synthetic two-layer landscape is held three ways:
  1. as two map images (PNG),
  2. as coordinate and attribute tables (CSV),
  3. as a queryable store (GeoPackage, queried with DuckDB Spatial).
Writes data/, results.json, the article's figures/two_sheets.png and the site's _variables.yml.
Run from this folder:  python3 run.py
"""
import json, csv, platform, datetime
from pathlib import Path
import numpy as np
import shapely
from shapely.geometry import box, MultiPoint
from shapely.ops import voronoi_diagram
import geopandas as gpd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MplPolygon
import duckdb

HERE = Path(__file__).parent
DATA, FIGS = HERE / "data", HERE.parent / "figures"   # FIGS is the article's figure folder
DATA.mkdir(exist_ok=True); FIGS.mkdir(exist_ok=True)
W, H = 12_000.0, 8_000.0          # meters, in a synthetic local grid (no real location)
EXTENT = box(0, 0, W, H)
rng = np.random.default_rng(1967)  # fixed seed: the year of the ARDA report


def partition(n_seeds):
    pts = MultiPoint(rng.uniform([0, 0], [W, H], size=(n_seeds, 2)).tolist())
    cells = voronoi_diagram(pts, envelope=EXTENT)
    return [c.intersection(EXTENT) for c in cells.geoms]


cap_geoms = partition(26)
use_geoms = partition(20)
cap_class = rng.choice([1, 2, 3, 4, 5, 6, 7], size=len(cap_geoms), p=[0.10, 0.16, 0.20, 0.20, 0.14, 0.12, 0.08])
uses = ["forest", "cropland", "pasture", "wetland", "settlement"]
land_use = rng.choice(uses, size=len(use_geoms), p=[0.38, 0.30, 0.16, 0.10, 0.06])
cap = gpd.GeoDataFrame({"cap_id": range(1, len(cap_geoms) + 1), "class": cap_class.astype(int)}, geometry=cap_geoms, crs=None)
use = gpd.GeoDataFrame({"use_id": range(1, len(use_geoms) + 1), "use": land_use}, geometry=use_geoms, crs=None)

# ---------------- 3. the queryable store ----------------
gpkg = DATA / "parcels.gpkg"
if gpkg.exists(): gpkg.unlink()
cap.to_file(gpkg, layer="capability", driver="GPKG")
use.to_file(gpkg, layer="land_use", driver="GPKG")
SQL = """
SELECT round(sum(ST_Area(ST_Intersection(c.geom, u.geom))) / 10000, 1) AS hectares
FROM ST_Read('{gpkg}', layer = 'capability') AS c
JOIN ST_Read('{gpkg}', layer = 'land_use') AS u
  ON ST_Intersects(c.geom, u.geom)
WHERE c.class IN (1, 2) AND u.use = 'forest';
""".strip()
con = duckdb.connect()
con.execute("INSTALL spatial; LOAD spatial;")
store_ha = con.execute(SQL.format(gpkg=gpkg.as_posix())).fetchone()[0]
# independent check with GeoPandas overlay
ov = gpd.overlay(cap[cap["class"].isin([1, 2])], use[use["use"] == "forest"], how="intersection")
check_ha = round(ov.area.sum() / 10_000, 1)

# ---------------- 2. coordinate and attribute tables ----------------
def rings(geom):
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms)
    for p in polys:
        yield list(p.exterior.coords)

with open(DATA / "capability_vertices.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["cap_id", "seq", "x", "y"])
    for cid, g in zip(cap.cap_id, cap.geometry):
        for ring in rings(g):
            for s, (x, y) in enumerate(ring): w.writerow([cid, s, round(x, 1), round(y, 1)])
with open(DATA / "capability_attributes.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["cap_id", "class"])
    for cid, k in zip(cap.cap_id, cap["class"]): w.writerow([cid, k])
with open(DATA / "land_use_vertices.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["use_id", "seq", "x", "y"])
    for uid, g in zip(use.use_id, use.geometry):
        for ring in rings(g):
            for s, (x, y) in enumerate(ring): w.writerow([uid, s, round(x, 1), round(y, 1)])
with open(DATA / "land_use_attributes.csv", "w", newline="") as fh:
    w = csv.writer(fh); w.writerow(["use_id", "use"])
    for uid, k in zip(use.use_id, use["use"]): w.writerow([uid, k])

def shoelace(xy):
    x, y = np.array(xy).T
    return 0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))

def table_areas(vfile, key):
    rows = {}
    for r in csv.DictReader(open(vfile)):
        rows.setdefault(int(r[key]), []).append((float(r["x"]), float(r["y"])))
    return {k: shoelace(v) for k, v in rows.items()}

cap_area = table_areas(DATA / "capability_vertices.csv", "cap_id")
use_area = table_areas(DATA / "land_use_vertices.csv", "use_id")
cap_attr = {int(r["cap_id"]): int(r["class"]) for r in csv.DictReader(open(DATA / "capability_attributes.csv"))}
use_attr = {int(r["use_id"]): r["use"] for r in csv.DictReader(open(DATA / "land_use_attributes.csv"))}
table_cap12_ha = round(sum(a for k, a in cap_area.items() if cap_attr[k] in (1, 2)) / 10_000, 1)
table_forest_ha = round(sum(a for k, a in use_area.items() if use_attr[k] == "forest") / 10_000, 1)
vertex_rows = sum(1 for _ in open(DATA / "capability_vertices.csv")) - 1 + sum(1 for _ in open(DATA / "land_use_vertices.csv")) - 1

# the same tables again, with a geometry engine brought to them: rebuild the polygons, then intersect
TABLE_SQL = """
WITH cap AS (
  SELECT cap_id, ST_MakePolygon(ST_MakeLine(list(ST_Point(x, y) ORDER BY seq))) AS geom
  FROM read_csv('{d}/capability_vertices.csv') GROUP BY cap_id),
use AS (
  SELECT use_id, ST_MakePolygon(ST_MakeLine(list(ST_Point(x, y) ORDER BY seq))) AS geom
  FROM read_csv('{d}/land_use_vertices.csv') GROUP BY use_id)
SELECT round(sum(ST_Area(ST_Intersection(c.geom, u.geom))) / 10000, 1) AS hectares
FROM cap c JOIN read_csv('{d}/capability_attributes.csv') ca USING (cap_id)
JOIN use u ON ST_Intersects(c.geom, u.geom)
JOIN read_csv('{d}/land_use_attributes.csv') ua USING (use_id)
WHERE ca.class IN (1, 2) AND ua.use = 'forest';
""".strip()
tables_engine_ha = con.execute(TABLE_SQL.format(d=DATA.as_posix())).fetchone()[0]

# ---------------- 1. two map images ----------------
PAPER = "#fbf8fa"; INK = "#1c1220"
CAP_COLORS = {1: "#1c1220", 2: "#4a3a48", 3: "#7a6878", 4: "#a595a2", 5: "#c8bcc5", 6: "#e2d9df", 7: "#f3edf1"}
USE_COLORS = {"forest": "#2f6b4f", "cropland": "#d9c06a", "pasture": "#a9c98a", "wetland": "#6fa8b8", "settlement": "#b07a6a"}

def draw_sheet(gdf, colfn, path, px_w, legend):
    dpi = 100
    fig = plt.figure(figsize=(px_w / dpi, px_w * H / W / dpi), dpi=dpi)
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W); ax.set_ylim(0, H); ax.axis("off")
    for g, c in zip(gdf.geometry, colfn(gdf)):
        polys = [g] if g.geom_type == "Polygon" else list(g.geoms)
        for p in polys:
            ax.add_patch(MplPolygon(np.array(p.exterior.coords), closed=True, facecolor=c, edgecolor=c, linewidth=0, antialiased=False))
    fig.savefig(path, dpi=dpi); plt.close(fig)

def sheet_pixels(path):
    img = plt.imread(path)[:, :, :3]
    return (img * 255).round().astype(int)

def hexrgb(hx): return tuple(int(hx[i:i + 2], 16) for i in (1, 3, 5))

estimates = {}
for px_w in (200, 1000):
    a = DATA / f"sheet_capability_{px_w}.png"; b = DATA / f"sheet_land_use_{px_w}.png"
    draw_sheet(cap, lambda g: [CAP_COLORS[k] for k in g["class"]], a, px_w, None)
    draw_sheet(use, lambda g: [USE_COLORS[k] for k in g["use"]], b, px_w, None)
    A, B = sheet_pixels(a), sheet_pixels(b)
    is12 = np.zeros(A.shape[:2], bool)
    for k in (1, 2): is12 |= np.all(np.abs(A - hexrgb(CAP_COLORS[k])) <= 2, axis=2)
    isF = np.all(np.abs(B - hexrgb(USE_COLORS["forest"])) <= 2, axis=2)
    cell = (W / A.shape[1]) * (H / A.shape[0])
    estimates[px_w] = {"pixels": int((is12 & isF).sum()), "cell_m": round(W / A.shape[1], 1), "hectares": round((is12 & isF).sum() * cell / 10_000, 1)}

# a presentation figure of the two sheets side by side (for the article)
fig, axs = plt.subplots(1, 2, figsize=(10, 3.6), dpi=150)
for ax, gdf, colfn, title in ((axs[0], cap, lambda g: [CAP_COLORS[k] for k in g["class"]], "Sheet A · land capability (class 1 darkest)"),
                              (axs[1], use, lambda g: [USE_COLORS[k] for k in g["use"]], "Sheet B · present land use (forest dark green)")):
    for g, c in zip(gdf.geometry, colfn(gdf)):
        for p in ([g] if g.geom_type == "Polygon" else list(g.geoms)):
            ax.add_patch(MplPolygon(np.array(p.exterior.coords), closed=True, facecolor=c, edgecolor=PAPER, linewidth=0.6))
    ax.set_xlim(0, W); ax.set_ylim(0, H); ax.set_aspect("equal"); ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values(): s.set_color(INK); s.set_linewidth(0.8)
    ax.set_title(title, fontsize=9, color=INK, loc="left", family="monospace")
fig.patch.set_facecolor(PAPER); fig.tight_layout()
fig.savefig(FIGS / "two_sheets.png", facecolor=PAPER); plt.close(fig)

results = {
    "article": "File 001, Before GIS Was Software",
    "executed_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "environment": {"python": platform.python_version(), "geopandas": gpd.__version__, "shapely": shapely.__version__,
                    "duckdb": duckdb.__version__, "numpy": np.__version__, "matplotlib": matplotlib.__version__},
    "data": {"extent_m": [W, H], "crs": "none (synthetic local grid, meters)", "seed": 1967,
             "capability_polygons": len(cap), "land_use_polygons": len(use), "vertex_rows": vertex_rows},
    "store_sql_hectares": store_ha, "geopandas_check_hectares": check_ha,
    "tables": {"class12_hectares": table_cap12_ha, "forest_hectares": table_forest_ha, "rebuilt_with_duckdb_hectares": tables_engine_ha},
    "images": estimates,
    "sql": SQL.replace("{gpkg}", "data/parcels.gpkg"),
    "tables_sql": TABLE_SQL.replace("{d}", "data"),
}
(HERE / "results.json").write_text(json.dumps(results, indent=1))
var = {"file001": {
    "exact": f"{store_ha:,.1f}", "check": f"{check_ha:,.1f}", "class12": f"{table_cap12_ha:,.1f}", "forest": f"{table_forest_ha:,.1f}", "tablesql": f"{tables_engine_ha:,.1f}",
    "img200": f"{estimates[200]['hectares']:,.1f}", "img200cell": f"{estimates[200]['cell_m']:g}",
    "img1000": f"{estimates[1000]['hectares']:,.1f}", "img1000cell": f"{estimates[1000]['cell_m']:g}",
    "err200": f"{abs(estimates[200]['hectares'] - store_ha) / store_ha * 100:.1f}", "err1000": f"{abs(estimates[1000]['hectares'] - store_ha) / store_ha * 100:.1f}",
    "ncap": str(len(cap)), "err1000exact": f"{abs(estimates[1000]['hectares'] - store_ha) / store_ha * 100:.2f}", "nuse": str(len(use)), "vertices": f"{vertex_rows:,}",
    "date": results["executed_utc"][:10], "env": f"Python {platform.python_version()}, GeoPandas {gpd.__version__}, Shapely {shapely.__version__}, DuckDB {duckdb.__version__}"}}
import yaml
(HERE.parents[2] / "_variables.yml").write_text(yaml.safe_dump(var, sort_keys=False))
print(json.dumps(results, indent=1))
