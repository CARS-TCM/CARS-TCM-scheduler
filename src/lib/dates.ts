/**
 * Australian date formatting (DD/MM/YYYY). Sessions are stored as ISO instants and
 * shown in the viewer's local timezone, with the timezone named so there is no ambiguity.
 */
const LOCALE = 'en-AU';

const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit', hour12: true });
const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const keyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

export const formatDate = (iso: string): string => dateFmt.format(new Date(iso));
export const formatTime = (iso: string): string => timeFmt.format(new Date(iso));
export const formatWeekday = (iso: string): string => weekdayFmt.format(new Date(iso));
export const formatDateTime = (iso: string): string => `${formatDate(iso)} ${formatTime(iso)}`;
export const formatTimeRange = (startIso: string, endIso: string): string =>
  `${formatTime(startIso)} – ${formatTime(endIso)}`;

/** Local calendar day as YYYY-MM-DD (matches <input type="date"> values). */
export const localDateKey = (iso: string): string => keyFmt.format(new Date(iso));

export function timeZoneLabel(): string {
  const parts = new Intl.DateTimeFormat(LOCALE, { timeZoneName: 'short' }).formatToParts(new Date());
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
}

export function timeZoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
