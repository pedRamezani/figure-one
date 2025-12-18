#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge
#import fletcher.shapes: house, hexagon
#set page(width: auto, height: auto, margin: 5mm, fill: white)
#set text(font: "New Computer Modern")

= Figure 1

#let blob(pos, label, width: 80mm, tint: white, ..args) = node(
	pos, align(left, label),
	width: width,
	fill: tint.lighten(60%),
	stroke: 1pt + tint.darken(20%),
	corner-radius: 5pt,
	..args,
)

#let figure-1(data, groups) = diagram(
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
  },

  for (start, end) in groups {
    blob(
      (-1, -1), 
      rotate(data.at(start).group, -90deg, reflow: true),
      tint: green,
      width: auto,
      enclose: ((-1, 2*start - 0.25), (-1, 2*end + 1 + 0.25))
    )
  }
)

#let groups(data) = {
  let result = ();
  let current = none;

  for (i, key) in data.enumerate() {
    if key.group == "" {
      if current != none {
        result.push((current, i - 1));
        current = none;
      }
    } else {
      if current == none {
        current = i;
      } else if key.group != data.at(i - 1).group {
        result.push((current, i - 1));
        current = i;
      }
    }
  }

  if current != none {
    result.push((current, data.len() - 1));
  }

  result
}


#let data = json("/assets/flowchart.json")
#let groups = groups(data);
#figure-1(data, groups)
