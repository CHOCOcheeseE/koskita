import { createTestApp, expectError, registerUser, Session, TestApp } from './support/app';

describe('study (e2e)', () => {
  let t: TestApp;
  let me: Session;

  beforeAll(async () => {
    // Selasa 24 November 2026 10:00 WIB.
    t = await createTestApp(new Date('2026-11-24T03:00:00Z'));
    me = await registerUser(t, 'Mahasiswa');
  });

  afterAll(async () => {
    await t.close();
  });

  const schedule = (body: Record<string, unknown>, s: Session = me) => t.http.post('/v1/study/schedules').set(s.auth).send(body);
  const task = (body: Record<string, unknown>, s: Session = me) => t.http.post('/v1/study/tasks').set(s.auth).send(body);

  describe('jadwal', () => {
    it('POST 201 lalu bentrok tercatat di kedua sisi; batas tepat tidak bentrok', async () => {
      const s = await registerUser(t);
      const a = await schedule({ courseName: 'Kalkulus', dayOfWeek: 1, startTime: '08:00', endTime: '10:00', room: 'R101' }, s).expect(201);
      expect(a.body).toEqual({
        id: expect.any(String),
        courseName: 'Kalkulus',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '10:00',
        room: 'R101',
        conflictsWith: [],
      });
      const b = await schedule({ courseName: 'Fisika', dayOfWeek: 1, startTime: '09:00', endTime: '11:00' }, s).expect(201);
      expect(b.body.room).toBeNull();
      expect(b.body.conflictsWith).toEqual([{ id: a.body.id, courseName: 'Kalkulus', startTime: '08:00', endTime: '10:00' }]);
      const c = await schedule({ courseName: 'Kimia', dayOfWeek: 1, startTime: '11:00', endTime: '12:00' }, s).expect(201);
      expect(c.body.conflictsWith).toEqual([]);

      const list = await t.http.get('/v1/study/schedules').set(s.auth).expect(200);
      expect(list.body.items.map((x: { courseName: string }) => x.courseName)).toEqual(['Kalkulus', 'Fisika', 'Kimia']);
      expect(list.body.items[0].conflictsWith).toHaveLength(1);

      const monday = await t.http.get('/v1/study/schedules?dayOfWeek=1').set(s.auth).expect(200);
      expect(monday.body.items).toHaveLength(3);
      const tuesday = await t.http.get('/v1/study/schedules?dayOfWeek=2').set(s.auth).expect(200);
      expect(tuesday.body.items).toEqual([]);
      expectError((await t.http.get('/v1/study/schedules?dayOfWeek=8').set(s.auth).expect(400)).body, 'VALIDATION_FAILED');
    });

    it('422 TIME_RANGE_INVALID (POST dan PATCH), 400 format jam', async () => {
      expectError((await schedule({ courseName: 'Statistik', dayOfWeek: 2, startTime: '10:00', endTime: '09:00' }).expect(422)).body, 'TIME_RANGE_INVALID');
      expectError((await schedule({ courseName: 'Statistik', dayOfWeek: 2, startTime: '8:00', endTime: '09:00' }).expect(400)).body, 'VALIDATION_FAILED');
      expectError((await schedule({ courseName: 'Statistik', dayOfWeek: 0, startTime: '08:00', endTime: '09:00' }).expect(400)).body, 'VALIDATION_FAILED');
      const ok = await schedule({ courseName: 'Statistik', dayOfWeek: 2, startTime: '08:00', endTime: '09:00' }).expect(201);
      expectError((await t.http.patch(`/v1/study/schedules/${ok.body.id}`).set(me.auth).send({ endTime: '07:00' }).expect(422)).body, 'TIME_RANGE_INVALID');
      const patched = await t.http.patch(`/v1/study/schedules/${ok.body.id}`).set(me.auth).send({ endTime: '10:30', room: 'Lab 2' }).expect(200);
      expect(patched.body).toMatchObject({ startTime: '08:00', endTime: '10:30', room: 'Lab 2' });
      expectError((await t.http.patch(`/v1/study/schedules/${ok.body.id}`).set(me.auth).send({}).expect(400)).body, 'VALIDATION_FAILED');
    });

    it('jadwal orang lain -> 404; hapus jadwal membuat tugas jadi tanpa mata kuliah', async () => {
      const other = await registerUser(t);
      const theirs = await schedule({ courseName: 'Rahasia', dayOfWeek: 3, startTime: '08:00', endTime: '09:00' }, other).expect(201);
      expectError((await t.http.get(`/v1/study/schedules/${theirs.body.id}`).set(me.auth).expect(404)).body, 'NOT_FOUND');
      await t.http.delete(`/v1/study/schedules/${theirs.body.id}`).set(me.auth).expect(404);

      const mine = await schedule({ courseName: 'Algoritma', dayOfWeek: 4, startTime: '13:00', endTime: '15:00' }).expect(201);
      const tk = await task({ title: 'Tugas graf', scheduleId: mine.body.id, deadline: '2026-11-30T16:59:00Z' }).expect(201);
      expect(tk.body.courseName).toBe('Algoritma');
      await t.http.delete(`/v1/study/schedules/${mine.body.id}`).set(me.auth).expect(204);
      const after = await t.http.get(`/v1/study/tasks/${tk.body.id}`).set(me.auth).expect(200);
      expect(after.body).toMatchObject({ scheduleId: null, courseName: null });
    });
  });

  describe('tugas', () => {
    it('label deadline: kemarin overdue, 23 jam due_soon, 25 jam null', async () => {
      const s = await registerUser(t);
      const late = await task({ title: 'Laporan praktikum', deadline: '2026-11-23T03:00:00Z' }, s).expect(201);
      const soon = await task({ title: 'Kuis daring', deadline: '2026-11-25T02:00:00Z' }, s).expect(201);
      const later = await task({ title: 'Makalah akhir', deadline: '2026-11-25T04:00:00Z', note: ' Bab 1-3 ' }, s).expect(201);
      expect(late.body).toEqual({
        id: expect.any(String),
        title: 'Laporan praktikum',
        scheduleId: null,
        courseName: null,
        deadline: '2026-11-23T03:00:00.000Z',
        note: null,
        status: 'belum',
        completedAt: null,
        deadlineLabel: 'overdue',
        createdAt: expect.any(String),
      });
      expect(soon.body.deadlineLabel).toBe('due_soon');
      expect(later.body).toMatchObject({ deadlineLabel: null, note: 'Bab 1-3' });

      const list = await t.http.get('/v1/study/tasks').set(s.auth).expect(200);
      expect(list.body.items.map((x: { title: string }) => x.title)).toEqual(['Laporan praktikum', 'Kuis daring', 'Makalah akhir']);
    });

    it('centang selesai: completedAt terisi, label null, pindah ke status=selesai; batal centang', async () => {
      const s = await registerUser(t);
      const a = await task({ title: 'Tugas A', deadline: '2026-11-20T03:00:00Z' }, s).expect(201);
      const b = await task({ title: 'Tugas B', deadline: '2026-11-21T03:00:00Z' }, s).expect(201);
      const doneA = await t.http.patch(`/v1/study/tasks/${a.body.id}`).set(s.auth).send({ status: 'selesai' }).expect(200);
      expect(doneA.body).toMatchObject({ status: 'selesai', completedAt: '2026-11-24T03:00:00.000Z', deadlineLabel: null });

      t.clock.set(new Date('2026-11-24T03:05:00Z'));
      await t.http.patch(`/v1/study/tasks/${b.body.id}`).set(s.auth).send({ status: 'selesai' }).expect(200);
      t.clock.set(new Date('2026-11-24T03:00:00Z'));

      const done = await t.http.get('/v1/study/tasks?status=selesai&limit=1').set(s.auth).expect(200);
      expect(done.body.items.map((x: { title: string }) => x.title)).toEqual(['Tugas B']);
      const next = await t.http.get(`/v1/study/tasks?status=selesai&limit=1&cursor=${done.body.nextCursor}`).set(s.auth).expect(200);
      expect(next.body.items.map((x: { title: string }) => x.title)).toEqual(['Tugas A']);
      expect(next.body.nextCursor).toBeNull();

      const undo = await t.http.patch(`/v1/study/tasks/${a.body.id}`).set(s.auth).send({ status: 'belum' }).expect(200);
      expect(undo.body).toMatchObject({ status: 'belum', completedAt: null, deadlineLabel: 'overdue' });
    });

    it('422 SCHEDULE_NOT_FOUND untuk jadwal orang lain; 400 deadline salah', async () => {
      const other = await registerUser(t);
      const theirs = await schedule({ courseName: 'Punya Orang', dayOfWeek: 5, startTime: '08:00', endTime: '09:00' }, other).expect(201);
      expectError((await task({ title: 'Nyontek', scheduleId: theirs.body.id, deadline: '2026-11-30T00:00:00Z' }).expect(422)).body, 'SCHEDULE_NOT_FOUND');
      expectError((await task({ title: 'Salah', deadline: '2026-11-30' }).expect(400)).body, 'VALIDATION_FAILED');
      expectError((await task({ title: 'ab', deadline: '2026-11-30T00:00:00Z' }).expect(400)).body, 'VALIDATION_FAILED');
      const mine = await task({ title: 'Benar', deadline: '2026-11-30T00:00:00Z' }).expect(201);
      expectError(
        (await t.http.patch(`/v1/study/tasks/${mine.body.id}`).set(me.auth).send({ scheduleId: theirs.body.id }).expect(422)).body,
        'SCHEDULE_NOT_FOUND',
      );
    });

    it('tugas orang lain -> 404; hapus 204', async () => {
      const other = await registerUser(t);
      const theirs = await task({ title: 'Milik orang', deadline: '2026-11-30T00:00:00Z' }, other).expect(201);
      expectError((await t.http.get(`/v1/study/tasks/${theirs.body.id}`).set(me.auth).expect(404)).body, 'NOT_FOUND');
      await t.http.patch(`/v1/study/tasks/${theirs.body.id}`).set(me.auth).send({ status: 'selesai' }).expect(404);
      await t.http.delete(`/v1/study/tasks/${theirs.body.id}`).set(me.auth).expect(404);
      await t.http.delete(`/v1/study/tasks/${theirs.body.id}`).set(other.auth).expect(204);
    });
  });
});
