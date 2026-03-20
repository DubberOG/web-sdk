import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { sequence } from 'utils-shared/sequence';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import config from './config';

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateGame.gameType === 'freegame' || stateGame.gameType === 'bonusgame') {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_bonus' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},

	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		await sequence(bookEvent.wins, async (win) => {
			await animateSymbols({ positions: win.positions });
		});
	},

	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},

	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},

	finalWin: async (_bookEvent: BookEventOfType<'finalWin'>) => {
		// Do nothing
	},

	// === BLOCKER EVENTS ===

	blockerDestroy: async (bookEvent: BookEventOfType<'blockerDestroy'>) => {
		const { position, blockerType, multiplier, destroyedByTNT } = bookEvent;

		if (destroyedByTNT) {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_tnt_explode' });
		} else {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_pickaxe_hit' });
		}

		// Animate blocker destruction
		await eventEmitter.broadcastAsync({
			type: 'blockerDestroy',
			position,
			blockerType,
			multiplier,
		});

		// Award multiplier win
		if (multiplier > 0) {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_blocker_win' });
		}
	},

	blockerSurvive: async (bookEvent: BookEventOfType<'blockerSurvive'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_blocker_survive' });
		await eventEmitter.broadcastAsync({
			type: 'blockerSurvive',
			position: bookEvent.position,
			blockerType: bookEvent.blockerType,
		});
	},

	// === BONUS GAME EVENTS ===

	bonusTrigger: async (bookEvent: BookEventOfType<'bonusTrigger'>) => {
		// Animate scatter symbols
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });

		// Show bonus intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bonus_trigger' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'bonusIntroShow' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_bonus' });
		await eventEmitter.broadcastAsync({ type: 'bonusIntroReady' });
		eventEmitter.broadcast({ type: 'bonusIntroHide' });
		stateGame.gameType = 'bonusgame';
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
	},

	bonusPhaseStart: async (bookEvent: BookEventOfType<'bonusPhaseStart'>) => {
		stateGame.bonusPhase = bookEvent.phase;
		if (bookEvent.phase === 'mining') {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_phase2_start' });
			await eventEmitter.broadcastAsync({ type: 'bonusMiningPhaseStart' });
		}
	},

	pickaxeCollect: async (bookEvent: BookEventOfType<'pickaxeCollect'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_pickaxe_collect' });
		stateGame.pickaxes.push({
			type: bookEvent.pickaxeType,
			hitsRemaining: bookEvent.hits,
		});
		await eventEmitter.broadcastAsync({
			type: 'pickaxeCollected',
			pickaxeType: bookEvent.pickaxeType,
			hits: bookEvent.hits,
		});
	},

	pickaxeLifeLost: async (bookEvent: BookEventOfType<'pickaxeLifeLost'>) => {
		stateGame.bonusLives = bookEvent.livesRemaining;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_life_lost' });
		await eventEmitter.broadcastAsync({
			type: 'bonusLifeLost',
			livesRemaining: bookEvent.livesRemaining,
		});
	},

	pickaxeUse: async (bookEvent: BookEventOfType<'pickaxeUse'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_pickaxe_hit' });
		await eventEmitter.broadcastAsync({
			type: 'pickaxeUsed',
			pickaxeType: bookEvent.pickaxeType,
			position: bookEvent.position,
			hitsRemaining: bookEvent.hitsRemaining,
		});
	},

	bonusEnd: async (bookEvent: BookEventOfType<'bonusEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		stateGame.bonusPhase = undefined;
		stateGame.bonusLives = 3;
		stateGame.pickaxes = [];

		eventEmitter.broadcast({ type: 'bonusOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'bonusOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'bonusOutroHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
	},

	// === FREE SPIN COMPAT ===

	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},

	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount + 1;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},

	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},

	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastBonusTriggerEvent = findLastBookEvent('bonusTrigger' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);

		if (lastBonusTriggerEvent) await playBookEvent(lastBonusTriggerEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
	},
};
