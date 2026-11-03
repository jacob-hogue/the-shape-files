# The Shape-Files

Source for *The Shape-Files*, a long-form technical history of GIS and geospatial computing. The site is built with [Quarto](https://quarto.org) and deployed to GitHub Pages by `.github/workflows/publish.yml`.

**Status: draft.** Pages carry a `noindex` tag and a draft banner until launch.

## Layout

| Path | What it holds |
|---|---|
| `articles/<slug>/index.qmd` | One article, its figures and front matter (`id`, `volume`, `sequence`, `topics`, review status) |
| `lab/<experiment>/` | The code behind an article's demonstration: `run.py`, `requirements.txt`, `results.json`, data and figures |
| `_variables.yml` | Numbers written by `lab/*/run.py`, used in articles as `{{< var x001.exact >}}` so nothing is copied by hand |
| `references.bib` | Bibliography for all articles |
| `design/tokens.json` | Design tokens from the design system; `tools/build_tokens.py` compiles them to `styles/tokens.css` |
| `assets/js/` | React 18.3.1, three.js 0.149.0 and the design-system bundle, used for the banner on articles that have one |
| `tools/voice_scan.py` | Checks a draft against the house voice rules (banned words, structural tells, American usage) |

## Working locally

```sh
quarto preview                      # live preview
quarto render                       # build into _site/
python3 tools/voice_scan.py articles/before-gis-was-software/index.qmd
```

To rerun an experiment and refresh the numbers an article quotes:

```sh
cd lab/X001-three-representations
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python3 run.py && python3 figures.py
```

`run.py` rewrites `results.json` and `_variables.yml`. Commit both; the publish workflow renders the site but doesn't rerun Python.

## Rules that apply to every change

- No invented sources, quotations, results or experience. A claim needs a source in `references.bib` or a result from code in `lab/`.
- Every number in an article comes from `_variables.yml` or a cited source.
- Corrections are recorded in the article's front matter, not made silently.
