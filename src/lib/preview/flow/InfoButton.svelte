<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	import { InfoIcon } from '@lucide/svelte';
</script>

<Popover.Root>
	<Popover.Trigger class={buttonVariants({ variant: 'outline', size: 'icon' })}>
		<InfoIcon />
		<span class="sr-only">Show Info</span>
	</Popover.Trigger>
	<Popover.Content align="end">
		<div class="space-y-2">
			<h4 class="leading-none font-medium">Figure One</h4>
			<p class="text-muted-foreground text-sm">
				Simply drag and drop from the node handles to generate your Flowchart!
			</p>
		</div>
	</Popover.Content>
</Popover.Root>
