import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(path){path=resolve(path);if(cache.has(path))return cache.get(path);let source=readFileSync(path,'utf8').replace("import 'server-only';",'');source=source.replace(/from ['"]([^'"]+)['"]/g,(full,name)=>{if(!name.startsWith('.')&&!name.startsWith('@/'))return full;const target=resolve(name.startsWith('@/')?process.cwd():dirname(path),name.startsWith('@/')?name.slice(2):name);return 'from '+JSON.stringify(load(target.endsWith('.ts')?target:target+'.ts'));});const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(path,url);return url;}
const handlers=await import(load('lib/server/handlers.ts'));
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SECRET_KEY='sb_secret_test';
const request=body=>new Request('https://reading.test/api/attendance',{method:'POST',headers:{origin:'https://reading.test','content-type':'application/json'},body:JSON.stringify(body)});
test('paginated status preserves full roster history and hides reflections',async()=>{
 const offsets=[];globalThis.fetch=async(url,init)=>{assert.equal(init.headers.apikey,'sb_secret_test');const u=new URL(url);assert.ok(!u.searchParams.get('select').includes('reflection'));const offset=Number(u.searchParams.get('offset'));offsets.push(offset);return Response.json(Array.from({length:offset<1000?500:1},()=>({member_id:'member-01',date:'2026-09-24',checked_at:'2026-09-24T00:00:00Z'})));};
 const rows=await (await handlers.status()).json();assert.equal(rows.length,1001);assert.deepEqual(offsets,[0,500,1000]);assert.equal(rows[0].date,'2026-09-28');assert.ok(!('reflection' in rows[0]));
});
test('submission maps rescheduled dates to stable keys and uses latest upsert',async()=>{
 let sent;globalThis.fetch=async(url,init)=>{sent={url,init};return new Response(null,{status:204});};
 assert.equal((await handlers.submit(request({memberId:'member-01',date:'2026-09-28',reflection:'묵상',scheduleVersion:'2026-chuseok'}))).status,200);
 assert.equal(JSON.parse(sent.init.body).date,'2026-09-24');assert.equal(JSON.parse(sent.init.body).reflection,'묵상');assert.equal(sent.init.headers.Prefer,'resolution=merge-duplicates,return=minimal');
 assert.equal((await handlers.submit(request({memberId:'member-01',date:'2026-09-28',reflection:'',scheduleVersion:'2026-chuseok'}))).status,200);assert.equal(JSON.parse(sent.init.body).reflection,'');
});
test('validation prevents invalid dates, stale schedules and cross origin writes',async()=>{
 globalThis.fetch=()=>{throw new Error('must not write')};
 const base={memberId:'member-01',date:'2026-09-28',scheduleVersion:'2026-chuseok'};
 for(const patch of [{memberId:'invalid'},{date:'2026-09-24'},{reflection:'a'.repeat(2001)}])assert.equal((await handlers.submit(request({...base,...patch}))).status,400);
 assert.equal((await handlers.submit(request({...base,scheduleVersion:'old'}))).status,409);
 const foreign=request(base);foreign.headers.set('origin','https://foreign.test');assert.equal((await handlers.submit(foreign)).status,403);
});
test('reflections stay scoped, dates move once, database errors are not exposed',async()=>{
 globalThis.fetch=async(url)=>{assert.equal(new URL(url).searchParams.get('member_id'),'eq.member-01');return Response.json([{member_id:'member-01',date:'2026-09-25',checked_at:'2026-09-25T00:00:00Z',reflection:'말씀'}]);};
 const rows=await (await handlers.reflections(new Request('https://reading.test/api/reflections?memberId=member-01'))).json();assert.equal(rows[0].date,'2026-09-29');assert.equal(rows[0].reflection,'말씀');
 globalThis.fetch=async()=>new Response('secret error',{status:500});const result=await handlers.status();assert.equal(result.status,503);assert.ok(!(await result.text()).includes('secret'));
});
