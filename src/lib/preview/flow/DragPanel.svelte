<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { buttonVariants } from '@/components/ui/button/index.js';

	import OpenIcon from '@lucide/svelte/icons/blocks';

	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import * as Popover from '@/components/ui/popover/index.js';

	const medium = new MediaQuery('max-width: 48rem');

	const panelTitel = 'Available nodes';
	const panelDescription = 'Click or drag to add nodes.';

	import { dragAndDropNodeType } from './drag-and-drop-node.svelte';
	import { type RegisteredNodeType, dragPanelNodes } from '@/nodes/types';
	import { addNode } from './Flow.svelte';

	import { useNodes, useSvelteFlow } from '@xyflow/svelte';

	const nodes = useNodes();
	const { fitView } = useSvelteFlow();
	const offset: [number, number] = [0.3, 0.3];
	const onClick = (nodeType: RegisteredNodeType) => {
		const position = nodes.current.at(-1)?.position ?? { x: 0, y: 0 };
		const width = nodes.current.at(-1)?.measured?.width ?? 0;
		const height = nodes.current.at(-1)?.measured?.height ?? 0;
		const origin = nodes.current.at(-1)?.origin ?? [0, 0];
		addNode(
			nodeType,
			{
				x: position.x + (0.5 - origin[0] + offset[0]) * width,
				y: position.y + (0.5 - origin[1] + offset[1]) * height
			},
			[0.5, 0.5]
		);
		fitView();
	};

	const onDragStart = (event: DragEvent, nodeType: RegisteredNodeType) => {
		if (!event.dataTransfer) {
			return null;
		}

		dragAndDropNodeType.current = nodeType;

		event.dataTransfer.effectAllowed = 'move';
	};
</script>

{#snippet panelContent()}
	{#each dragPanelNodes as [nodeType, config]}
		{#if config !== null}
			<nav on:dragstart={(event) => onDragStart(event, nodeType)} draggable={true}>
				<Button variant="secondary" size="sm" onclick={() => onClick(nodeType)}
					><svelte:component this={config.icon} class="size-4! stroke-2" />{config.label}</Button
				>
			</nav>
		{/if}
	{/each}
{/snippet}

{#if medium.current}
	<Popover.Root>
		<Popover.Trigger
			title="Open Drag & Drop Panel"
			aria-label="Open Drag & Drop Panel"
			class={buttonVariants({ variant: 'outline', size: 'icon' })}><OpenIcon /></Popover.Trigger
		>
		<Popover.Content align="end" side="top" class="max-w-xs">
			<div class="grid gap-4">
				<div class="space-y-2">
					<h4 class="leading-none font-medium">{panelTitel}</h4>
					<p class="text-muted-foreground text-sm">{panelDescription}</p>
				</div>
				<div class="flex flex-wrap gap-2">
					{@render panelContent()}
				</div>
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	<Card.Root>
		<Card.Header>
			<Card.Title>{panelTitel}</Card.Title>
			<Card.Description>{panelDescription}</Card.Description>
		</Card.Header>
		<Card.Content class="flex gap-4 min-w-sm">
			{@render panelContent()}
		</Card.Content>
	</Card.Root>
{/if}
