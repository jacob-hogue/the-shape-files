"""Compile design/tokens.json (from the design system) into styles/tokens.css for the site."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
tok = json.loads((ROOT / "design/tokens.json").read_text())
themes = [t["id"] for t in tok["color"]["themes"]]
def val(t, th):
    v = t["value"]
    v = v if isinstance(v, str) else v.get(th, v[themes[0]])
    m = re.fullmatch(r"\{(.+)\}", v)
    return f"var(--{m.group(1)})" if m else v
def block(th): return "".join(f"  --{t['name']}: {val(t, th)};\n" for t in tok["color"]["tokens"])
other = ""
for fam, body in tok.items():
    if isinstance(body, dict) and "tokens" in body and fam != "color":
        other += "".join(f"  --{t['name']}: {t['value']};\n" for t in body["tokens"])
other += "".join(f"  --font-{k}: {v};\n" for k, v in tok["type"]["families"].items())
css = f"""/* The Shape-Files: generated from design/tokens.json by tools/build_tokens.py. Do not edit by hand. */
:root {{\n{block('light')}{other}  color-scheme: light;\n}}
@media (prefers-color-scheme: dark) {{\n  :root:not([data-theme="light"]) {{\n{block('dark')}  color-scheme: dark;\n  }}\n}}
:root[data-theme="dark"] {{\n{block('dark')}  color-scheme: dark;\n}}
"""
(ROOT / "styles/tokens.css").write_text(css)
print("wrote styles/tokens.css")
