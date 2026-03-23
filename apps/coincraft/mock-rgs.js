/**
 * Mock RGS server for local development.
 * Serves random book events from math publish files.
 * Run: node mock-rgs.js
 */
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MATH_DIR = join(__dirname, '../../../math/games/coincraft/library/publish_files');
const PORT = 3002;

// Load books from uncompressed JSON if available, otherwise use sample data
let books = {};
const SAMPLE_BOOKS = {
	base: [
		{
			id: 1,
			payoutMultiplier: 0,
			events: [
				{
					index: 0,
					type: 'reveal',
					board: [
						[{ name: 'X' }, { name: 'L1' }, { name: 'L3' }, { name: 'H4' }],
						[{ name: 'L2' }, { name: 'X' }, { name: 'H3' }, { name: 'L1' }],
						[{ name: 'X' }, { name: 'L4' }, { name: 'X' }, { name: 'L2' }],
						[{ name: 'L3' }, { name: 'X' }, { name: 'L5' }, { name: 'X' }],
						[{ name: 'H1' }, { name: 'L1' }, { name: 'X' }, { name: 'L4' }],
					],
					paddingPositions: [0, 0, 0, 0, 0],
					gameType: 'basegame',
					anticipation: [0, 0, 0, 0, 0],
				},
				{ index: 1, type: 'setTotalWin', amount: 0 },
				{ index: 2, type: 'finalWin', amount: 0 },
			],
		},
		{
			id: 2,
			payoutMultiplier: 160,
			events: [
				{
					index: 0,
					type: 'reveal',
					board: [
						[{ name: 'H4' }, { name: 'L1' }, { name: 'W', wild: true }, { name: 'L3' }],
						[{ name: 'H4' }, { name: 'X' }, { name: 'H4' }, { name: 'L1' }],
						[{ name: 'X' }, { name: 'H4' }, { name: 'L2' }, { name: 'X' }],
						[{ name: 'L3' }, { name: 'X' }, { name: 'L5' }, { name: 'B1', blocker: true }],
						[{ name: 'H1' }, { name: 'L1' }, { name: 'X' }, { name: 'L4' }],
					],
					paddingPositions: [0, 0, 0, 0, 0],
					gameType: 'basegame',
					anticipation: [0, 0, 0, 0, 0],
				},
				{
					index: 1,
					type: 'winInfo',
					totalWin: 160,
					wins: [
						{
							symbol: 'H4',
							kind: 3,
							win: 160,
							positions: [
								{ reel: 0, row: 0 },
								{ reel: 0, row: 2 },
								{ reel: 1, row: 0 },
								{ reel: 1, row: 2 },
								{ reel: 2, row: 1 },
							],
							meta: { ways: 2, globalMult: 1, winWithoutMult: 160, symbolMult: 0 },
						},
					],
				},
				{ index: 2, type: 'setWin', amount: 160, winLevel: 3 },
				{ index: 3, type: 'setTotalWin', amount: 160 },
				{ index: 4, type: 'finalWin', amount: 160 },
			],
		},
		{
			id: 3,
			payoutMultiplier: 1200,
			events: [
				{
					index: 0,
					type: 'reveal',
					board: [
						[{ name: 'L1' }, { name: 'W', wild: true }, { name: 'L3' }, { name: 'H2' }],
						[{ name: 'L1' }, { name: 'H3' }, { name: 'L1' }, { name: 'B2', blocker: true }],
						[{ name: 'X' }, { name: 'L1' }, { name: 'L2' }, { name: 'X' }],
						[{ name: 'L3' }, { name: 'X' }, { name: 'L5' }, { name: 'X' }],
						[{ name: 'H1' }, { name: 'L1' }, { name: 'X' }, { name: 'L4' }],
					],
					paddingPositions: [0, 0, 0, 0, 0],
					gameType: 'basegame',
					anticipation: [0, 0, 0, 0, 0],
				},
				{
					index: 1,
					type: 'winInfo',
					totalWin: 200,
					wins: [
						{
							symbol: 'L1',
							kind: 3,
							win: 200,
							positions: [
								{ reel: 0, row: 0 },
								{ reel: 0, row: 1 },
								{ reel: 1, row: 0 },
								{ reel: 1, row: 2 },
								{ reel: 2, row: 1 },
							],
							meta: { ways: 4, globalMult: 1, winWithoutMult: 200, symbolMult: 0 },
						},
					],
				},
				{ index: 2, type: 'setWin', amount: 200, winLevel: 3 },
				{ index: 3, type: 'setTotalWin', amount: 200 },
				{
					type: 'blockerDestroy',
					position: [1, 3],
					blockerType: 'B2',
					multiplier: 10,
				},
				{ index: 5, type: 'setTotalWin', amount: 1200 },
				{ index: 6, type: 'finalWin', amount: 1200 },
			],
		},
	],
};

books = SAMPLE_BOOKS;

let balance = 1000000000; // 1000 USD (API uses 1000000 = 1 USD)
let roundActive = false;
let lastPayout = 0;

const server = createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		res.end();
		return;
	}

	let body = '';
	req.on('data', (chunk) => (body += chunk));
	req.on('end', () => {
		const json = body ? JSON.parse(body) : {};
		const url = req.url;

		console.log(`${req.method} ${url}`, json.mode || '');

		if (url === '/wallet/authenticate') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					balance: { amount: balance, currency: 'USD' },
					config: {
						minBet: 1000000,
						maxBet: 100000000,
						stepBet: 1000000,
						defaultBetLevel: 1000000,
						betLevels: [1000000, 2000000, 5000000, 10000000, 20000000, 50000000, 100000000],
						jurisdiction: {
							socialCasino: false,
							disabledFullscreen: false,
							disabledTurbo: false,
						},
					},
					round: null,
				}),
			);
		} else if (url === '/wallet/play') {
			const mode = json.mode || 'BASE';
			const amount = json.amount || 100;
			balance -= amount;
			roundActive = true;

			// Pick random book
			const modeBooks = books[mode.toLowerCase()] || books.base;
			const book = modeBooks[Math.floor(Math.random() * modeBooks.length)];
			lastPayout = (book.payoutMultiplier / 100) * amount;

			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					balance: { amount: balance, currency: 'USD' },
					round: {
						payoutMultiplier: book.payoutMultiplier,
						costMultiplier: mode === 'BASE' ? 1 : 100,
						state: book.events,
					},
				}),
			);
		} else if (url === '/wallet/end-round') {
			balance += lastPayout;
			roundActive = false;
			lastPayout = 0;

			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ balance: { amount: balance, currency: 'USD' } }));
		} else if (url === '/wallet/balance') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ balance: { amount: balance, currency: 'USD' } }));
		} else if (url === '/bet/event') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ event: json.event }));
		} else {
			res.writeHead(404);
			res.end('Not found');
		}
	});
});

server.listen(PORT, () => {
	console.log(`Mock RGS running on http://localhost:${PORT}`);
	console.log(`Modes: ${Object.keys(books).join(', ')}`);
	console.log(`Balance: ${balance / 100} USD`);
});
