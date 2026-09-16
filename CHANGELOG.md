# Changelog

## [1.0.0] - 2026-09-16

First stable release. No functional changes from 0.1.0.

### Added

- **A DOI.** Figure One is archived on Zenodo and citable as
  [doi:10.5281/zenodo.22802169](https://doi.org/10.5281/zenodo.22802169). That DOI resolves to the newest version; each
  release also has its own.
- `CITATION.cff` now carries the DOI, version and release date, so GitHub's **Cite this
  repository** output includes them.

## [0.1.0] - 2026-09-15

First release.

### Added

- **A node canvas for CONSORT and PRISMA participant flow diagrams.** Drag from a box's
  handle to create the next box, or click a type in the panel to drop one where you are
  already looking. A layout pass arranges the chart; positions are yours to override.
- **Steps that hold both numbers.** A step carries the population remaining and the
  number excluded on the way in, tied by `value = parent − delta`. A paper may report
  either one, so typing either recomputes the other, and the invariant is restored when
  a count further up the chart changes.
- **Sub-populations and substeps.** Break a population down by source — one row per
  database searched in a systematic review — or itemise what an exclusion removed. Each
  gets its own numbering, bullet marker, indent, prefix and suffix.
- **Split arms.** Branch into treatment and control and keep the stages aligned across
  both. Rows are derived from the graph rather than stored on it, so adding or removing
  a stage cannot leave the two arms disagreeing.
- **Typesetting by Typst, in the browser.** The compiler runs as WebAssembly, so nothing
  is uploaded and the figure re-renders as you type. Fonts are New Computer Modern,
  Libertinus Serif, Inter and DejaVu Sans Mono.
- **Styling that matches what journals ask for.** Digit grouping with a choice of
  separator and the SI four-digit exception, per-role bold weights, box fills, insets,
  corner radii, arrow bodies and heads, horizontal and vertical spacing, minimum cell
  size, alignment of every label and count, and a title block with caption and
  placement.
- **Exports.** PDF and SVG for vector submission, and PNG at 96, 150, 300 or 600 dpi
  with the pixel dimensions shown before you choose. One project name governs all of
  them.
- **A project file that survives.** Work is saved to `localStorage` as you type, and
  exported as JSON in two forms: the project, which round-trips the graph and its
  styling, and the data document, which is the semantic form with no styling. Either can
  be reopened by dropping it anywhere on the page, and files written by older versions
  are migrated on open.

### Notes

- Runs entirely client-side; there is no account, no server and no upload.
- Deployed to Cloudflare Workers at [figureone.app](https://figureone.app).
