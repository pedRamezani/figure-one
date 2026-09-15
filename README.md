# Figure One

Build the participant flow diagram your paper needs, and export it print-ready.

**[figureone.app](https://figureone.app)**

Figure One is a browser-based editor for [CONSORT](https://www.consort-statement.org/) and [PRISMA](https://www.prisma-statement.org/) flow diagrams. You lay the boxes out on a canvas, type the counts in, and the figure is typeset by [Typst](https://typst.app/) as you work. Nothing is uploaded: the compiler runs in your browser as WebAssembly, and your flowchart is stored locally.

## What it does

- **A node canvas, not a form.** Drag from a box's handle to create the next one. The layout button arranges everything; you can also place boxes by hand.
- **Type whichever number you have.** A step holds both the population remaining and the number excluded, tied by `value = parent − delta`. A paper might report either one, so enter either and the other follows — and it keeps following when a count upstream changes.
- **Sub-populations and substeps.** Break a population down by source — one row per database in a systematic review — or itemise what an exclusion removed.
- **Split arms.** Branch into treatment and control and keep the stages aligned across both.
- **Real typesetting control.** Fonts, digit grouping, box fills, insets, corner radii, arrow bodies and heads, alignment of every label and count, title placement and caption.
- **Export what the journal asks for.** PDF and SVG for vector submission, PNG at 96, 150, 300 or 600 dpi with the pixel dimensions shown before you pick.

## Saving and sharing

Your work is saved to `localStorage` as you type, so closing the tab does not lose it.

Two file formats come out of the Export menu, and either can be opened again by dropping it anywhere on the page:

| File             | Contents                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `name.json`      | The **project**: the graph, the styling, and the name. This is the one to keep.                |
| `name.data.json` | The **data**: steps, splits and groups with no styling. Machine-readable, for reuse elsewhere. |

Both carry a `$kind` and a version, and older files are migrated on open — including flowcharts exported before the project format existed.

## Running it locally

```sh
npm install
npm run dev
```

| Command           |                                        |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Development server                     |
| `npm run build`   | Production build                       |
| `npm run preview` | Build, then serve it through Wrangler  |
| `npm test`        | Vitest, once                           |
| `npm run check`   | `svelte-check`                         |
| `npm run lint`    | Prettier and ESLint                    |
| `npm run deploy`  | Build and deploy to Cloudflare Workers |

## How it is put together

SvelteKit 2 and Svelte 5 runes, [`@xyflow/svelte`](https://svelteflow.dev/) for the canvas, [`typst.ts`](https://github.com/Myriad-Dreamin/typst.ts) for in-browser compilation, Zod for reading documents, Tailwind v4 with [shadcn-svelte](https://shadcn-svelte.com/), deployed to Cloudflare Workers.

```
src/lib/
  document/   Reading, writing, versioning and migrating flowchart files
  flow/       The node vocabulary: node types, handles, edges, rows, layout
  preview/    The four views — flow, style, Typst, JSON — and the Typst template's inputs
  components/ ui/ is shadcn; composed/ is what is built on top of it
static/figure1.typ   The Typst template that draws the figure
```

## Licence

[MIT](LICENSE).

Inter, in `static/fonts/`, is licensed separately under the [SIL Open Font License 1.1](static/fonts/LICENSE-Inter.txt).

The icon is set in [Magra](https://fonts.google.com/specimen/Magra), also under the SIL Open Font License 1.1.

## Citing

If Figure One produced a figure for your paper, please consider citing this repository. [`CITATION.cff`](CITATION.cff) has the details, and GitHub's **Cite this repository** button will format it for you.
