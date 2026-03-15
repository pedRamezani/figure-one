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
  data.groups.remove("", default: none)

  let groups = ()
  for (group, rows) in data.groups.pairs() {
    let r-min = calc.min(..rows)
    let r-max = none
    for (prev, next) in rows.sorted().windows(2) {
      if prev + 1 != next {
        r-max = prev
        groups.push((
          label: group,
          start: r-min,
          end: r-max
        ))
        r-min = next
        r-max = none
      }
    }

    if r-max == none {
      r-max = calc.max(..rows)
      groups.push((
        label: group,
        start: r-min,
        end: r-max
      ))
    }
  }
  
  groups
}

// ----------------------------
// Array helper
// ----------------------------
#let as-array(value) = {
  if type(value) == array {
    value
  } else {
    (value, )
  }
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

  // Col mapping function
  let mapped-col(col, max-cols: none) = {
    if max-cols == none or max-cols <= 1 {
      col * 2
    } else {
      col * 2 - max-cols + 1
    }
  }

  // Calculate min col - 1 for group box placement
  let group-col = - 1

  let steps = (..data.steps.main, ..data.steps.splits)

  diagram(
    spacing: d.spacing * 1pt,
    cell-size: (d.cellWidth * 1mm, d.cellHeight * 1mm),
    mark-scale: a.markScale * 1%,

    // ----------------------------
    // Population + exclusion boxes
    // ----------------------------
    for (row, val) in steps.enumerate() {
      let vals = as-array(val)

      let max-cols = vals.len()

      for (col, it) in vals.enumerate() {

        if it == none {
          continue
        }

        // Population box
        let population-col = mapped-col(col, max-cols: max-cols)
        styled-node(
          (population-col, row * 2),
          it.label + "\n" + str(it.value),
          tint: tint-mapping.at(m.tint),
          width: m.width * 1mm,
        )

        group-col = calc.min(group-col, population-col - 1)

        // Exclusion box (optional) + Edge
        if it.delta != none {
          // Population → exclusion
          styled-edge(
            (population-col, (row - 1) * 2),
            (population-col, row * 2 - 1),
            (population-col + 1, row * 2 - 1),
            a.arrow
          )

          // Exclusion box
          styled-node(
            (population-col + 1, row * 2 - 1),
            str(it.delta.value)
              + " "
              + it.delta.label
              + pad(
                grid(
                  ..for s in it.delta.substeps {
                    (str(s.value), s.label)
                  }, 
                  inset: 0pt,
                  column-gutter: 0.4em,
                  row-gutter:  0.6em,
                  columns: 2,
                  align: (right, left),
                ), 
                left: 3 * 0.5em, 
                top: -1.2em + 0.6em
              ),
            tint: tint-mapping.at(s.tint),
            width: s.width * 1mm,
          )
        }
      }
    },

    // ----------------------------
    // Population flow
    // ----------------------------
    for (row, (prev, next)) in steps.windows(2).enumerate() {
      let prev-vals = as-array(prev)
      let next-vals = as-array(next)

      let max-cols = next-vals.len()
      if prev-vals.len() == max-cols {
        // Vertical flow
        for (col, (p-it, n-it)) in prev-vals.zip(next-vals).enumerate() {
          if n-it == none {
            continue
          }

          let population-col = mapped-col(col, max-cols: max-cols)
          styled-edge(
            (population-col, row * 2),
            (population-col, (row + 1) * 2),
            a.arrow,
          )
        }
      } else if prev-vals.len() == 1 {
        // Split flow
        let p-it = prev-vals.at(0)
        for (col, n-it) in next-vals.enumerate() {
          if n-it == none {
            continue
          }

          let population-col = mapped-col(col, max-cols: max-cols)
          let steps = (
            (mapped-col(0), row * 2),
            (mapped-col(0), row * 2 + 1),
            (population-col, row * 2 + 1),
            (population-col, (row + 1) * 2)
          ).dedup()

          styled-edge(
            ..steps,
            a.arrow,
          )
        }
      }
    },

    // ----------------------------
    // Group boxes
    // ----------------------------
    let interpolate = 0.25,
    for gr in groups(data) {
      let at-start = gr.start == 0
      let at-end = gr.end == steps.len() -1

      let start-offset = if at-start {
        0
      } else {
        -1
      }

      let end-offset = if at-end {
        1
      } else {
        0
      }

      styled-node(
        (group-col, -1),
        rotate(gr.label, -90deg, reflow: true),
        tint: tint-mapping.at(g.tint),
        width: auto,
        enclose: (
          (group-col, 2 * gr.start + start-offset - interpolate),
          (group-col, 2 * gr.end + + end-offset + interpolate)
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