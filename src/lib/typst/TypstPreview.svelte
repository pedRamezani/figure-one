<script lang="ts">
	import { useSvelteFlow } from '@xyflow/svelte';
	import TypstDocument from './TypstDocument.svelte';

	import { convertFlowchartToTypstJson } from './index.ts';

	const { toObject } = useSvelteFlow();

	const source: string = $derived.by(() => {
		const jsonData = convertFlowchartToTypstJson(toObject());

		let typstObject = JSON.stringify(jsonData)
			.replace(/{/g, '(')
			.replace(/}/g, ')')
			.replace(/\("/g, '(')
			.replace(/":/g, ':')
			.replace(/,"/g, ',')
			.replace(/\[/g, '(')
			.replace(/\]/g, ')');

		typstObject = typstObject.slice(0, typstObject.length - 1) + ',)';
		typstObject = typstObject.replace(/\)\),/g, ',)),').replace(/\(,\)/g, '()');

		return `
#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge
#import fletcher.shapes: house, hexagon
#set page(width: auto, height: auto, margin: 2mm, fill: white)
// #set text(font: "New Computer Modern")

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

#let jsonData = ${typstObject}
#figure-1(jsonData)
`.trim();
	});

	// Typst
	// let isLoading = $state(true);
	// let artifact = $state<Uint8Array<ArrayBuffer> | undefined>();

	// onMount(async () => {
	// 	const buffer = fetch('figure2.artifact.sir.in').then((response) => response.arrayBuffer());

	// 	buffer.then((value) => {
	// 		artifact = new Uint8Array(value);
	// 		isLoading = false;
	// 	});
	// });
</script>

<h2 class="font-bold text-xl mb-2">Typst preview</h2>
<div>
	<!-- {#if isLoading}
		<p>Loading...</p>
	{:else}
		<TypstDocument {artifact} />
	{/if} -->
	<TypstDocument {source} />
</div>
