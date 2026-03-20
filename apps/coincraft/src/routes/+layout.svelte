<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoaderStakeEngine, LoaderExample, LoadI18n } from 'components-shared';
	import { stateBet, stateConfig } from 'state-shared';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	let showYourLoader = $state(false);

	const loaderUrlStakeEngine = new URL('../../stake-engine-loader.gif', import.meta.url).href;
	const loaderUrl = new URL('../../loader.gif', import.meta.url).href;

	// Dev mode: skip auth when no sessionID is provided
	const isDev = import.meta.env.DEV && !new URLSearchParams(window.location.search).has('sessionID');

	setContext();

	onMount(() => {
		if (isDev) {
			stateBet.currency = 'USD';
			stateBet.balanceAmount = 10000;
			stateConfig.betAmountOptions = [1, 2, 5, 10, 20, 50, 100];
			stateConfig.betMenuOptions = [1, 5, 10, 50, 100];
			stateBet.betAmount = 1;
		}
	});
</script>

<GlobalStyle>
	{#if isDev}
		<LoadI18n {messagesMap}>
			<Game />
		</LoadI18n>
	{:else}
		<Authenticate>
			<LoadI18n {messagesMap}>
				<Game />
			</LoadI18n>
		</Authenticate>

		<LoaderStakeEngine src={loaderUrlStakeEngine} oncomplete={() => (showYourLoader = true)} />

		{#if showYourLoader}
			<LoaderExample src={loaderUrl} />
		{/if}
	{/if}
</GlobalStyle>

{@render props.children()}