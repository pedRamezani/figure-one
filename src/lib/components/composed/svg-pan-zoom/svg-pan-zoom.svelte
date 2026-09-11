<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '@/utils';

	import Button from '@/components/ui/button/button.svelte';
	import * as ButtonGroup from '@/components/ui/button-group/';

	import { PlusIcon, MinusIcon, RotateCwIcon } from '@lucide/svelte';

	let { svg, class: className }: { svg: Snippet; class?: string } = $props();

	let containerEl: HTMLDivElement | null = $state(null);

	const minScale = 0.2;
	const maxScale = 10;
	let scale = $state(1);
	let tx = $state(0);
	let ty = $state(0);
	let transform = $derived<string>(`translate(${tx}px, ${ty}px) scale(${scale})`);

	// Pointer/pinch tracking
	const pointers = new Map<number, PointerEvent>();
	let lastPan = { x: 0, y: 0 };
	let initialPinch = { dist: 0, scale: 1, center: { x: 0, y: 0 } };

	function clampScale(s: number) {
		return Math.max(minScale, Math.min(maxScale, s));
	}

	function clientToLocal(clientX: number, clientY: number) {
		if (!containerEl) return { x: 0, y: 0 };
		const r = containerEl.getBoundingClientRect();
		return { x: clientX - r.left, y: clientY - r.top };
	}

	function zoomAt(pointClientX: number, pointClientY: number, newScale: number) {
		const p = clientToLocal(pointClientX, pointClientY);
		// Compute new tx/ty so that point p remains under the same content after scaling
		const prevScale = scale;
		const clampedScale = clampScale(newScale);
		const sx = clampedScale / prevScale;
		tx = (tx - p.x) * sx + p.x;
		ty = (ty - p.y) * sx + p.y;
		scale = clampedScale;
	}

	function zoomBy(factor: number, centerClient?: { x: number; y: number }) {
		const rect = containerEl?.getBoundingClientRect();
		const center = centerClient
			? centerClient
			: rect
				? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
				: { x: 0, y: 0 };
		zoomAt(center.x, center.y, scale * factor);
	}

	function resetView() {
		scale = 1;
		tx = 0;
		ty = 0;
	}

	function onWheel(e: WheelEvent) {
		if (!containerEl) return;
		e.preventDefault();
		const delta = -e.deltaY;
		const factor = delta > 0 ? 1.1 : 1 / 1.1;
		zoomAt(e.clientX, e.clientY, scale * factor);
	}

	function onPointerDown(e: PointerEvent) {
		if (!containerEl) return;
		containerEl.setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, e);

		if (pointers.size === 1) {
			lastPan = { x: e.clientX, y: e.clientY };
		}

		if (pointers.size === 2) {
			const pts = Array.from(pointers.values());
			const a = pts[0];
			const b = pts[1];
			const dx = b.clientX - a.clientX;
			const dy = b.clientY - a.clientY;
			initialPinch.dist = Math.hypot(dx, dy);
			initialPinch.scale = scale;
			initialPinch.center = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (!containerEl) return;
		if (!pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, e);

		if (pointers.size === 1) {
			// Pan
			const dx = e.clientX - lastPan.x;
			const dy = e.clientY - lastPan.y;
			tx += dx;
			ty += dy;
			lastPan = { x: e.clientX, y: e.clientY };
		} else if (pointers.size === 2) {
			const pts = Array.from(pointers.values());
			const a = pts[0];
			const b = pts[1];
			const dx = b.clientX - a.clientX;
			const dy = b.clientY - a.clientY;
			const dist = Math.hypot(dx, dy);
			const factor = dist / initialPinch.dist;
			const newScale = initialPinch.scale * factor;
			// Zoom around pinch center
			zoomAt(initialPinch.center.x, initialPinch.center.y, newScale);
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (!containerEl) return;
		try {
			containerEl.releasePointerCapture(e.pointerId);
		} catch {}
		pointers.delete(e.pointerId);
		if (pointers.size === 1) {
			// switch to single-pointer pan base
			const remaining = Array.from(pointers.values())[0];
			lastPan = { x: remaining.clientX, y: remaining.clientY };
		}
	}
</script>

<div class="relative w-full h-full">
	<div
		bind:this={containerEl}
		class={cn('overflow-hidden w-full h-full', className)}
		onwheel={onWheel}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		<div class="will-change-transform origin-top-left touch-none select-none" style:transform>
			{@render svg()}
		</div>
	</div>
	<ButtonGroup.Root class="z-10 absolute bottom-0 right-0">
		<Button
			aria-label="Zoom in"
			onclick={() => zoomBy(1.2)}
			variant="outline"
			class="bg-secondary!"
			size="icon"><PlusIcon /></Button
		>
		<Button
			aria-label="Zoom out"
			onclick={() => zoomBy(1 / 1.2)}
			variant="outline"
			class="bg-secondary!"
			size="icon"><MinusIcon /></Button
		>
		<Button
			aria-label="Reset view"
			onclick={resetView}
			variant="outline"
			class="bg-secondary!"
			size="icon"><RotateCwIcon /></Button
		>
	</ButtonGroup.Root>
</div>
