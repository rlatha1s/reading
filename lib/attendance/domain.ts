import { READING_SCHEDULE, READING_HOLIDAYS } from './schedule.ts';
export { READING_SCHEDULE };
export const START_DATE = '2026-09-07';
// Assign stable IDs before sorting so existing attendance stays linked to each person.
const ORIGINAL_MEMBERS = '강정희 김경훈 김대기 김명숙 김선주 김소민 김숙연 김정남 김태옥 노인숙 마예원 박랑주 박승빈 송은영 신정아 심애경 유지영 윤승덕 이숙선 이재욱 이진형 이형석 임은빈 정말순 정인옥 정희모 주영주 주찬 허은혜 홍수경 황다감'.split(' ').map((name, i) => ({ id: `member-${String(i + 1).padStart(2, '0')}`, name }));
export const MEMBERS = [...ORIGINAL_MEMBERS, {id:'member-32',name:'윤서로'}, {id:'member-33',name:'유누라'}, {id:'member-34',name:'최성희'}, {id:'member-35',name:'한현지'}, {id:'member-36',name:'이주희'}].sort((a,b) => a.name.localeCompare(b.name,'ko'));
export type Attendance = { memberId: string; date: string; checkedAt: string; reflection?: string };
export interface AttendanceRepository { list(): Promise<Attendance[]>; checkIn(memberId: string, date: string, reflection?: string): Promise<void>; }
export function today(now = new Date()) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); }
export function monthDates(month: string) {
 if (!/^\d{4}-\d{2}$/.test(month)) return [];
 const [y, m] = month.split('-').map(Number);
 if (m < 1 || m > 12) return [];
 return Array.from({length: new Date(Date.UTC(y, m, 0)).getUTCDate()}, (_, i) => `${month}-${String(i+1).padStart(2,'0')}`).filter(d => {
  const weekday = new Date(`${d}T00:00:00Z`).getUTCDay();
  return d >= START_DATE && weekday !== 0 && weekday !== 6 && !READING_HOLIDAYS.includes(d);
 });
}

export function readingDates() { return READING_SCHEDULE.map(entry => entry.date as string); }
export function defaultReadingDate(now = new Date()) { const date=today(now); return readingDates().includes(date) ? date : ''; }
