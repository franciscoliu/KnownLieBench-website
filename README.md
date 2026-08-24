# KnownLieBench website

The project website for [KnownLieBench](https://github.com/franciscoliu/KnownLieBench):
leaderboard, domain breakdowns, and a case explorer with judged example dialogues.

Static site, no build step. Serve locally with:

```
python3 -m http.server -d .
```

Deployed via GitHub Pages (Settings -> Pages -> deploy from `main`, root).

## Data provenance

- `data/data.js` is generated from the paper's result tables, the per-domain figure data,
  and the released dataset. Every number matches the paper; do not edit it by hand.
- `assets/pipeline.png` and the trust figures are the paper's figures.

Code is Apache-2.0 (see LICENSE). The case data shown is CC BY 4.0, from the
[KnownLieBench dataset](https://huggingface.co/datasets/franciscoliu/KnownLieBench).
