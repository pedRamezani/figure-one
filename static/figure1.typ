// Module imports
#import "@preview/fletcher:0.5.8" as fletcher: diagram, edge, node
#import fletcher.shapes: hexagon, house

// Page settings
#set page(width: auto, height: auto, margin: 5mm, fill: white)
#set text(font: "New Computer Modern")

// Data imports
#let style = json("/assets/style.json")
#let data = json("/assets/flowchart.json")

// Helpers
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

#let styled-node(pos, label, width: 80mm, tint: white, ..args) = {
  let n = style.node

  node(
    pos,
    align(left, label),
    width: width,
    fill: tint.lighten(60%),
    stroke: n.stroke * 1pt + tint.darken(20%),
    corner-radius: n.cornerRadius * 1pt,
    ..args,
  )
}

#let styled-edge(vertices, label, mark, width: 80mm, tint: black, ..args) = {
  let e = style.edge

  edge(
    vertices, label, mark,
    stroke: e.stroke * 1pt + tint,
    corner-radius: e.cornerRadius * 1pt,
    ..args,
  )
}

#let figure-1(data, groups) = {
  let d = style.diagram
  let a = style.mark
  let m = style.mainBox
  let s = style.stepBox
  let g = style.groupBox

  diagram(
    spacing: d.spacing * 1pt,
    cell-size: (d.cellWidth * 1mm, d.cellHeight * 1mm),
    mark-scale: a.markScale * 1%,

    for (i, value) in data.enumerate() {
      // Main Box
      styled-node(
        (0, 2 * i),
        data.at(i).stepLabel + "\n" + str(data.at(i).value),
        tint: tint-mapping.at(m.tint),
        width: m.width * 1mm,
      )

      if i != data.len() - 1 {
        // Main to main
        styled-edge(((0, 2 * i), (0, 2 * (i + 1))), auto, a.arrow)
        // Main to step
        styled-edge(auto, "d,r", a.arrow)
        // Step Box
        styled-node(
          (1, 2 * i + 1),
          str(data.at(i + 1).delta)
            + " "
            + data.at(i + 1).droppedLabel
            + for value in data.at(i + 1).substepDeltas {
              "\n    " + str(value.delta) + " " + value.label
            },
          tint: tint-mapping.at(s.tint),
          width: s.width * 1mm,
        )
      }
    },

    for (start, end) in groups {
      // Group Box
      styled-node(
        (-1, -1),
        rotate(data.at(start).group, -90deg, reflow: true),
        tint: tint-mapping.at(g.tint),
        width: auto,
        enclose: ((-1, 2 * start - 0.25), (-1, 2 * end + 1 + 0.25)),
      )
    },
  )
}

#let groups(data) = {
  let result = ()
  let current = none

  for (i, key) in data.enumerate() {
    if key.group == "" {
      if current != none {
        result.push((current, i - 1))
        current = none
      }
    } else {
      if current == none {
        current = i
      } else if key.group != data.at(i - 1).group {
        result.push((current, i - 1))
        current = i
      }
    }
  }

  if current != none {
    result.push((current, data.len() - 1))
  }

  result
}

#let groups = groups(data);

= Figure 1
#figure-1(data, groups)
