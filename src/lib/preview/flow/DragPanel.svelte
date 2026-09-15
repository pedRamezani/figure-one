<script lang="ts">
	import { buttonVariants } from '@/components/ui/button/index.js';

	import OpenIcon from '@lucide/svelte/icons/blocks';

	import { cn } from '@/utils';

	import { Button } from '@/components/ui/button/index.js';
	import * as Card from '@/components/ui/card/index.js';
	import * as Popover from '@/components/ui/popover/index.js';

	const panelTitel = 'Available nodes';
	const panelDescription = 'Click or drag to add nodes.';

	import { dragAndDropNodeType } from './drag-and-drop-node.svelte';
	import type { RegisteredNodeType } from '@/flow/nodes/node-types';
	import { dragPanelNodes } from './drag-panel-nodes.ts';
	import { flowchartDocument } from '@/document/store.svelte';

	import { useSvelteFlow } from '@xyflow/svelte';

	import { scale } from 'svelte/transition';

	const { screenToFlowPosition } = useSvelteFlow();

	// Which form the panel takes is a question about the canvas, not about the
	// device: the resizable handle can leave a desktop with a canvas narrower
	// than a phone's. So both forms are rendered and the `canvas` container query
	// declared in `Flow.svelte` picks one.
	//
	// The card's width is capped in container units so the buttons wrap into
	// rows as the canvas narrows, and the cap leaves the zoom controls in the
	// opposite corner room to stay clear.

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

	// A drag abandoned outside the canvas never reaches the drop handler, so the
	// pending type has to be cleared here too or it would apply to the next drop.
	const onDragEnd = () => {
		dragAndDropNodeType.current = null;
	};
</script>

{#snippet panelContent()}
	{#each dragPanelNodes as [nodeType, config] (nodeType)}
		{#if config !== null && flowchartDocument.canAddNode(nodeType)}
			<nav
				ondragstart={(event) => onDragStart(event, nodeType)}
				ondragend={onDragEnd}
				draggable={true}
				transition:scale
			>
				<Button variant="secondary" size="sm" onclick={() => onClick(nodeType)}
					><config.icon class={cn('size-4! stroke-2', config.class)} />{config.label}</Button
				>
			</nav>
		{/if}
	{/each}
{/snippet}

<!-- Collapsed form: everything behind one button once the card no longer fits. -->
<div class="@md/canvas:hidden">
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
</div>

<!-- Expanded form, capped against the canvas so the buttons wrap rather than
     overflow it. The 6rem allowance covers the panel's own 15px margins and
     keeps the card off the zoom controls in the opposite corner. -->
<Card.Root class="@max-md/canvas:hidden max-w-[calc(100cqi-6rem)]">
	<Card.Header>
		<Card.Title>{panelTitel}</Card.Title>
		<Card.Description>{panelDescription}</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-wrap gap-2">
		{@render panelContent()}
	</Card.Content>
</Card.Root>
