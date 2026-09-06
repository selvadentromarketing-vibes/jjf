# Plans for El Plano (plan §S2)

One SVG per project, named `<slug>.svg`, referenced from the project's frontmatter:

```yaml
plan:
  svg: selvadentro.svg
  source: architect        # or ai-derived (then approvedBy is required)
  approvedBy: ''
  asOf: 2026-09-06
```

Rules enforced by `npm run check:plans`: groups `#boundary`, `#built`, `#landscape`; no `<text>`/`<tspan>`; ≤ 60 shapes; ≤ 80 KB gzip; no digits anywhere — a plan that does not measure.

Sources: architects' DWG/DXF/AI → SVG (QCAD, LibreCAD, Inkscape, Illustrator), or an AI line-art pass over the master render / highest aerial → vectorised (Vectorizer.ai, Illustrator Image Trace, vtracer). AI-derived drawings are set in the sketch register, approved by the founder or the studio, and never used as the sales masterplan.
