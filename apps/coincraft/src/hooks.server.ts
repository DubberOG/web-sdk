//https://svelte.dev/docs/cli/devtools-json
import { dev } from '$app/environment';

// Mock RGS data for dev mode
const SAMPLE_BOOKS = [
	{
		id: 1, payoutMultiplier: 0,
		events: [
			{ index: 0, type: 'reveal', board: [
				[{ name: 'X' }, { name: 'L2' }, { name: 'X' }, { name: 'L3' }, { name: 'H1' }],
				[{ name: 'L1' }, { name: 'X' }, { name: 'L4' }, { name: 'X' }, { name: 'L1' }],
				[{ name: 'L3' }, { name: 'H3' }, { name: 'X' }, { name: 'L5' }, { name: 'X' }],
				[{ name: 'H4' }, { name: 'L1' }, { name: 'L2' }, { name: 'X' }, { name: 'L4' }],
			], paddingPositions: [0,0,0,0,0], gameType: 'basegame', anticipation: [0,0,0,0,0] },
			{ index: 1, type: 'setTotalWin', amount: 0 },
			{ index: 2, type: 'finalWin', amount: 0 },
		],
	},
	{
		id: 2, payoutMultiplier: 160,
		events: [
			{ index: 0, type: 'reveal', board: [
				[{ name: 'H4' }, { name: 'H4' }, { name: 'X' }, { name: 'L3' }, { name: 'H1' }],
				[{ name: 'L1' }, { name: 'X' }, { name: 'H4' }, { name: 'X' }, { name: 'L1' }],
				[{ name: 'W', wild: true }, { name: 'H4' }, { name: 'L2' }, { name: 'L5' }, { name: 'X' }],
				[{ name: 'L3' }, { name: 'L1' }, { name: 'X' }, { name: 'B1', blocker: true }, { name: 'L4' }],
			], paddingPositions: [0,0,0,0,0], gameType: 'basegame', anticipation: [0,0,0,0,0] },
			{ index: 1, type: 'winInfo', totalWin: 160, wins: [
				{ symbol: 'H4', kind: 3, win: 160, positions: [
					{ reel: 0, row: 0 }, { reel: 0, row: 2 }, { reel: 1, row: 0 }, { reel: 1, row: 2 }, { reel: 2, row: 1 }
				], meta: { ways: 2, globalMult: 1, winWithoutMult: 160, symbolMult: 0 } },
			]},
			{ index: 2, type: 'setWin', amount: 160, winLevel: 3 },
			{ index: 3, type: 'setTotalWin', amount: 160 },
			{ index: 4, type: 'finalWin', amount: 160 },
		],
	},
	{
		id: 3, payoutMultiplier: 1200,
		events: [
			{ index: 0, type: 'reveal', board: [
				[{ name: 'L1' }, { name: 'L1' }, { name: 'X' }, { name: 'L3' }, { name: 'H1' }],
				[{ name: 'W', wild: true }, { name: 'H3' }, { name: 'L1' }, { name: 'X' }, { name: 'L1' }],
				[{ name: 'L3' }, { name: 'L1' }, { name: 'L2' }, { name: 'L5' }, { name: 'X' }],
				[{ name: 'H2' }, { name: 'B2', blocker: true }, { name: 'X' }, { name: 'X' }, { name: 'L4' }],
			], paddingPositions: [0,0,0,0,0], gameType: 'basegame', anticipation: [0,0,0,0,0] },
			{ index: 1, type: 'winInfo', totalWin: 200, wins: [
				{ symbol: 'L1', kind: 3, win: 200, positions: [
					{ reel: 0, row: 0 }, { reel: 0, row: 1 }, { reel: 1, row: 0 }, { reel: 1, row: 2 }, { reel: 2, row: 1 }
				], meta: { ways: 4, globalMult: 1, winWithoutMult: 200, symbolMult: 0 } },
			]},
			{ index: 2, type: 'setWin', amount: 200, winLevel: 3 },
			{ index: 3, type: 'setTotalWin', amount: 200 },
			{ type: 'blockerDestroy', position: [1, 3], blockerType: 'B2', multiplier: 10 },
			{ index: 5, type: 'setTotalWin', amount: 1200 },
			{ index: 6, type: 'finalWin', amount: 1200 },
		],
	},
];

let mockBalance = 1000000000;
let mockLastPayout = 0;

function mockJson(data: unknown) {
	return new Response(JSON.stringify(data), {
		headers: { 'Content-Type': 'application/json' },
	});
}

export async function handle({ event, resolve }) {
	if (dev && event.url.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
		return new Response(undefined, { status: 404 });
	}

	// Mock RGS endpoints in dev mode
	if (dev) {
		if (event.url.pathname === '/wallet/authenticate') {
			return mockJson({
				balance: { amount: mockBalance, currency: 'USD' },
				config: {
					minBet: 1000000, maxBet: 100000000, stepBet: 1000000, defaultBetLevel: 1000000,
					betLevels: [1000000, 2000000, 5000000, 10000000, 20000000, 50000000, 100000000],
					jurisdiction: { socialCasino: false, disabledFullscreen: false, disabledTurbo: false },
				},
				round: null,
			});
		}

		if (event.url.pathname === '/wallet/play') {
			const body = await event.request.json();
			const amount = body.amount || 100;
			mockBalance -= amount;
			const book = SAMPLE_BOOKS[Math.floor(Math.random() * SAMPLE_BOOKS.length)];
			mockLastPayout = (book.payoutMultiplier / 100) * amount;
			return mockJson({
				balance: { amount: mockBalance, currency: 'USD' },
				round: { payoutMultiplier: book.payoutMultiplier, costMultiplier: 1, state: book.events },
			});
		}

		if (event.url.pathname === '/wallet/end-round') {
			mockBalance += mockLastPayout;
			mockLastPayout = 0;
			return mockJson({ balance: { amount: mockBalance, currency: 'USD' } });
		}

		if (event.url.pathname === '/wallet/balance') {
			return mockJson({ balance: { amount: mockBalance, currency: 'USD' } });
		}

		if (event.url.pathname === '/bet/event') {
			const body = await event.request.json();
			return mockJson({ event: body.event });
		}
	}

	return resolve(event);
}