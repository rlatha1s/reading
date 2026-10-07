import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpAttendanceRepository } from '../lib/attendance/repository.ts';
test('HTTP repository rejects unauthenticated requests without returning records', async()=>{const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({error:'관리자 코드를 입력해 주세요.'},{status:401});try{await assert.rejects(()=>new HttpAttendanceRepository().list(),/관리자/);}finally{globalThis.fetch=original;}});
