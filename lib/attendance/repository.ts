import { SCHEDULE_VERSION } from './schedule.ts';
import type { Attendance, AttendanceRepository } from './domain';
export async function api<T>(path: string, body?: unknown): Promise<T> {
 const response=await fetch(path,{method:body === undefined ? 'GET':'POST',credentials:'same-origin',cache:'no-store',...(body === undefined ? {} : {headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
 const result=await response.json(); if (!response.ok) throw new Error(result && typeof result === 'object' && 'error' in result && typeof result.error === 'string' ? result.error : '요청을 처리하지 못했습니다.'); return result as T;
}
export class HttpAttendanceRepository implements AttendanceRepository {
 async list(): Promise<Attendance[]> { return api<Attendance[]>('/api/status'); }
 async checkIn(memberId:string,date:string,reflection='') { await api('/api/attendance',{memberId,date,reflection,scheduleVersion:SCHEDULE_VERSION}); }
}
export function createRepository(): AttendanceRepository { return new HttpAttendanceRepository(); }
