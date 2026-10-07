import { mkdir, writeFile } from 'node:fs/promises';
import { MEMBERS } from '../lib/attendance/domain.ts';
import { storageDateFor } from '../lib/attendance/schedule.ts';
const origin='https://gospel-chungshin-reading.xenosis995261.chatgpt.site';
async function get(path) {const response=await fetch(origin+path,{cache:'no-store',signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`Backup request failed (${response.status})`);return response.json();}
const key=row=>`${row.memberId}:${row.date}`;
const fingerprint=rows=>JSON.stringify(rows.map(r=>[key(r),r.checkedAt]).sort());
const before=await get('/api/status');
const reflections=new Map();
for(const member of MEMBERS)for(const row of await get('/api/reflections?memberId='+member.id))reflections.set(key(row),row);
const after=await get('/api/status');
if(fingerprint(before)!==fingerprint(after))throw new Error('Records changed during export. Run again during a quiet moment. No backup was written.');
const records=after.map(row=>{
 if(!MEMBERS.some(m=>m.id===row.memberId))throw new Error('Unknown member; refusing incomplete export');
 const storageDate=storageDateFor(row.date);if(!storageDate)throw new Error('Unknown reading date; refusing incomplete export');
 const detail=reflections.get(key(row));if(detail&&detail.checkedAt!==row.checkedAt)throw new Error('Records changed during export');
 return {member_id:row.memberId,date:storageDate,checked_at:row.checkedAt,reflection:detail?.reflection??''};
});
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const statements=records.map(r=>`insert into public.attendance(member_id,date,checked_at,reflection) values (${[r.member_id,r.date,r.checked_at,r.reflection].map(quote).join(',')}) on conflict(member_id,date) do update set checked_at=excluded.checked_at, reflection=excluded.reflection where attendance.checked_at < excluded.checked_at;`);
const dir='backups/'+new Date().toISOString().replaceAll(':','-');await mkdir(dir,{recursive:true,mode:0o700});
await writeFile(dir+'/records.json',JSON.stringify({exportedAt:new Date().toISOString(),source:origin,dateFormat:'original-storage-date',records},null,2),{mode:0o600});
await writeFile(dir+'/import.sql',"begin;\nset local standard_conforming_strings=on;\n"+statements.join('\n')+'\ncommit;\nselect count(*) as total_records from public.attendance;\n',{mode:0o600});
console.log(`Exported ${records.length} records (${records.filter(r=>r.reflection).length} reflections) to ${dir}. Keep this folder private. Re-export immediately before final cutover.`);
