<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/img/readme-hero-dark.png">
  <img src="assets/img/readme-hero-light.png" alt="The Shape-Files: a shapefile's .shp, .shx, .dbf and .prj files stacked above a city grid">
</picture>

A technical history of GIS and geospatial computing by [Jacob Hogue](https://jacob-hogue.github.io). Each file starts with a real problem, shows how the technology answered it, and traces where that answer lives in the tools people use now. Every claim cites its source, and every result comes from code in this repository that you can run yourself.

**Read it at [jacob-hogue.github.io/the-shape-files](https://jacob-hogue.github.io/the-shape-files/).**

## Files

| No. | Title | Code |
|---|---|---|
| 001 | [The Map Room: Answering Geographic Questions by Hand](https://jacob-hogue.github.io/the-shape-files/articles/the-map-room/) | [code](articles/the-map-room/code) |

## Run the code

Every number in a file comes from the script in its `code` folder. To rerun one:

```sh
cd articles/the-map-room/code
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python3 run.py
```

The test data is invented and the seed is fixed, so you should get the same numbers as the article.
