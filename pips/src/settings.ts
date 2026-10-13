export type Speed = 'slow' | 'normal' | 'fast';
export interface Settings { speed: Speed; manualCut: boolean }

const KEY = 'pips.settings.v1';
export const DEFAULT_SETTINGS: Settings = { speed: 'normal', manualCut: true };

export function loadSettings(): Settings {
  try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>) }; } catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* no storage */ }
}

/** Computer thinking time in ms for a pegging play; other moves scale from it. */
export const PLAY_DELAY: Record<Speed, number> = { slow: 1300, normal: 850, fast: 350 };
