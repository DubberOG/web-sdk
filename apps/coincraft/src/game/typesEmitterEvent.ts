import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';

import type { Position, PickaxeType, SymbolName } from './types';
import type { WinLevelData } from './winLevelMap';

// Coincraft-specific emitter events
export type EmitterEventBlocker =
	| {
			type: 'blockerDestroy';
			position: Position;
			blockerType: SymbolName;
			multiplier: number;
	  }
	| {
			type: 'blockerSurvive';
			position: Position;
			blockerType: SymbolName;
	  };

export type EmitterEventBonus =
	| { type: 'bonusIntroShow' }
	| { type: 'bonusIntroReady' }
	| { type: 'bonusIntroHide' }
	| { type: 'bonusMiningPhaseStart' }
	| { type: 'bonusOutroShow' }
	| { type: 'bonusOutroCountUp'; amount: number; winLevelData: WinLevelData }
	| { type: 'bonusOutroHide' }
	| { type: 'bonusLifeLost'; livesRemaining: number }
	| {
			type: 'pickaxeCollected';
			pickaxeType: PickaxeType;
			hits: number;
	  }
	| {
			type: 'pickaxeUsed';
			pickaxeType: PickaxeType;
			position: Position;
			hitsRemaining: number;
	  };

export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventBoardFrame
	| EmitterEventWin
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventSound
	| EmitterEventTransition
	| EmitterEventBlocker
	| EmitterEventBonus;
