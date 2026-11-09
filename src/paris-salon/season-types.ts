/** Salon season contract. Amounts are fictional teaching units, not real business forecasts. */
export type Audience = 'creators' | 'enthusiasts' | 'newcomers';
export type Theme = 'workshop' | 'exhibition' | 'discovery';
export type Scale = 'small' | 'standard' | 'grand';
export type ActionId = 'research' | 'participation' | 'artist' | 'training' | 'helpers' | 'recruit' | 'seats' | 'ambience' | 'experiment' | 'promotion' | 'membership' | 'sponsor';
export interface SeasonPlan { audience: Audience; theme: Theme; scale: Scale; actions: ActionId[] }
export interface SeasonAssets { cash: number; regulars: number; reputation: number; awareness: number; seats: number; assistants: number; training: number; ambience: number; insight: number; tested: boolean }
export interface SeasonAction { id: ActionId; title: string; category: 'insight'|'experience'|'operations'|'growth'; cost: number; staff: number; concept: string; basis: string; tradeoff: string; lesson: string; permanent: boolean }
export interface SeasonMarket { title: string; news: string; preferred: Audience; demand: number; mentor: string }
export interface SeasonEvent {
  number: number; plan: SeasonPlan; before: SeasonAssets; after: SeasonAssets;
  reach: number; inquiries: number; reservations: number; attendance: number; waiting: number;
  returning: number; newGuests: number; retained: number; newRegulars: number;
  satisfaction: number; awarenessChange: number;
  awarenessDrivers: { response: number; overload: number; waiting: number }; safeCapacity: number; seatCapacity: number;
  income: { support: number; members: number; sponsor: number; total: number };
  costs: { base: number; actions: number; total: number }; profit: number;
  notes: string[]; lessons: { action: ActionId; concept: string; text: string }[];
}
export type SeasonVersion = 5 | 6;
export interface SeasonSession { version: SeasonVersion; started: boolean; plans: SeasonPlan[]; acknowledged: number; draft: SeasonPlan; heard: Record<string, number[]>; endingSeen: boolean }
export interface SeasonReplay { assets: SeasonAssets; events: SeasonEvent[] }
export interface SeasonForecast { cost: number; staffRequired: number; staffAvailable: number; seats: number; capacity: number; safeCapacity: number; attendance: [number,number]; demand: [number,number]; waiting: [number,number]; issues: string[]; insights: string[] }
export interface SeasonRoute { kind: 'intro'|'play'|'ending'|'result'; canonical: string }
export const SEASON_VERSION = 6 as const;
export const SEASON_GOALS = { attendance: 100, awareness: 65 } as const;
export const SEASON_LENGTH = 6;
export const LEGACY_SEASON_STORAGE_KEY = 'learning-lab:quiz:paris-salon:v5';
export const SEASON_STORAGE_KEY = 'learning-lab:quiz:paris-salon:v6';
export const SEASON_INTRO = '#/quiz/paris-salon/1';
export const SEASON_PLAY = '#/quiz/paris-salon/season';
export const SEASON_RESULT = '#/quiz/paris-salon/result';
export const SEASON_ENDING = '#/quiz/paris-salon/ending';
/* Engine exports (season-engine.ts):
 defaultPlan(): SeasonPlan
 initialSeason(): SeasonSession
 replaySeason(plans: readonly SeasonPlan[], version?: SeasonVersion): SeasonReplay | null
 forecastSeason(session: SeasonSession, plan?: SeasonPlan): SeasonForecast
 setSeasonDraft(session: SeasonSession, plan: SeasonPlan): SeasonSession
 startSeason(session: SeasonSession): SeasonSession
 holdSeason(session: SeasonSession, expectedEvent: number): SeasonSession // expectedEvent 1..6; invalid => same reference
 acknowledgeSeason(session: SeasonSession): SeasonSession
 restoreSeason(raw: unknown): SeasonSession | null
 resolveSeasonRoute(hash: string, session: SeasonSession): SeasonRoute
 Content exports (../data/paris-salon-season.ts):
 seasonGame: QuizPreview & {version:6}; seasonActions: SeasonAction[];
 seasonMarkets: SeasonMarket[]; seasonPrologue: SalonStoryBeat[];
 seasonAudiences: {id:Audience; title:string; need:string}[];
 seasonThemes: {id:Theme; title:string; audience:Audience; promise:string}[];
 seasonScales: {id:Scale; title:string; cost:number; limit:number}[]; // guest cap before permanent seats
*/
