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

#let mapped-col(col) = {
  if col == 0 {
    return 0
  }
  
  // calc.pow(-1, col) * (col - calc.rem-euclid(col, 2)) - 1
  // col * 2
  col * 2 - 2
}

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

  let group-col = calc.min(..data.map(it => mapped-col(it.col))) - 1

  let split-row = calc.min(..data.map(it => it.row).sorted().windows(2).filter(w => w.at(0) == w.at(1)).map(w => w.at(0)))

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
          (mapped-col(it.col) + 1, it.row * 2 - 1),
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
        (mapped-col(it.col), it.row * 2),
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

      if next != none {
        styled-edge(
          (mapped-col(it.col), it.row * 2),
          (mapped-col(next.col), next.row * 2),
          a.arrow,
        )
      }
    },

    // ----------------------------
    // Split population flow
    // ----------------------------
    for it in data.filter(it => it.row == split-row) {
      styled-edge(
        (mapped-col(0), split-row * 2 - 2),
        (mapped-col(it.col), it.row * 2),
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