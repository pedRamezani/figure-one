<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '@/components/ui/card/index.js';

	import StepIcon from '@lucide/svelte/icons/square';
	import SubstepIcon from '@lucide/svelte/icons/workflow';
	import SplitIcon from '@lucide/svelte/icons/git-fork';

	import { dragAndDropNodeType } from './drag-and-drop-node.svelte';

	const onDragStart = (event: DragEvent, nodeType: string) => {
		if (!event.dataTransfer) {
			return null;
		}

		dragAndDropNodeType.current = nodeType;

		event.dataTransfer.effectAllowed = 'move';
	};
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Available nodes</Card.Title>
		<Card.Description>Add new nodes by dragging and droping.</Card.Description>
	</Card.Header>
	<Card.Content class="flex gap-4 min-w-sm">
		<div on:dragstart={(event) => onDragStart(event, 'step')} draggable={true}>
			<Badge variant="secondary" class="text-base"><StepIcon class="size-4! stroke-2" />Step</Badge>
		</div>
		<div on:dragstart={(event) => onDragStart(event, 'substep')} draggable={true}>
			<Badge variant="secondary" class="text-base"
				><SubstepIcon class="size-4! stroke-2" />Substep</Badge
			>
		</div>
		<div on:dragstart={(event) => onDragStart(event, 'split')} draggable={true}>
			<Badge variant="secondary" class="text-base"
				><SplitIcon class="size-4! stroke-2 rotate-180" />Split</Badge
			>
		</div>
	</Card.Content>
</Card.Root>
