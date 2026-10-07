import { MEMBERS, readingDates, today } from '../attendance/domain.ts';
import { SCHEDULE_VERSION, storageDateFor } from '../attendance/schedule.ts';
import { listRecords, saveRecord, countRecords } from './store.ts';
export function json(value: unknown, status=200) { return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}); }
export async function submit(request: Request) {
 if(request.headers.get('origin') !== new URL(request.url).origin || !request.headers.get('content-type')?.startsWith('application/json')) return json({error:'허용되지 않은 요청입니다.'},403);
 let body;
 try { const raw=await request.text(); if(raw.length>12000)return json({error:'입력한 내용이 너무 깁니다.'},400); body=JSON.parse(raw); } catch { return json({error:'입력한 내용을 확인해 주세요.'},400); }
 if(!body || typeof body!=='object' || !MEMBERS.some(m=>m.id===body.memberId) || !readingDates().includes(body.date) || (body.reflection!==undefined && typeof body.reflection!=='string') || (body.reflection?.length??0)>2000) return json({error:'이름과 날짜를 확인해 주세요. 묵상은 2,000자까지 가능합니다.'},400);
 if(body.scheduleVersion!==SCHEDULE_VERSION)return json({error:'새로고침한 뒤 변경된 일정을 확인해 주세요.'},409);
 try { await saveRecord(body.memberId,storageDateFor(body.date)!,(body.reflection??'').trim()); return json({ok:true}); } catch { return json({error:'저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'},503); }
}
export async function status() { try { return json(await listRecords()); } catch { return json({error:'통독 현황을 불러오지 못했습니다.'},503); } }
export async function reflections(request:Request) {
 const id=new URL(request.url).searchParams.get('memberId');
 if(!MEMBERS.some(m=>m.id===id))return json({error:'명단에서 이름을 선택해 주세요.'},400);
 try { return json((await listRecords(id!)).sort((a,b)=>b.date.localeCompare(a.date))); } catch { return json({error:'묵상 기록을 불러오지 못했습니다.'},503); }
}
export async function summary() { const date=today(); const storage=storageDateFor(date); try { return json({date,count:storage ? await countRecords(storage) : 0}); } catch { return json({error:'기록을 불러오지 못했습니다.'},503); } }
