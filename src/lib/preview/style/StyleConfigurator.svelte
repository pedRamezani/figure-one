<script lang="ts">
	import {
		styleConfig,
		tintOptions,
		arrowBodies,
		arrowHeads,
		aligmentOptions,
		type ArrowBody,
		type ArrowHead,
		type Alignment
	} from './style-config.svelte';

	import Button from '@/components/ui/button/button.svelte';
	import * as Field from '@/components/ui/field/index.js';
	import * as Select from '@/components/ui/select';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';

	import SimpleField from './SimpleField.svelte';

	import TextAlignStartIcon from '@lucide/svelte/icons/text-align-start';
	import TextAlignCenterIcon from '@lucide/svelte/icons/text-align-center';
	import TextAlignEndIcon from '@lucide/svelte/icons/text-align-end';
	import type { Component } from 'svelte';

	const aligmentMapping: Record<Alignment, Component> = {
		left: TextAlignStartIcon,
		center: TextAlignCenterIcon,
		right: TextAlignEndIcon
	};

	let arrowBody = $state<ArrowBody>('-');
	let arrowHead = $state<ArrowHead>('|>');

	function arrowUpdate() {
		styleConfig.current.mark.arrow = `${arrowBody}${arrowHead}`;
	}

	function restoreDefaults() {
		styleConfig.reset();
	}
</script>

