export default {
	providerName: 'coincraft',
	gameName: 'coincraft',
	gameID: 'coincraft',
	rtp: 0.96,
	numReels: 5,
	numRows: [4, 4, 4, 4, 4],
	betModes: {
		base: {
			cost: 1.0,
			feature: true,
			buyBonus: false,
			rtp: 0.96,
			max_win: 25000.0,
		},
		bonus: {
			cost: 100.0,
			feature: false,
			buyBonus: true,
			rtp: 0.96,
			max_win: 25000.0,
		},
	},
	// Megaways - no paylines, consecutive reel matching left-to-right
	// Basic symbols: need 3+ on reels 1-3
	// Premium symbols: need 2+ on reels 1-2
	symbols: {
		// === WILD ===
		W: {
			// TNT - Wild symbol, also destroys blockers
			paytable: null,
			special_properties: ['wild'],
		},

		// === SCATTER ===
		S: {
			// Bonus trigger - 3 to enter bonus game
			paytable: null,
			special_properties: ['scatter'],
		},

		// === PREMIUM SYMBOLS (need 2+ on reels 1-2) ===
		H1: {
			// Miner-man
			paytable: [
				{ '6': 25 },
				{ '5': 10 },
				{ '4': 5 },
				{ '3': 2 },
				{ '2': 0.5 },
			],
		},
		H2: {
			// Miner-girl
			paytable: [
				{ '6': 20 },
				{ '5': 8 },
				{ '4': 4 },
				{ '3': 1.5 },
				{ '2': 0.4 },
			],
		},
		H3: {
			// Wolf
			paytable: [
				{ '6': 15 },
				{ '5': 6 },
				{ '4': 3 },
				{ '3': 1 },
				{ '2': 0.3 },
			],
		},
		H4: {
			// Sheep
			paytable: [
				{ '6': 10 },
				{ '5': 4 },
				{ '4': 2 },
				{ '3': 0.8 },
				{ '2': 0.2 },
			],
		},

		// === BASIC SYMBOLS (need 3+ on reels 1-3) ===
		L1: {
			// A
			paytable: [
				{ '6': 5 },
				{ '5': 2 },
				{ '4': 1 },
				{ '3': 0.4 },
			],
		},
		L2: {
			// K
			paytable: [
				{ '6': 4 },
				{ '5': 1.5 },
				{ '4': 0.8 },
				{ '3': 0.3 },
			],
		},
		L3: {
			// Q
			paytable: [
				{ '6': 3 },
				{ '5': 1.2 },
				{ '4': 0.6 },
				{ '3': 0.2 },
			],
		},
		L4: {
			// J
			paytable: [
				{ '6': 2.5 },
				{ '5': 1 },
				{ '4': 0.5 },
				{ '3': 0.15 },
			],
		},
		L5: {
			// 10
			paytable: [
				{ '6': 2 },
				{ '5': 0.8 },
				{ '4': 0.4 },
				{ '3': 0.1 },
			],
		},

		// === BLOCKER SYMBOLS ===
		B1: {
			// Bronze blocker - always destroyed by TNT, 0.5-2x win
			paytable: null,
			special_properties: ['blocker'],
			blocker: {
				destroyChance: 1.0,
				minMultiplier: 0.5,
				maxMultiplier: 2,
			},
		},
		B2: {
			// Silver blocker - 75% chance destroyed by TNT, 5-20x win
			paytable: null,
			special_properties: ['blocker'],
			blocker: {
				destroyChance: 0.75,
				minMultiplier: 5,
				maxMultiplier: 20,
			},
		},
		B3: {
			// Diamond blocker - 10% chance destroyed by TNT, 25-5000x win
			paytable: null,
			special_properties: ['blocker'],
			blocker: {
				destroyChance: 0.1,
				minMultiplier: 25,
				maxMultiplier: 5000,
			},
		},
	},

	// Pickaxe types for bonus game phase 1
	pickaxes: {
		bronze: { minHits: 1, maxHits: 3 },
		silver: { minHits: 1, maxHits: 5 },
		gold: { minHits: 3, maxHits: 10 },
		diamond: { minHits: 5, maxHits: 15 },
	},

	// Bonus game config
	bonus: {
		phase1Lives: 3,
		// Phase 2: 4 bonus symbols removes bronze+silver blocks
		phase2BlockerUpgrade: true,
	},

	paddingReels: {
		basegame: [] as { name: string }[][],
		freegame: [] as { name: string }[][],
		bonusgame: [] as { name: string }[][],
	},
};
