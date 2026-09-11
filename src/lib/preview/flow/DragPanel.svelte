<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { buttonVariants } from '@/components/ui/button/index.js';

	import OpenIcon from '@lucide/svelte/icons/blocks';

	import { cn } from '@/utils';

	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import * as Popover from '@/components/ui/popover/index.js';

	const medium = new MediaQuery('max-width: 48rem');

	const panelTitel = 'Available nodes';
	const panelDescription = 'Click or drag to add nodes.';

	import { dragAndDropNodeType } from './drag-and-drop-node.svelte';
	import { type RegisteredNodeType, dragPanelNodes } from '@/nodes/types';
	import { flowchartDocument } from '@/document/store.svelte';

	import { useNodes, useSvelteFlow } from '@xyflow/svelte';

	import { scale } from 'svelte/transition';

	const nodes = useNodes();
	const { screenToFlowPosition } = useSvelteFlow();

	// Click-add places the node where you are already looking.
	// It cascades the nodes to avoid stacking them.
	// Drag-add places the node where you are already looking,
	// but also allows you to move it before you release.
	const CASCADE_STEP = 32;
	const CASCADE_REPEAT = 8;
	let cascade = 0;

	/** Flow coordinates of the middle of the visible canvas. */
	function viewportCentre(): { x: number; y: number } {
		const pane = document.querySelector('.svelte-flow__pane');
		const rect = pane?.getBoundingClientRect();

		if (!rect) return { x: 0, y: 0 };

		return screenToFlowPosition({
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2
		});
	}

	const onClick = (nodeType: RegisteredNodeType) => {
		const centre = viewportCentre();

		// Successive clicks step diagonally so they do not stack on each other.
		const shift = cascade * CASCADE_STEP;
		cascade = (cascade + 1) % CASCADE_REPEAT;

		flowchartDocument.addNode(nodeType, { x: centre.x + shift, y: centre.y + shift }, [0.5, 0.5]);
	};

	const onDragStart = (event: DragEvent, nodeType: RegisteredNodeType) => {
		if (!event.dataTransfer) {
			return null;
		}

		dragAndDropNodeType.current = nodeType;

		event.dataTransfer.effectAllowed = 'move';
	};

	const nodeTypeCounts = $derived(
		nodes.current
			.map((node) => node.type ?? '')
			.reduce(
				(d, nodeType) => {
					if (nodeType in d) {
						d[nodeType] += 1;
					} else {
						d[nodeType] = 1;
					}
					return d;
				},
				{} as { [key: string]: number }
			)
	);
</script>

{#snippet panelContent()}
	{#each dragPanelNodes as [nodeType, config]}
		{#if config !== null && (config.maxCount === undefined || (nodeTypeCounts[nodeType] ?? 0) < config.maxCount)}
			<nav ondragstart={(event) => onDragStart(event, nodeType)} draggable={true} transition:scale>
				<Button variant="secondary" size="sm" onclick={() => onClick(nodeType)}
					><config.icon class={cn('size-4! stroke-2', config.class)} />{config.label}</Button
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
			class={buttonVariants({
				variant: 'outline',
				size: 'icon',
				class: 'bg-card/90!'
			})}><OpenIcon /></Popover.Trigger
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
