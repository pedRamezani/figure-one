<script lang="ts">
	import { styleConfig, type Tint, type ArrowBody, type ArrowHead } from './style-config.svelte';

	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '@/components/ui/input';
	import * as Select from '@/components/ui/select';

	// Allowed tint keys (Typst tint-mapping)
	const tintOptions: Tint[] = [
		'black',
		'gray',
		'silver',
		'white',
		'navy',
		'blue',
		'aqua',
		'teal',
		'eastern',
		'purple',
		'fuchsia',
		'maroon',
		'red',
		'orange',
		'yellow',
		'olive',
		'green',
		'lime'
	];

	// Arrow body + head options
	const arrowBodies: ArrowBody[] = ['-', '=', '==', '--', '..'];
	const arrowHeads: ArrowHead[] = [
		'>',
		'>>',
		'>>>',
		'o',
		'0',
		'|>',
		'}>',
		'x',
		'X',
		'*',
		'@',
		'[]',
		'<>'
	];

	let arrowBody = $state<ArrowBody>('-');
	let arrowHead = $state<ArrowHead>('|>');

	function arrowUpdate() {
		styleConfig.edges.arrow = `${arrowBody}${arrowHead}`;
	}
</script>

<div class="flex flex-col h-full gap-2 py-4">
	<!-- BLOB SETTINGS -->
	<Field.Set>
		<Field.Legend>Blob Settings</Field.Legend>
		<Field.Description>Customise general node blob appearance.</Field.Description>
		<Field.Group>
			<Field.Field>
				<Field.Label for="blob-corner-radius">Corner Radius (pt)</Field.Label>
				<Input name="blob-corner-radius" type="number" bind:value={styleConfig.blob.cornerRadius} />
			</Field.Field>
			<Field.Field>
				<Field.Label for="blob-stroke">Stroke (pt)</Field.Label>
				<Input name="blob-stroke" type="number" bind:value={styleConfig.blob.stroke} />
			</Field.Field>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- EDGE SETTINGS -->
	<Field.Set>
		<Field.Legend>Edges</Field.Legend>
		<Field.Description>Customise general edge appearance.</Field.Description>
		<Field.Group>
			<Field.Field>
				<Field.Label>Edge Stroke (pt)</Field.Label>
				<Input type="number" bind:value={styleConfig.edges.stroke} />
			</Field.Field>

			<Field.Field>
				<Field.Label>Edge Corner Radius (pt)</Field.Label>
				<Input type="number" bind:value={styleConfig.edges.cornerRadius} />
			</Field.Field>

			<Field.Field>
				<Field.Label>Arrow Body</Field.Label>
				<Select.Root type="single" bind:value={arrowBody} onValueChange={arrowUpdate}>
					<Select.Trigger>{arrowBody}</Select.Trigger>
					<Select.Content>
						{#each arrowBodies as body}
							<Select.Item value={body}>{body}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>

			<Field.Field>
				<Field.Label>Arrow Head</Field.Label>
				<Select.Root type="single" bind:value={arrowHead} onValueChange={arrowUpdate}>
					<Select.Trigger>{arrowHead}</Select.Trigger>
					<Select.Content>
						{#each arrowHeads as head}
							<Select.Item value={head}>{head}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- DIAGRAM SETTINGS -->
	<Field.Set>
		<Field.Legend>Diagram</Field.Legend>
		<Field.Description>Customise diagram appearance.</Field.Description>
		<Field.Group>
			<Field.Field>
				<Field.Label>Spacing (pt)</Field.Label>
				<Input type="number" bind:value={styleConfig.diagram.spacing} />
			</Field.Field>

			<Field.Field>
				<Field.Label>Cell Width (mm)</Field.Label>
				<Input type="number" bind:value={styleConfig.diagram.cellWidth} />
			</Field.Field>

			<Field.Field>
				<Field.Label>Cell Height (mm)</Field.Label>
				<Input type="number" bind:value={styleConfig.diagram.cellHeight} />
			</Field.Field>

			<Field.Field>
				<Field.Label>Mark Scale (%)</Field.Label>
				<Input type="number" min="0" max="100" bind:value={styleConfig.diagram.markScale} />
			</Field.Field>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- MAIN BOX -->
	<Field.Set>
		<Field.Legend>Main Box</Field.Legend>
		<Field.Description>Customise main box appearance.</Field.Description>
		<Field.Group>
			<Field.Field>
				<Field.Label>Tint</Field.Label>
				<Select.Root type="single" bind:value={styleConfig.mainBox.tint}>
					<Select.Trigger>{styleConfig.mainBox.tint}</Select.Trigger>
					<Select.Content>
						{#each tintOptions as t}
							<Select.Item value={t}>{t}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>

			<Field.Field>
				<Field.Label>Width (mm or "auto")</Field.Label>
				<Input bind:value={styleConfig.mainBox.width} />
			</Field.Field>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- STEP BOX -->
	<Field.Set>
		<Field.Legend>Step Box</Field.Legend>
		<Field.Description>Customise step box appearance.</Field.Description>
		<Field.Group>
			<Field.Field>
				<Field.Label>Tint</Field.Label>
				<Select.Root type="single" bind:value={styleConfig.stepBox.tint}>
					<Select.Trigger>{styleConfig.stepBox.tint}</Select.Trigger>
					<Select.Content>
						{#each tintOptions as t}
							<Select.Item value={t}>{t}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>

			<Field.Field>
				<Field.Label>Width (mm or "auto")</Field.Label>
				<Input bind:value={styleConfig.stepBox.width} />
			</Field.Field>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- GROUP BOX -->
	<Field.Set>
		<Field.Legend>Group Box</Field.Legend>
		<Field.Description>Customise group box appearance.</Field.Description>
		<Field.Group>
			<Field.Field>
				<Field.Label>Tint</Field.Label>
				<Select.Root type="single" bind:value={styleConfig.groupBox.tint}>
					<Select.Trigger>{styleConfig.groupBox.tint}</Select.Trigger>
					<Select.Content>
						{#each tintOptions as t}
							<Select.Item value={t}>{t}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>
		</Field.Group>
	</Field.Set>
</div>
