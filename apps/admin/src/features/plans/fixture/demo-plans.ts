import type { A01PlanViewModel } from '@/features/plans/a01-types';

/**
 * DEV / Test sample data for A01 only.
 * Not product domain truth. Not OpenAPI samples.
 */
export const A01_DEMO_PLANS: A01PlanViewModel[] = [
  {
    id: 'P-2408',
    name: 'برنامه تحویل — ۲ شهریور — ۹ تا ۱۲',
    deliveryDate: '۱۴۰۳/۰۶/۰۲',
    window: '۹ تا ۱۲',
    currentStage: 'intake',
    status: 'intake_failed',
    lastChanged: '۱ ساعت پیش',
    importedFile: {
      name: 'orders_1403-06-02.xlsx',
      uploadedAt: '۱ ساعت پیش',
      rowCount: 0,
    },
  },
  {
    id: 'P-2407',
    name: 'برنامه تحویل — ۱ شهریور — ۱۲ تا ۱۵',
    deliveryDate: '۱۴۰۳/۰۶/۰۱',
    window: '۱۲ تا ۱۵',
    currentStage: 'intake',
    status: 'draft',
    lastChanged: '۲ ساعت پیش',
  },
  {
    id: 'P-2406',
    name: 'برنامه تحویل — ۲۸ مرداد',
    deliveryDate: '۱۴۰۳/۰۵/۲۸',
    currentStage: 'intake',
    status: 'process',
    lastChanged: '۱۵ دقیقه پیش',
    importedFile: {
      name: 'orders_1403-05-28.xlsx',
      uploadedAt: '۱۵ دقیقه پیش',
      rowCount: 200,
    },
  },
  {
    id: 'P-2405',
    name: 'برنامه تحویل — ۲۱ مرداد — ۹ تا ۱۲',
    deliveryDate: '۱۴۰۳/۰۵/۲۱',
    window: '۹ تا ۱۲',
    currentStage: 'review',
    status: 'review',
    itemCount: 187,
    lastChanged: 'دیروز',
    importedFile: {
      name: 'orders_1403-05-21.xlsx',
      uploadedAt: 'دیروز',
      rowCount: 210,
      parseOutcome: 'needs_review',
      parseSummary: {
        totalRows: 210,
        importedCount: 210,
        locationReviewCount: 23,
        duplicateOrderIdCount: 3,
        otherReviewCount: 2,
      },
    },
  },
  {
    id: 'P-2404',
    name: 'برنامه تحویل — ۱۴ مرداد — ۱۵ تا ۱۸',
    deliveryDate: '۱۴۰۳/۰۵/۱۴',
    window: '۱۵ تا ۱۸',
    currentStage: 'planning',
    status: 'planning_active',
    itemCount: 165,
    lastChanged: '۳ روز پیش',
    importedFile: {
      name: 'orders_1403-05-14.xlsx',
      uploadedAt: '۴ روز پیش',
      rowCount: 170,
      parseOutcome: 'needs_review',
    },
  },
  {
    id: 'P-2403',
    name: 'برنامه تحویل — ۷ مرداد — ۱۲ تا ۱۵',
    deliveryDate: '۱۴۰۳/۰۵/۰۷',
    window: '۱۲ تا ۱۵',
    currentStage: 'execution',
    status: 'active',
    itemCount: 142,
    lastChanged: 'امروز',
    importedFile: {
      name: 'orders_1403-05-07.xlsx',
      uploadedAt: '۶ روز پیش',
      rowCount: 148,
      parseOutcome: 'clean',
    },
  },
  {
    id: 'P-2402',
    name: 'برنامه تحویل — ۳۱ تیر',
    deliveryDate: '۱۴۰۳/۰۴/۳۱',
    currentStage: 'execution',
    status: 'done',
    itemCount: 198,
    lastChanged: '۱ هفته پیش',
    importedFile: {
      name: 'orders_1403-04-31.xlsx',
      uploadedAt: '۱ هفته پیش',
      rowCount: 200,
      parseOutcome: 'clean',
    },
  },
];
