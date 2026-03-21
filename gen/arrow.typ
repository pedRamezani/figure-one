// ============================
// Imports
// ============================
// Module
#import "@preview/fletcher:0.5.8" as fletcher: diagram, edge, node

#set text(font: "New Computer Modern")

#set page(
  width: auto, 
  height: auto,
  margin: .25em,
  fill: none
)

#let arrow() = {
  let arrowBodies = ("-", "=", "==", "--", "..")

  let arrowHeads = (
    ">",
    ">>",
    ">>>",
    "o",
    "O",
    "|>",
    "}>",
    "x",
    "X",
    "*",
    "@",
    "[]",
    "<>"
  )

  diagram(
      spacing: (2em, 1em),
      for (i, body) in arrowBodies.enumerate() {
        node((0,i), none, name: <A>)
        edge("r", body)
        node((1,i), none, name: <B>)
      },
      // edge(<A>, <B>, marks: (none, "head"), "double")
      for (i, body) in arrowHeads.enumerate() {
        node((0,i + arrowBodies.len()), none, name: <A>)
        edge("r", "-" + body)
        node((1,i + arrowBodies.len()), none, name: <B>)
      }
  )
}

// ----------------------------
// Render
// ----------------------------
#arrow()