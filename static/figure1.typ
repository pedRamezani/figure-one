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

#let get-tint(value) = {
  if value in tint-mapping {
    return tint-mapping.at(value)
  } else {
    return rgb(value)
  }
}

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
  keywords: ("flowchart", "figure1"),
)

#show heading: set align(alignment-mapping.at(style.page.titleAlign))

#set page(
  width: auto,
  height: auto,
  margin: style.page.margin * 1mm,
  fill: if style.page.transparent { none } else { get-tint(style.page.tint).lighten(80%) },
)

#set text(font: style.page.font)

// ============================
// Styled primitives
// ============================
#let styled-node(pos, label, width: 80mm, tint: white, ..args) = {
  let n = style.node

  node(
    pos: pos,
    label: align(left, text(label, fill: tint.darken(100%))),
    inset: n.inset * 1pt,
    outset: n.outset * 1pt,
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
    ..args,
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
          end: r-max,
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
        end: r-max,
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
    (value,)
  }
}

// ----------------------------
// Small helpers
// ----------------------------
// Bold when the style asks for it.
#let weighted(body, bold) = if bold { strong(body) } else { body }

// A count wearing its configured prefix and suffix, such as "(n = 139)".
#let formatted-value(value, prefix, suffix) = prefix + str(value) + suffix

// Horizontal alignment from a style name.
#let to-align(name) = alignment-mapping.at(name)

// A "text-*" mode puts the value beside the label; anything else stacks it
// underneath.
#let beside-label(mode) = mode.starts-with("text")

// Within a beside-label mode, whether the value comes first.
#let value-leads(mode) = mode.ends-with("left")

// The label and value in reading order for a beside-label layout.
#let ordered-spans(label, value, mode) = if value-leads(mode) {
  (value, label)
} else {
  (label, value)
}

// ----------------------------
// Label and value layout
// ----------------------------
// Grid cells align to the top so a label that wraps onto several lines keeps
// its value level with the first line rather than floating to the middle.
#let labelled-value(label, value, mode, gutter: 0.4em, label-bold: false, value-bold: false) = {
  let label = weighted(label, label-bold)
  let value = weighted(value, value-bold)

  if beside-label(mode) {
    grid(
      ..ordered-spans(label, value, mode),
      inset: 0pt,
      column-gutter: gutter,
      columns: 2,
      align: top,
    )
  } else {
    label + pad(align(value, to-align(mode)), top: -0.5em)
  }
}

// The bullet or number shown before a substep. Exactly one of the two is set.
//
// Uses the native list and enum so markers and numbers pick up Typst's own
// spacing and styling rather than being hand-placed text. The body is empty
// because the label sits in the next grid column, not inside the item.
#let sub-marker(s, index) = {
  if s.subDeltaMarker != none {
    list(marker: s.subDeltaMarker, body-indent: 0mm, list.item[])
  } else if s.subDeltaNumbering != none {
    enum(numbering: s.subDeltaNumbering, body-indent: 0mm, enum.item(index + 1)[])
  }
}

// ----------------------------
// Box contents
// ----------------------------
// What goes inside a population box.
#let population-body(m, it) = align(
  to-align(m.textAlign),
  labelled-value(
    it.label,
    formatted-value(it.value, m.valuePrefix, m.valueSuffix),
    m.valueAlign,
    label-bold: m.labelBold,
    value-bold: m.valueBold,
  ),
)

// The list of substeps inside an exclusion box.
#let substep-list(s, substeps) = {
  let has-marker = s.subDeltaMarker != none or s.subDeltaNumbering != none
  let stacked = not beside-label(s.subDeltaAlign)
  let show-value = s.showSubDeltaValue
  let content-columns = if not show-value or stacked { 1 } else { 2 }

  let cells-for(i, sub) = {
    let value-text = formatted-value(sub.value, s.subDeltaPrefix, s.subDeltaSuffix)

    let cells = if not show-value {
      (weighted(sub.label, s.subDeltaLabelBold),)
    } else if stacked {
      (
        labelled-value(
          sub.label,
          value-text,
          s.subDeltaAlign,
          label-bold: s.subDeltaLabelBold,
          value-bold: s.subDeltaValueBold,
        ),
      )
    } else {
      ordered-spans(
        weighted(sub.label, s.subDeltaLabelBold),
        weighted(value-text, s.subDeltaValueBold),
        s.subDeltaAlign,
      )
    }

    if has-marker {
      (sub-marker(s, i), ..cells)
    } else {
      cells
    }
  }

  // Top, so a wrapped label keeps its N on the first line.
  let column-alignment = {
    let cols = if not show-value {
      // One column, positioned as a block by subDeltaTextAlign.
      (top + left,)
    } else if stacked {
      (top + to-align(s.subDeltaAlign),)
    } else if value-leads(s.subDeltaAlign) {
      (top + right, top + left)
    } else {
      (top + left, top + right)
    }

    if has-marker {
      (top + right, ..cols)
    } else {
      cols
    }
  }

  grid(
    ..for (i, sub) in substeps.enumerate() {
      cells-for(i, sub)
    },
    inset: 0pt,
    column-gutter: 1em / 3,
    row-gutter: 0.65em, // Default leading between lines of text
    columns: if has-marker { content-columns + 1 } else { content-columns },
    align: column-alignment,
  )
}

// What goes inside an exclusion box: its own label and count, then its substeps.
#let exclusion-body(s, delta) = {
  align(
    to-align(s.deltaTextAlign),
    labelled-value(
      delta.label,
      formatted-value(delta.value, s.deltaPrefix, s.deltaSuffix),
      s.deltaAlign,
      gutter: 1em / 3,
      label-bold: s.deltaLabelBold,
      value-bold: s.deltaValueBold,
    ),
  )
  pad(
    align(to-align(s.subDeltaTextAlign), substep-list(s, delta.substeps)),
    left: s.subDeltaIndent * 1em / 3,
    // Default spacing between paragraphs, plus a line when substeps follow.
    top: if delta.substeps.len() == 0 {
      -1.2em
    } else {
      -1.2em + 0.65em
    },
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

  // Col mapping function
  let mapped-col(col, max-cols: none) = {
    if max-cols == none or max-cols <= 1 {
      col * 2
    } else {
      col * 2 - max-cols + 1
    }
  }

  // Calculate min col - 1 for group box placement
  let group-col = -1

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
          population-body(m, it),
          tint: get-tint(m.tint),
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
            a.arrow,
          )

          // Exclusion box
          styled-node(
            (population-col + 1, row * 2 - 1),
            exclusion-body(s, it.delta),
            tint: get-tint(s.tint),
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
            (population-col, (row + 1) * 2),
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
      let at-end = gr.end == steps.len() - 1

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
        // TODO: Fix this workaround
        (group-col, -1),
        rotate(gr.label, -90deg, reflow: true),
        tint: get-tint(g.tint),
        width: auto,
        enclose: (
          (group-col, 2 * gr.start + start-offset - interpolate),
          (group-col, 2 * gr.end + end-offset + interpolate),
        ),
      )
    },
  )
}

// ----------------------------
// Render
// ----------------------------
// A published figure reads "**Figure 1.** Description ...", so the title is the
// bold part and the caption is regular weight after it.
#let title-block() = {
  if not style.page.showTitle {
    return
  }

  heading({
    text(style.page.title)
    if style.page.caption != "" {
      text(weight: "regular", " " + style.page.caption)
    }
  })
}

#if style.page.titlePlacement == "top" {
  title-block()
}

#figure-1(data)

#if style.page.titlePlacement == "bottom" {
  title-block()
}
