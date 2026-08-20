import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createExecutionFixturePort } from '@/features/execution/data/fixture-port';
import {
  createPlansFixturePort,
  parsedBatchFromFile,
} from '@/features/plans/fixture/plans-fixture';
import { PLANNING_DRIVERS } from '@/features/planning/fixture/drivers';
import { createTestPort, renderApp } from '@/features/plans/test/render';
import { dateToJalali, JALALI_MONTHS } from '@/shared/date/jalali';
import { toPersianDigits } from '@/shared/lib/format';

function excelFile(name: string) {
  return new File(['fixture workbook boundary'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

async function createAndImport(
  port: ReturnType<typeof createPlansFixturePort>,
  name: string,
) {
  const plan = await port.createPlan({
    name,
    deliveryDate: '۱۴۰۵/۰۶/۱۰',
    window: '۹ تا ۱۲',
  });
  const fileName = `${plan.id}-orders.xlsx`;
  const imported = await port.applyImportBatch(
    plan.id,
    parsedBatchFromFile(fileName, 'needs_review'),
    'needs_review',
  );
  return { plan: imported, fileName };
}

describe('frontend imported-plan demo bootstrap', () => {
  it('triggers only after a successful upload through the real create and Intake UI flow', async () => {
    const user = userEvent.setup();
    const port = createTestPort([]);
    const { router } = renderApp('/plans', port);

    await screen.findByText('هنوز برنامه‌ای وجود ندارد');
    await user.click(screen.getAllByRole('button', { name: /برنامه جدید/ })[0]!);
    const today = dateToJalali(new Date());
    await user.click(screen.getByLabelText(/تاریخ تحویل/));
    await user.click(
      await screen.findByRole('button', {
        name: `${toPersianDigits(10)} ${JALALI_MONTHS[today[1] - 1]}`,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'ایجاد برنامه' }));

    await screen.findByRole('heading', { name: 'داده‌های برنامه' });
    const planId = router.state.location.pathname.split('/')[2]!;
    expect(await port.listReviewItems(planId)).toEqual([]);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, excelFile('new-plan-orders.xlsx'));
    await user.click(await screen.findByRole('button', { name: /بارگذاری و بررسی/ }));
    await screen.findByText(/برخی موارد نیاز به بررسی دارند/);
    const bootstrappedReview = await port.listReviewItems(planId);
    expect(bootstrappedReview.length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /^بررسی داده$/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/plans/${planId}/review`));
    expect(await screen.findAllByText(bootstrappedReview[0]!.name)).not.toHaveLength(0);
  });

  it('preserves Review and Planning edits across reloads, isolates plans, is idempotent, and publishes to Execution', async () => {
    const port = createPlansFixturePort({ listDelayMs: 0, mutateDelayMs: 0 });
    const planA = await createAndImport(port, 'برنامه تازه الف');

    expect(planA.plan.currentStage).toBe('review');
    const reviewA = await port.listReviewItems(planA.plan.id);
    expect(reviewA.length).toBeGreaterThan(1);
    const readyItem = reviewA.find((item) => item.state === 'ready')!;
    const editedAddress = `${readyItem.address} — ویرایش الف`;
    await port.updateReviewInformation(planA.plan.id, readyItem.reviewItemId, {
      name: readyItem.name,
      phone: readyItem.phone,
      address: editedAddress,
    });
    expect(
      (await port.listReviewItems(planA.plan.id)).find(
        (item) => item.reviewItemId === readyItem.reviewItemId,
      )?.address,
    ).toBe(editedAddress);
    const reviewBlockers = reviewA
      .filter((item) => item.state === 'review' || item.state === 'error')
      .map((item) => item.reviewItemId);
    await port.excludeReviewItems(planA.plan.id, reviewBlockers);
    expect(
      (await port.listReviewItems(planA.plan.id)).filter(
        (item) => item.state === 'review' || item.state === 'error',
      ),
    ).toEqual([]);

    const initialPlanningA = await port.getPlanningState(planA.plan.id);
    expect(initialPlanningA.generationPhase).toBe('generated');
    expect(initialPlanningA.areas.length).toBeGreaterThan(0);
    const sourceArea = initialPlanningA.areas[0]!;
    const destinationArea = initialPlanningA.areas[1]!;
    const movedStop = sourceArea.stops[0]!;
    const corrected = { lat: movedStop.lat + 0.001, lng: movedStop.lng + 0.001 };
    await port.transferPlanningStop(planA.plan.id, movedStop.stopId, destinationArea.areaId);
    await port.updatePlanningStopLocation(planA.plan.id, movedStop.stopId, corrected);

    const reopenedPlanningA = await port.getPlanningState(planA.plan.id);
    expect(reopenedPlanningA.areas[0]?.stops.some((stop) => stop.stopId === movedStop.stopId)).toBe(false);
    expect(
      reopenedPlanningA.areas[1]?.stops.find((stop) => stop.stopId === movedStop.stopId),
    ).toMatchObject(corrected);

    const planB = await createAndImport(port, 'برنامه تازه ب');
    const reviewB = await port.listReviewItems(planB.plan.id);
    const planningB = await port.getPlanningState(planB.plan.id);
    expect(reviewB).not.toBe(reviewA);
    expect(planningB).not.toBe(initialPlanningA);
    expect(reviewB.some((item) => item.address === editedAddress)).toBe(false);
    expect(
      planningB.areas.flatMap((area) => area.stops).some((stop) => stop.stopId === movedStop.stopId),
    ).toBe(false);

    const planBItem = reviewB.find((item) => item.state === 'ready')!;
    await port.updateReviewInformation(planB.plan.id, planBItem.reviewItemId, {
      name: planBItem.name,
      phone: planBItem.phone,
      address: `${planBItem.address} — ویرایش ب`,
    });
    expect(
      (await port.listReviewItems(planA.plan.id)).find(
        (item) => item.reviewItemId === readyItem.reviewItemId,
      )?.address,
    ).toBe(editedAddress);
    expect(
      (await port.listReviewItems(planA.plan.id)).filter((item) =>
        reviewBlockers.includes(item.reviewItemId),
      ),
    ).toEqual(expect.arrayContaining(reviewBlockers.map((reviewItemId) =>
      expect.objectContaining({ reviewItemId, state: 'excluded' }),
    )));

    await port.applyImportBatch(
      planA.plan.id,
      parsedBatchFromFile('second-import.xlsx', 'needs_review'),
      'needs_review',
    );
    expect(
      (await port.listReviewItems(planA.plan.id)).find(
        (item) => item.reviewItemId === readyItem.reviewItemId,
      )?.address,
    ).toBe(editedAddress);
    expect(
      (await port.getPlanningState(planA.plan.id)).areas[1]?.stops.find(
        (stop) => stop.stopId === movedStop.stopId,
      ),
    ).toMatchObject(corrected);

    let working = await port.getPlanningState(planA.plan.id);
    for (const area of working.areas.filter((item) => !item.driverId)) {
      working = await port.assignPlanningDriver(planA.plan.id, area.areaId, PLANNING_DRIVERS[0]!);
    }
    const excluded = working.unassignedStops.flatMap((stop) =>
      stop.tasks.map((task) => task.orderId),
    );
    working = await port.setPlanningExcludedOrders(planA.plan.id, excluded);
    working = await port.recalculatePlanningRoutes(planA.plan.id, working);
    const publishedPlan = await port.publishPlanning(planA.plan.id, working);

    expect(publishedPlan.currentStage).toBe('execution');
    const published = port.getPublishedPlanningState(planA.plan.id)!;
    expect(published.excludedOrderIds).toEqual(excluded);
    expect(
      published.areas[1]?.stops.find((stop) => stop.stopId === movedStop.stopId),
    ).toMatchObject(corrected);

    const execution = createExecutionFixturePort({ plansPort: port, delayMs: 0 });
    const executionSnapshot = await execution.getSnapshot(planA.plan.id);
    expect(executionSnapshot?.planId).toBe(planA.plan.id);
    expect(executionSnapshot?.orders.length).toBeGreaterThan(0);
    expect(
      executionSnapshot?.locations.find((location) => location.id === movedStop.stopId),
    ).toMatchObject(corrected);
  });
});
