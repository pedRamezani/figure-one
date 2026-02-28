<script module lang="ts">
	type Expansion = {
		dimension: Dimensions;
		offset: XYPosition;
		position: XYPosition;
		changed: boolean;
		valid: boolean;
	};

	type Bounds = { x1: number; x2: number; y1: number; y2: number };
</script>

<script lang="ts">
	import {
		useNodes,
		useSvelteFlow,
		type XYPosition,
		type Dimensions,
		type NodeProps,
		type Rect,
		type Node
	} from '@xyflow/svelte';

	import { nodeHandles, type RegisteredNodeType } from '@/nodes/types';

	import HandleWrapper from '@/handles/HandleWrapper.svelte';

	const { id, type, positionAbsoluteX, positionAbsoluteY, width, height }: NodeProps = $props();

	const { deleteElements } = useSvelteFlow();

	const handles = $derived(nodeHandles[type as RegisteredNodeType]);

	function pad(rect: Rect, padding: number = 20): Rect {
		return {
			x: rect.x - padding,
			y: rect.y - padding,
			width: rect.width + 2 * padding,
			height: rect.height + 2 * padding
		};
	}

	function getNodesBoundsCustom(nodes: Node[]): Rect {
		let bounds = nodes.reduce(
			(acc: Bounds, childNode: Node) => {
				const { width = 0, height = 0 } = childNode.measured ?? {};
				const { x, y } = childNode.position;
				const [originX, originY] = childNode.origin ?? [0, 0];

				const x1 = x - originX * width;
				const y1 = y - originY * height;
				acc.x1 = x1 < acc.x1 ? x1 : acc.x1;
				acc.y1 = y1 < acc.y1 ? y1 : acc.y1;

				const x2 = x + (1 - originX) * width;
				const y2 = y + (1 - originY) * height;
				acc.x2 = x2 > acc.x2 ? x2 : acc.x2;
				acc.y2 = y2 > acc.y2 ? y2 : acc.y2;

				return acc;
			},
			{
				x1: Infinity,
				y1: Infinity,
				x2: -Infinity,
				y2: -Infinity
			}
		);

		return {
			x: bounds.x1,
			y: bounds.y1,
			width: bounds.x2 - bounds.x1,
			height: bounds.y2 - bounds.y1
		};
	}

	// NOTE: Not working correctly
	// const { getNodesBounds } = useSvelteFlow();
	// const childBounds = $derived(getNodesBounds(childNodes));

	const nodes = useNodes();
	const childNodes = $derived(nodes.current.filter((node) => node.parentId == id));
	const childBounds = $derived(getNodesBoundsCustom(childNodes));
	const noChildren = $derived(childNodes.length === 0);

	function resolveExpansion(childBounds: Rect, padding: number = 20): Expansion {
		const paddedChildBounds = pad(childBounds, padding);

		const dimension = {
			width: paddedChildBounds.width,
			height: paddedChildBounds.height
		};
		const offset = { x: paddedChildBounds.x, y: paddedChildBounds.y };
		const position = {
			x: positionAbsoluteX + paddedChildBounds.x,
			y: positionAbsoluteY + paddedChildBounds.y
		};

		// We check if there is even is an expansion happening
		const changed =
			dimension.width !== width || dimension.height !== height || offset.x !== 0 || offset.y !== 0;

		// We check whether there is a valid expansion happening
		const valid =
			childBounds.width > 0 &&
			childBounds.height > 0 &&
			isFinite(paddedChildBounds.x) &&
			isFinite(paddedChildBounds.y) &&
			isFinite(paddedChildBounds.width) &&
			isFinite(paddedChildBounds.height);

		return { dimension, offset, position, changed, valid };
	}

	function updateExtension(expansion: Expansion): void {
		nodes.update((nodes) =>
			nodes.map((node) => {
				if (childNodes.map((n) => n.id).includes(node.id)) {
					// Child nodes have relative coordinates
					// The absolute coordinates should however be the same after the expansion
					const origin = node.origin ?? [0, 0];
					const xShift = node.position.x - origin[0] * (node.width ?? 0);
					const yShift = node.position.y - origin[1] * (node.height ?? 0);
					return {
						...node,
						position: {
							x: xShift - expansion.offset.x,
							y: yShift - expansion.offset.y
						}
					};
				}

				if (node.id === id) {
					// These are absolute coordinates
					return {
						...node,
						...expansion.dimension,
						position: expansion.position
					};
				}

				return node;
			})
		);
	}

	const expansion = $derived(resolveExpansion(childBounds));
	$effect(() => {
		if (expansion.changed && expansion.valid) {
			updateExtension(expansion);
		}
	});

	$effect(() => {
		if (noChildren) {
			deleteElements({ nodes: [{ id: id }] });
		}
	});
</script>

<div
	class="bg-accent/50 rounded-xl"
	style:width={width === 0 ? undefined : `${width}px`}
	style:height={height === 0 ? undefined : `${height}px`}
>
	<!-- Handles -->
	{#each handles as handle}
		<HandleWrapper nodeId={id} {handle} />
	{/each}
</div>
