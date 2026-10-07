import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MEMBERS, monthDates, today, readingDates, defaultReadingDate, READING_SCHEDULE } from '../lib/attendance/domain.ts';
test('roster and start date', () => { assert.equal(MEMBERS.length,36); assert.equal(new Set(MEMBERS.map(m=>m.id)).size,36); assert.equal(monthDates('2026-09')[0],'2026-09-07'); assert.equal(monthDates('2026-09').length,16); assert.deepEqual(monthDates('2026-08'),[]); });
test('Korean midnight and month boundary',()=>{assert.equal(today(new Date('2026-09-06T15:00:00Z')),'2026-09-07'); assert.equal(today(new Date('2026-09-06T14:59:59Z')),'2026-09-06'); assert.equal(monthDates('2028-02').length,21);});


test('added members sort in Korean order without changing existing IDs',()=>{assert.equal(MEMBERS.find(m=>m.name==='유지영').id,'member-17');assert.equal(MEMBERS.find(m=>m.name==='황다감').id,'member-31');const names=MEMBERS.map(m=>m.name);assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b,'ko')));for(const name of ['윤서로','유누라','최성희','한현지','이주희'])assert.ok(names.includes(name));});
test('65 provided weekday readings, date defaults and multi-book labels',()=>{assert.equal(READING_SCHEDULE.length,65);assert.equal(readingDates()[0],'2026-09-07');assert.equal(readingDates().at(-1),'2026-12-08');assert.equal(new Set(readingDates()).size,65);assert.ok(readingDates().every(d=>![0,6].includes(new Date(d).getUTCDay())));assert.equal(defaultReadingDate(new Date('2026-09-06T15:00:00Z')),'2026-09-07');assert.equal(defaultReadingDate(new Date('2026-09-11T15:00:00Z')),'');assert.equal(READING_SCHEDULE.find(r=>r.date==='2026-11-26').label,'[2026. 11. 26 (목)] 딤전 1~6장 / 딤후 1~4장 / 딛 1~3장');});

test('attendance columns skip weekends across months', () => {
 for (const month of ['2026-09','2026-10','2026-11','2026-12']) {
  assert.ok(monthDates(month).every(d => ![0,6].includes(new Date(d+'T00:00:00Z').getUTCDay())));
 }
 assert.deepEqual(monthDates('2026-09').slice(4,6), ['2026-09-11','2026-09-14']);
 assert.equal(monthDates('2026-09').at(-1), '2026-09-30');
});

test('Chuseok removes two days while retaining all reading ranges in order',()=>{
 for(const date of ['2026-09-24','2026-09-25']) { assert.ok(!readingDates().includes(date)); assert.ok(!monthDates('2026-09').includes(date)); }
 assert.equal(READING_SCHEDULE.find(r=>r.date==='2026-09-28').label,'[2026. 09. 28 (월)] 시 11~20편');
 assert.equal(READING_SCHEDULE.find(r=>r.date==='2026-09-29').reading,'막 1~6장');
 assert.equal(READING_SCHEDULE.find(r=>r.date==='2026-09-30').reading,'막 7~11장');
 assert.equal(READING_SCHEDULE.at(-1).reading,'계 12~22장');
});
