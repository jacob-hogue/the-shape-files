"""Figure 3 of File 001: the answer polygons, as a theme-aware SVG (colors become CSS variables)."""
import re
from pathlib import Path
import geopandas as gpd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MplPolygon
import numpy as np

HERE = Path(__file__).parent
gpkg = HERE / "data" / "parcels.gpkg"
cap = gpd.read_file(gpkg, layer="capability"); use = gpd.read_file(gpkg, layer="land_use")
ans = gpd.overlay(cap[cap["class"].isin([1, 2])], use[use["use"] == "forest"], how="intersection")
# placeholder colors, swapped for tokens after export
CTX, CTX_EDGE, SUBJ, SUBJ_EDGE = "#010101", "#020202", "#030303", "#040404"
fig = plt.figure(figsize=(7.2, 4.8)); ax = fig.add_axes([0, 0, 1, 1])
def draw(g, fc, ec, lw):
    for p in ([g] if g.geom_type == "Polygon" else list(g.geoms)):
        ax.add_patch(MplPolygon(np.array(p.exterior.coords), closed=True, facecolor=fc, edgecolor=ec, linewidth=lw, joinstyle="round"))
for g in cap.geometry: draw(g, CTX, CTX_EDGE, 0.6)
for g in ans.geometry: draw(g, SUBJ, SUBJ_EDGE, 0.9)
ax.set_xlim(0, 12000); ax.set_ylim(0, 8000); ax.set_aspect("equal"); ax.axis("off")
fig.patch.set_alpha(0)
out = HERE.parent / "figures" / "answer.svg"
fig.savefig(out, format="svg", transparent=True); plt.close(fig)
s = out.read_text()
s = s.replace(CTX, "var(--paper-sunk)").replace(CTX_EDGE, "var(--ink-faint)").replace(SUBJ, "var(--magenta)").replace(SUBJ_EDGE, "var(--magenta-deep)")
s = re.sub(r"<\?xml.*?\?>\s*", "", s, flags=re.S); s = re.sub(r"<!DOCTYPE.*?>\s*", "", s, flags=re.S)
s = re.sub(r"<metadata>.*?</metadata>", "", s, flags=re.S)
s = s.replace("<svg ", '<svg role="img" aria-label="The synthetic 12 by 8 kilometer area with 26 capability parcels in pale gray; the pieces that are both class 1 or 2 and forested are filled magenta." style="max-width:100%;height:auto" ', 1)
out.write_text(s)
print("answer polygons:", len(ans), "area ha:", round(ans.area.sum() / 1e4, 1))
