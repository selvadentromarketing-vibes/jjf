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

**`traced`** — what ships today, and what `npm run trace:plans` produces: a drawing read off the
project's own aerial by `scripts/trace-plan.mjs`. It thresholds the plate three ways — the hard
un-green surfaces become the smallest rectangle around each one (`#built`), their hull becomes the
site outline (`#boundary`), and the blurred luminance and the water become smooth contours
(`#landscape`) — so every stroke is a statement about pixels that are actually in the photograph.
It cannot invent a building, which is the whole reason it is allowed to stand in. `from` names the
plate so anyone can check the drawing against the picture on the same page.

**`ai-derived`** — a generative line-art pass over a render. A model can put a building where none
was built, so this needs `approvedBy` — the founder or the studio — before it ships, is set in a
looser sketch register, and is never the sales masterplan (that stays the static labelled figure
lower on the page, §10).

## Replacing a traced plan with the real one

Drop the studio's SVG in as `<slug>.svg`, set `source: architect`, remove `from`, run
`npm run check:plans`. Nothing else changes: the same three groups drive the same drawing.
