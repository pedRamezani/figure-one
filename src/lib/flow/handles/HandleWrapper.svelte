<script lang="ts">
	import type { WithElementRef } from '@/utils.js';
	import {
		Position,
		type HandleProps,
		type IsValidConnection,
		useNodeConnections
	} from '@xyflow/svelte';

	import WideHandle from './WideHandle.svelte';

	import { type Handle, handleGraph, handleConnectionLimits } from './handle-types.ts';

	let {
		nodeId,
		handle,
		...restProps
	}: WithElementRef<
		{ nodeId: string; handle: Handle } & Omit<
			HandleProps,
			'id' | 'type' | 'position' | 'isConnectable' | 'isValidConnection'
		>
	> = $props();

	const neighboors = $derived(handleGraph().getNeighboors(handle));
	const sourceHandleIds = $derived(
		Array.from(neighboors)
			.filter((h) => h.handleType === 'source')
			.map((h) => h.handleId)
	);
	const targetHandleIds = $derived(
		Array.from(neighboors)
			.filter((h) => h.handleType === 'target')
			.map((h) => h.handleId)
	);

	const isValidConnection = $derived<IsValidConnection>(
		(edge) =>
			sourceHandleIds.includes(edge.sourceHandle ?? '') ||
			targetHandleIds.includes(edge.targetHandle ?? '')
	);

	const connections = useNodeConnections({
		id: nodeId,
		handleId: handle.handleId,
		handleType: handle.handleType
	});

	const limit = $derived(handleConnectionLimits.get(handle) ?? 0);

	const isConnectable = $derived(connections.current.length < limit);

	// Two handles on the same edge would otherwise sit on top of each other.
	// xyflow centres a handle with a percentage plus a translate, so overriding
	// only the offset keeps it centred on the point given.
	const offsetStyle = $derived.by(() => {
		if (handle.offset === undefined) return undefined;

		return [Position.Top, Position.Bottom].includes(handle.position)
			? `left: ${handle.offset};`
			: `top: ${handle.offset};`;
	});
</script>

<WideHandle
	id={handle.handleId}
	type={handle.handleType}
	position={handle.position}
	{isConnectable}
	{isValidConnection}
	style={offsetStyle}
	{...restProps}
/>
