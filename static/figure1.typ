#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge
#import fletcher.shapes: house, hexagon
#set page(width: auto, height: auto, margin: 5mm, fill: white)
#set text(font: "New Computer Modern")

= Figure 1

#let blob(pos, label, tint: white, ..args) = node(
	pos, align(left, label),
	width: 80mm,
	fill: tint.lighten(60%),
	stroke: 1pt + tint.darken(20%),
	corner-radius: 5pt,
	..args,
)

#let figure-1(data) = diagram(
  spacing: 8pt,
	cell-size: (8mm, 10mm),
	edge-stroke: 1pt,
	edge-corner-radius: 5pt,
	mark-scale: 70%,

  for (i, value) in data.enumerate() {
    blob(
      (0, 2*i), 
      data.at(i).stepLabel + "\n" + str(data.at(i).value)
    )

    if i != data.len() - 1 {
      edge((0, 2*i), (0,2*(i+1)), "-|>")
      edge("d,r", "-|>")
      blob(
        (1,2*i+1),
        str(data.at(i+1).delta) + " " + data.at(i+1).droppedLabel + 
        for value in data.at(i+1).substepDeltas {
          "\n    " + str(value.delta) + " " + value.label
        }
      )
    }
  }
)

#figure-1(json("./test.json"))
