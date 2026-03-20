import type { BetType } from 'rgs-requests';

import type { SymbolName, RawSymbol, GameType, Position, PickaxeType, BonusPhase } from './types';

// === BASE GAME EVENTS ===

type BookEventReveal = {
	index: number;
	type: 'reveal';
	board: RawSymbol[][];
	paddingPositions: number[];
	anticipation: number[];
	gameType: GameType;
};

type BookEventSetTotalWin = {
	index: number;
	type: 'setTotalWin';
	amount: number;
};

type BookEventFinalWin = {
	index: number;
	type: 'finalWin';
	amount: number;
};

type BookEventSetWin = {
	index: number;
	type: 'setWin';
	amount: number;
	winLevel: number;
};

type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		kind: number;
		win: number;
		positions: Position[];
		meta: {
			multiplier: number;
			winWithoutMult: number;
			globalMult: number;
		};
	}[];
};

// === BLOCKER EVENTS ===

type BookEventBlockerDestroy = {
	index: number;
	type: 'blockerDestroy';
	position: Position;
	blockerType: SymbolName;
	multiplier: number;
	destroyedByTNT: boolean;
};

type BookEventBlockerSurvive = {
	index: number;
	type: 'blockerSurvive';
	position: Position;
	blockerType: SymbolName;
};

// === BONUS GAME EVENTS ===

type BookEventBonusTrigger = {
	index: number;
	type: 'bonusTrigger';
	positions: Position[];
};

type BookEventBonusPhaseStart = {
	index: number;
	type: 'bonusPhaseStart';
	phase: BonusPhase;
};

type BookEventPickaxeCollect = {
	index: number;
	type: 'pickaxeCollect';
	pickaxeType: PickaxeType;
	hits: number;
};

type BookEventPickaxeLifeLost = {
	index: number;
	type: 'pickaxeLifeLost';
	livesRemaining: number;
};

type BookEventPickaxeUse = {
	index: number;
	type: 'pickaxeUse';
	pickaxeType: PickaxeType;
	position: Position;
	hitsRemaining: number;
};

type BookEventBonusEnd = {
	index: number;
	type: 'bonusEnd';
	amount: number;
	winLevel: number;
};

// === FREE SPIN COMPAT ===

type BookEventFreeSpinTrigger = {
	index: number;
	type: 'freeSpinTrigger';
	totalFs: number;
	positions: Position[];
};

type BookEventUpdateFreeSpin = {
	index: number;
	type: 'updateFreeSpin';
	amount: number;
	total: number;
};

type BookEventFreeSpinEnd = {
	index: number;
	type: 'freeSpinEnd';
	amount: number;
	winLevel: number;
};

type BookEventCreateBonusSnapshot = {
	index: number;
	type: 'createBonusSnapshot';
	bookEvents: BookEvent[];
};

export type BookEvent =
	| BookEventReveal
	| BookEventWinInfo
	| BookEventSetTotalWin
	| BookEventFinalWin
	| BookEventSetWin
	// Blocker events
	| BookEventBlockerDestroy
	| BookEventBlockerSurvive
	// Bonus events
	| BookEventBonusTrigger
	| BookEventBonusPhaseStart
	| BookEventPickaxeCollect
	| BookEventPickaxeLifeLost
	| BookEventPickaxeUse
	| BookEventBonusEnd
	// Free spin compat
	| BookEventFreeSpinTrigger
	| BookEventUpdateFreeSpin
	| BookEventFreeSpinEnd
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