<div class="flex flex-col h-full gap-2 py-4">
	<!-- PAGE SETTINGS -->
	<Field.Set>
		<Field.Legend>Page</Field.Legend>
		<Field.Description>Customise page appearance.</Field.Description>
		<Field.Group class="flex flex-row flex-wrap">
			<SimpleField title="Title" name="page-title" bind:value={styleConfig.current.page.title} />

			<Field.Field class="max-w-fit">
				<Field.Label for="page-title-aligment">Title Aligment</Field.Label>
				<!-- <Select.Root
					name="page-title-aligment"
					type="single"
					bind:value={styleConfig.current.page.titleAlign}
				>
					<Select.Trigger>{styleConfig.current.page.titleAlign}</Select.Trigger>
					<Select.Content>
						{#each aligmentOptions as body}
							<Select.Item value={body}>{body}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root> -->
				<ToggleGroup.Root
					type="single"
					variant="outline"
					bind:value={styleConfig.current.page.titleAlign}
				>
					{#each aligmentOptions as alignment}
						<ToggleGroup.Item
							value={alignment}
							aria-label="Toggle star"
							class="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary"
						>
							{@const Icon = aligmentMapping[alignment]}
							<Icon />
							{alignment.substring(0, 1).toUpperCase() + alignment.substring(1)}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Field.Field>

			<Field.Field class="max-w-2xs">
				<Field.Label for="page-tint">Tint</Field.Label>
				<Select.Root name="page-tint" type="single" bind:value={styleConfig.current.page.tint}>
					<Select.Trigger>{styleConfig.current.page.tint}</Select.Trigger>
					<Select.Content>
						{#each tintOptions as t}
							<Select.Item value={t}>{t}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>

			<SimpleField
				title="Margin (mm)"
				name="page-margin"
				bind:value={styleConfig.current.page.margin}
				min={0}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- DIAGRAM SETTINGS -->
	<Field.Set>
		<Field.Legend>Diagram</Field.Legend>
		<Field.Description>Customise diagram appearance.</Field.Description>
		<Field.Group class="flex flex-row flex-wrap">
			<SimpleField
				title="Spacing (pt)"
				name="diagram-spacing"
				bind:value={styleConfig.current.diagram.spacing}
			/>

			<SimpleField
				title="Minimum Cell Width (mm)"
				name="diagram-cell-width"
				bind:value={styleConfig.current.diagram.cellWidth}
				min={0}
			/>

			<SimpleField
				title="Minimum Cell Height (mm)"
				name="diagram-cell-height"
				bind:value={styleConfig.current.diagram.cellHeight}
				min={0}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- NODE SETTINGS -->
	<Field.Set>
		<Field.Legend>Nodes</Field.Legend>
		<Field.Description>Customise general node appearance.</Field.Description>
		<Field.Group class="flex flex-row flex-wrap">
			<SimpleField
				title="Stroke (pt)"
				name="node-stroke"
				bind:value={styleConfig.current.node.stroke}
				min={0}
			/>

			<SimpleField
				title="Corner Radius (pt)"
				name="node-corner-radius"
				bind:value={styleConfig.current.node.cornerRadius}
				min={0}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- EDGE SETTINGS -->
	<Field.Set>
		<Field.Legend>Edges</Field.Legend>
		<Field.Description>Customise general edge appearance.</Field.Description>
		<Field.Group class="flex flex-row flex-wrap">
			<SimpleField
				title="Stroke (pt)"
				name="edge-stroke"
				bind:value={styleConfig.current.edge.stroke}
				min={0}
			/>

			<SimpleField
				title="Corner Radius (pt)"
				name="edge-corner-radius"
				bind:value={styleConfig.current.edge.cornerRadius}
				min={0}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- MARK SETTINGS -->
	<Field.Set>
		<Field.Legend>Arrow</Field.Legend>
		<Field.Description>Customise general arrow appearance.</Field.Description>
		<Field.Group class="flex flex-row flex-wrap">
			<Field.Field class="max-w-2xs">
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

			<Field.Field class="max-w-2xs">
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

			<SimpleField
				title="Arrow Mark Scale (%)"
				name="edge-corner-radius"
				bind:value={styleConfig.current.mark.markScale}
				min={0}
				max={300}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- MAIN BOX -->
	<Field.Set>
		<Field.Legend>Main Box</Field.Legend>
		<Field.Description>Customise main box appearance.</Field.Description>
		<Field.Group class="flex flex-row flex-wrap">
			<Field.Field class="max-w-2xs">
				<Field.Label>Tint</Field.Label>
				<Select.Root type="single" bind:value={styleConfig.current.mainBox.tint}>
					<Select.Trigger>{styleConfig.current.mainBox.tint}</Select.Trigger>
					<Select.Content>
						{#each tintOptions as t}
							<Select.Item value={t}>{t}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>

			<SimpleField
				title="Width (mm)"
				name="mainbox-width"
				bind:value={styleConfig.current.mainBox.width}
				min={0}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- STEP BOX -->
	<Field.Set>
		<Field.Legend>Step Box</Field.Legend>
		<Field.Description>Customise step box appearance.</Field.Description>
		<Field.Group class="flex flex-row flex-wrap">
			<Field.Field class="max-w-2xs">
				<Field.Label>Tint</Field.Label>
				<Select.Root type="single" bind:value={styleConfig.current.stepBox.tint}>
					<Select.Trigger>{styleConfig.current.stepBox.tint}</Select.Trigger>
					<Select.Content>
						{#each tintOptions as t}
							<Select.Item value={t}>{t}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>

			<SimpleField
				title="Width (mm)"
				name="stepbox-width"
				bind:value={styleConfig.current.stepBox.width}
				min={0}
			/>
		</Field.Group>
	</Field.Set>
	<Field.Separator class="my-2" />

	<!-- GROUP BOX -->
	<Field.Set>
		<Field.Legend>Group Box</Field.Legend>
		<Field.Description>Customise group box appearance.</Field.Description>
		<Field.Group class="flex flex-row flex-wrap">
			<Field.Field class="max-w-2xs">
				<Field.Label>Tint</Field.Label>
				<Select.Root type="single" bind:value={styleConfig.current.groupBox.tint}>
					<Select.Trigger>{styleConfig.current.groupBox.tint}</Select.Trigger>
					<Select.Content>
						{#each tintOptions as t}
							<Select.Item value={t}>{t}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Field.Field>
		</Field.Group>
	</Field.Set>

	<Button variant="outline" class="self-end" onclick={restoreDefaults}>Restore defaults</Button>
</div>
