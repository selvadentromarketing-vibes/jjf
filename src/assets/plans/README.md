# Plans for El Plano (plan §S2)

One SVG per project, named `<slug>.svg`, referenced from the project's frontmatter:

```yaml
plan:
  svg: selvadentro.svg
  source: architect        # architect · traced · ai-derived
  from: selvadentro.webp   # required for 'traced': the plate it was read from
  approvedBy: ''           # required for 'ai-derived'
  asOf: 2026-09-08
```

Rules enforced by `npm run check:plans` and `tests/plano.spec.ts`: groups `#boundary`, `#built`,
`#landscape`; no `<text>`/`<tspan>`; ≤ 60 shapes; ≤ 80 KB gzip; no digits — a plan that does not
measure.

## The three sources, in order of preference

**`architect`** — the studio's DWG/DXF/AI/PDF-vector, converted (QCAD, LibreCAD, Inkscape,
Illustrator), stripped of text and dimensions, merged and simplified into the three groups. This is
what every one of these should eventually be; §14 #12 asks the founder which studios hold them.

**`traced`** — what ships today, and what `npm run trace:plans` produces: a drawing read by
`scripts/trace-plan.mjs` off whatever `from` names — a published plan where one exists, the
project's own aerial where it does not. The tracer tells them apart by how much of the sheet is
paper and reads each accordingly.

*From a plan* it follows the ink: the outermost contour is the property edge (`#boundary`), marks
too thick to be a line are the parcels drawn solid (`#built`), and the rest is the road and lot
fabric (`#landscape`). Everything below a size floor is dropped, which is how the logo, the legend
and the wordmark come off — a drawing that keeps its labels is a drawing that measures.

*From an aerial* it thresholds the plate three ways: hard un-green surfaces become the smallest
rectangle around each one (`#built`), their hull becomes the site outline (`#boundary`), and the
blurred luminance and the water become smooth contours (`#landscape`).

Either way every stroke is a statement about pixels that are actually in the source, so it cannot
invent a building — the whole reason it is allowed to stand in. `from` names that source, so the
drawing is checkable against it.

**`ai-derived`** — a generative line-art pass over a render. A model can put a building where none
was built, so this needs `approvedBy` — the founder or the studio — before it ships, is set in a
looser sketch register, and is never the sales masterplan (that stays the static labelled figure
lower on the page, §10).

## Look at every drawing before it ships

`npm run trace:plans` writes a file; it does not judge one. Point `from` at a labelled sales
masterplan and the tracer will hand you its sector names and lot letters as rectangles, because to
a threshold a word is just a bright compact shape — Selvadentro's masterplan does exactly this,
which is why its drawing still comes from its aerial and the masterplan stays a figure lower on the
page. Render each result over its source and look at it.

## Replacing a traced plan with the real one

Drop the studio's SVG in as `<slug>.svg`, set `source: architect`, remove `from`, run
`npm run check:plans`. Nothing else changes: the same three groups drive the same drawing.
