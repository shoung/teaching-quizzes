import type { SeasonAssets, SeasonEvent, SeasonAction, ActionId } from './season-types';
export type SalonNpcId = 1 | 2 | 3 | 4 | 5 | 6;
export interface DialogueLine { speaker: string; portrait: number; text: string }
export interface SceneNpc { id: SalonNpcId; name: string; role: string; x: number; y: number; size: number; facing: 'left'|'right' }
export interface RoundScene { number: number; place: 'salon'|'study'|'print'|'cafe'; npcs: SceneNpc[] }
export interface ConversationContext { assets: SeasonAssets; previous?: SeasonEvent }
export interface NpcConversation { npcId: SalonNpcId; clue: string; lines: DialogueLine[] }
export interface EventVoices { guest: string; mentor: string; assistant: string; next: string }
export type HudMetricKey = 'cash'|'regulars'|'reputation'|'awareness'|'seats'|'training'|'ambience';
export interface MetricHelp { label: string; incoming: string; outgoing: string }
export interface RpgDialogueProps { lines: DialogueLine[]; reducedMotion: boolean; onComplete: () => void; onClose?: () => void; onAdvance?: () => void; label?: string }
export interface SalonCardHandProps { actions: SeasonAction[]; selected: ActionId[]; onToggle: (id: ActionId) => void; getIssue: (id: ActionId) => string | null; reducedMotion: boolean; onInspect?: () => void }
export interface HostingSequenceProps { eventNumber: number; reducedMotion: boolean; onComplete: () => void }
/* Data exports from ../data/paris-salon-rpg.ts:
 seasonScenes: RoundScene[];
 getNpcConversation(eventNumber:number, npcId:SalonNpcId, context:ConversationContext): NpcConversation;
 getOpeningDialogue(): DialogueLine[];
 getEndingDialogue(replay:SeasonReplay): DialogueLine[];
 getEventVoices(event:SeasonEvent): EventVoices;
 metricHelp: Record<HudMetricKey,MetricHelp>;
 Components (named exports, matching filenames): RpgDialogue, SalonCardHand, HostingSequence.
 Engine additions:
 heardSeasonNpc(session:SeasonSession,npcId:number):SeasonSession;
 canPlanSeason(session:SeasonSession):boolean;
 completeSeasonEnding(session:SeasonSession):SeasonSession;
 New session shape v4: {version:4,started,plans,acknowledged,draft,heard:Record<string,number[]>,endingSeen:boolean}.
 SEASON_ENDING='#/quiz/paris-salon/ending'; route.kind adds 'ending'.
*/
