// ============================
// Imports
// ============================
// Module
#import "@preview/fletcher:0.5.8" as fletcher: diagram, edge, node

// Data
#let style = json("/assets/style.json")
#let data = json("/assets/flowchart.json")

// ============================
// Helpers
// ============================
#let tint-mapping = (
  black: luma(0),
  gray: luma(170),
  silver: luma(221),
  white: luma(255),
  navy: rgb("#001f3f"),
  blue: rgb("#0074d9"),
  aqua: rgb("#7fdbff"),
  teal: rgb("#39cccc"),
  eastern: rgb("#239dad"),
  purple: rgb("#b10dc9"),
  fuchsia: rgb("#f012be"),
  maroon: rgb("#85144b"),
  red: rgb("#ff4136"),
  orange: rgb("#ff851b"),
  yellow: rgb("#ffdc00"),
  olive: rgb("#3d9970"),
  green: rgb("#2ecc40"),
  lime: rgb("#01ff70"),
)

#let alignment-mapping = (
  left: alignment.left,
  center: alignment.center,
  right: alignment.right,
)

// ============================
// Page
// ============================
#set document(
  title: style.page.title,
  description: "A CONSORT flowchart diagram",
  keywords: ("flowchart", "figure1")
)

#show heading: set align(alignment-mapping.at(style.page.titleAlign))

#set page(
  width: auto, 
  height: auto,
  margin: style.page.margin * 1mm,
  fill: tint-mapping.at(style.page.tint).lighten(80%)
)

#set text(font: "New Computer Modern")

// ============================
// Styled primitives
// ============================
#let styled-node(pos, label, width: 80mm, tint: white, ..args) = {
  let n = style.node

  node(
    pos,
    align(left, text(label, fill: tint.darken(100%))),
    width: width,
    fill: tint.lighten(60%),
    stroke: n.stroke * 1pt + tint.darken(20%),
    corner-radius: n.cornerRadius * 1pt,
    ..args,
  )
}

#let styled-edge(tint: black, ..args) = {
  let e = style.edge

  edge(
    stroke: e.stroke * 1pt + tint,
    corner-radius: e.cornerRadius * 1pt,
    ..args
  )
}

// ----------------------------
// Group calculation (by rows)
// ----------------------------
#let groups(data) = {
  data.map(it => it.group).filter(g => g != "").dedup().map(
    g => {
      let rows = data.filter(it => it.group == g).map(it => it.row)
      let r-min = calc.min(..rows)
      let r-max = calc.max(..rows)

      (
        label: g,
        start: r-min,
        end: r-max
      )
    }
  )
}

// ----------------------------
// Diagram
// ----------------------------
#let figure-1(data) = {
  let d = style.diagram
  let a = style.mark
  let m = style.mainBox
  let s = style.stepBox
  let g = style.groupBox

  // Find split row
  let split-row = data.map(it => it.row).sorted().windows(2).filter(w => w.at(0) == w.at(1)).map(w => w.at(0)).reduce((acc, it) => calc.min(acc, it))

  // Find split parent if possible
  let split-parent = none
  if split-row != none {
    split-parent = data.find(it => it.row == split-row - 1)
  }

  // Calculate column shift for rows >= split-row
  let max-col = data.map(it => it.col).reduce((acc, it) => calc.max(acc, it))

  // Col mapping function
  let mapped-col(col, row: none) = {
    if row == none or split-row == none or row < split-row {
      col * 2
    } else {
      col * 2 - max-col
    }
  }

  // Calculate min col - 1 for group box placement
  let group-col = calc.min(..data.map(it => mapped-col(it.col, row: it.row))) - 1

  diagram(
    spacing: d.spacing * 1pt,
    cell-size: (d.cellWidth * 1mm, d.cellHeight * 1mm),
    mark-scale: a.markScale * 1%,

    // ----------------------------
    // Population + exclusion boxes
    // ----------------------------
    // Sorting is needed for correct "d,r" arrows later
    for it in data.sorted(key: it => (it.col, it.row)) {
      // Exclusion box (optional) + Edge
      if it.delta != none {
        // Population → exclusion
        styled-edge(
          "d,r", 
          a.arrow
        )

        // Exclusion box
        styled-node(
          (mapped-col(it.col, row: it.row) + 1, it.row * 2 - 1),
          str(it.delta.value)
            + " "
            + it.delta.label
            + for s in it.delta.substeps {
              "\n    " + str(s.value) + " " + s.label
            },
          tint: tint-mapping.at(s.tint),
          width: s.width * 1mm,
        )
      }

      // Population box
      styled-node(
        (mapped-col(it.col, row: it.row), it.row * 2),
        it.label + "\n" + str(it.value),
        tint: tint-mapping.at(m.tint),
        width: m.width * 1mm,
      )
    },

    // ----------------------------
    // Vertical population flow
    // ----------------------------
    for it in data {
      let next = data.find(
        n => n.col == it.col and n.row == it.row + 1
      )

      if next != none and (
        split-row == none
        or next.row != split-row
      ) {
        styled-edge(
          (mapped-col(it.col, row: it.row), it.row * 2),
          (mapped-col(next.col, row: next.row), next.row * 2),
          a.arrow,
        )
      }
    },

    // ----------------------------
    // Split population flow
    // ----------------------------
    for it in data.filter(it => it.row == split-row) {
      let steps = (
        (mapped-col(split-parent.col), split-parent.row * 2),
        (mapped-col(split-parent.col), split-parent.row * 2 + 1),
        (mapped-col(it.col, row: it.row), split-parent.row * 2 + 1),
        (mapped-col(it.col, row: it.row), split-row * 2)
      ).dedup()

      styled-edge(
        ..steps,
        a.arrow,
      )
    },

    // ----------------------------
    // Group boxes
    // ----------------------------
    for gr in groups(data) {
      styled-node(
        (group-col, -1),
        rotate(gr.label, -90deg, reflow: true),
        tint: tint-mapping.at(g.tint),
        width: auto,
        enclose: (
          (group-col, 2 * gr.start - 0.25),
          (group-col, 2 * gr.end + 1 + 0.25)
        ),
      )
    }
  )
}

// ----------------------------
// Render
// ----------------------------
#heading(text(style.page.title))
#figure-1(data)