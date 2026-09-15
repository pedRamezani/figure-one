<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';

	import InfoIcon from '@lucide/svelte/icons/info';
	import GithubIcon from '@lucide/svelte/icons/github';

	// Keep in step with `repository-code` in CITATION.cff.
	const REPOSITORY_URL = 'https://github.com/pedRamezani/figure-one';
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
			<!-- A new tab rather than this one: leaving the page would drop the
			     viewport, the selection and anything typed since the last save. -->
			<a
				href={REPOSITORY_URL}
				target="_blank"
				rel="noreferrer"
				class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
			>
				<GithubIcon class="size-4" />
				Source on GitHub
			</a>
		</div>
	</Popover.Content>
</Popover.Root>
