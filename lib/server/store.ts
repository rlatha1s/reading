import 'server-only';
import { calendarRecord } from '../attendance/schedule.ts';

type Row = { member_id: string; date: string; checked_at: string; reflection?: string };
function settings() {
 const url = process.env.SUPABASE_URL;
 const key = process.env.SUPABASE_SECRET_KEY;
 if (!url || !key) throw new Error('Supabase is not configured');
 const parsed = new URL(url);
 if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) throw new Error('Invalid Supabase URL');
 return { url: parsed.origin, key };
}
async function query(params: URLSearchParams, init: RequestInit = {}) {
 const { url, key } = settings();
 const response = await fetch(`${url}/rest/v1/attendance?${params}`, {
  ...init, cache: 'no-store', signal: AbortSignal.timeout(15000),
  headers: { apikey: key, ...(key.startsWith('eyJ') ? {Authorization:`Bearer ${key}`} : {}),
   'Content-Type':'application/json', ...init.headers },
 });
 if (!response.ok) throw new Error(`Record service returned ${response.status}`);
 return response;
}
export async function listRecords(memberId?: string) {
 const rows: Row[] = [];
 // Paginate: the complete three-month attendance table can exceed 1,000 rows.
 for (let offset=0; ; offset+=500) {
  const params = new URLSearchParams({ select:memberId ? 'member_id,date,checked_at,reflection' : 'member_id,date,checked_at', order:'date.asc,member_id.asc', limit:'500', offset:String(offset) });
  if (memberId) params.set('member_id',`eq.${memberId}`);
  const batch: Row[] = await (await query(params)).json();
  rows.push(...batch);
  if (batch.length < 500) break;
 }
 return rows.filter(row => !memberId || row.reflection?.trim()).map(row => calendarRecord({memberId:row.member_id,date:row.date,checkedAt:row.checked_at,...(memberId ? {reflection:row.reflection} : {})}));
}
export async function saveRecord(memberId: string, date: string, reflection: string) {
 await query(new URLSearchParams({on_conflict:'member_id,date'}), { method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=minimal'}, body:JSON.stringify({member_id:memberId,date,reflection,checked_at:new Date().toISOString()}) });
}
export async function countRecords(date: string) {
 const response = await query(new URLSearchParams({select:'member_id',date:`eq.${date}`}), {method:'HEAD',headers:{Prefer:'count=exact'}});
 const total = response.headers.get('content-range')?.split('/')[1];
 if (!total || !/^\d+$/.test(total)) throw new Error('Record count unavailable');
 return Number(total);
}
