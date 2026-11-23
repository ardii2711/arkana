import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '../../src/lib/prisma';
import { addDaysWita, endOfDayWita, startOfDayWita, todayWita } from '../../src/lib/wita';
import { expectStatus } from '../helpers/client';
import { cleanupTestUsers, createTestUser, type TestUser } from '../helpers/fixtures';
import { startServer, stopServer } from '../helpers/server';

interface UpcomingSchedule {
  id: string;
  title: string;
}

describe('dashboard — agenda terdekat', () => {
  let user: TestUser;
  let multiDayId: string;
  let todayOnlyId: string;
  let tomorrowId: string;
  let cancelledId: string;

  beforeAll(async () => {
    await startServer();
    await cleanupTestUsers();
    user = await createTestUser('dashboard-schedule');

    const today = todayWita();
    const tomorrow = addDaysWita(today, 1);

    [multiDayId, todayOnlyId, tomorrowId, cancelledId] = await Promise.all([
      prisma.schedule
        .create({
          data: {
            userId: user.id,
            title: 'Agenda multi-hari',
            startAt: startOfDayWita(today),
            endAt: endOfDayWita(tomorrow),
            allDay: true,
          },
        })
        .then((row) => row.id),
      prisma.schedule
        .create({
          data: {
            userId: user.id,
            title: 'Agenda hari ini saja',
            startAt: startOfDayWita(today),
            endAt: endOfDayWita(today),
            allDay: true,
          },
        })
        .then((row) => row.id),
      prisma.schedule
        .create({
          data: {
            userId: user.id,
            title: 'Agenda besok',
            startAt: startOfDayWita(tomorrow),
            allDay: true,
          },
        })
        .then((row) => row.id),
      prisma.schedule
        .create({
          data: {
            userId: user.id,
            title: 'Agenda dibatalkan',
            startAt: startOfDayWita(today),
            endAt: endOfDayWita(tomorrow),
            allDay: true,
            status: 'CANCELLED',
          },
        })
        .then((row) => row.id),
    ]);
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await stopServer();
  });

  it('memasukkan agenda multi-hari yang masih berlangsung besok', async () => {
    const response = await expectStatus(await user.client.request('/dashboard'), 200);
    const upcoming = (
      response.body as {
        data: { upcomingSchedules: UpcomingSchedule[] };
      }
    ).data.upcomingSchedules.map((item) => item.id);

    expect(upcoming).toContain(multiDayId);
    expect(upcoming).toContain(tomorrowId);
    expect(upcoming).not.toContain(todayOnlyId);
    expect(upcoming).not.toContain(cancelledId);
  });
});
