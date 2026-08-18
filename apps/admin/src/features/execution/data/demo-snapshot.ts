import type {
  ExecutionArea,
  ExecutionFollowupNote,
  ExecutionLocation,
  ExecutionOrder,
  ExecutionPhase,
  ExecutionSnapshot,
  ExecutionUiStatus,
} from '@/features/execution/model/types';
import { derivePhase } from '@/features/execution/model/derive';
import { ROUTE_PALETTE_HEX } from '@/shared/map/grammar';

/**
 * Compact A04 demo snapshot — designer-parity operational sample, not production volume.
 * Area membership is encoded on each location/order, not inferred from polygons.
 */

const AREA_1: ExecutionArea = {
  id: 'area-1',
  name: 'محدوده ۱',
  color: ROUTE_PALETTE_HEX[0],
  driverName: 'حسین موسوی',
  polygon: [
    [35.762, 51.392],
    [35.762, 51.438],
    [35.698, 51.438],
    [35.698, 51.392],
  ],
};

const AREA_2: ExecutionArea = {
  id: 'area-2',
  name: 'محدوده ۲',
  color: ROUTE_PALETTE_HEX[1],
  driverName: 'کاوه میرزایی',
  polygon: [
    [35.748, 51.492],
    [35.748, 51.552],
    [35.702, 51.552],
    [35.702, 51.492],
  ],
};

const AREA_3: ExecutionArea = {
  id: 'area-3',
  name: 'محدوده ۳',
  color: ROUTE_PALETTE_HEX[2],
  driverName: 'پریسا کریمی',
  polygon: [
    [35.786, 51.398],
    [35.786, 51.432],
    [35.764, 51.432],
    [35.764, 51.398],
  ],
};

const LOCATIONS: ExecutionLocation[] = [
  { id: 'loc-001', areaId: 'area-1', address: 'بلوار ولیعصر، پلاک ۴۳', lat: 35.756, lng: 51.41 },
  { id: 'loc-002', areaId: 'area-1', address: 'خیابان شریعتی، پلاک ۱۱۲', lat: 35.748, lng: 51.428 },
  { id: 'loc-003', areaId: 'area-1', address: 'میدان انقلاب، پلاک ۷', lat: 35.701, lng: 51.39 },
  { id: 'loc-004', areaId: 'area-1', address: 'خیابان کریمخان، پلاک ۸۸', lat: 35.721, lng: 51.418 },
  { id: 'loc-005', areaId: 'area-2', address: 'تهرانپارس، بلوار اباذر', lat: 35.741, lng: 51.535 },
  { id: 'loc-006', areaId: 'area-2', address: 'میدان رسالت، پلاک ۱۵۶', lat: 35.736, lng: 51.52 },
  { id: 'loc-007', areaId: 'area-2', address: 'خیابان دماوند، پلاک ۲۱۲', lat: 35.712, lng: 51.5 },
  { id: 'loc-008', areaId: 'area-3', address: 'خیابان نلسون ماندلا، پلاک ۸', lat: 35.778, lng: 51.418 },
  { id: 'loc-009', areaId: 'area-3', address: 'بلوار افریقا، پلاک ۵۵', lat: 35.772, lng: 51.412 },
];

function order(partial: {
  id: string;
  locationId: string;
  areaId: string;
  recipient: string;
  phone: string;
  uiStatus: ExecutionUiStatus;
  lastEventLabel: string;
  failureReasonCode?: string;
  driverNote?: string;
}): ExecutionOrder {
  const attempts =
    partial.uiStatus === 'pending'
      ? []
      : [
          {
            id: `att-${partial.id}-1`,
            outcomeCode:
              partial.uiStatus === 'delivered' ? 'delivered' : (partial.failureReasonCode ?? 'closed_door'),
            atLabel: partial.lastEventLabel,
          },
        ];
  return {
    ...partial,
    taskId: `task-${partial.id}`,
    attempts,
  };
}

const LIVE_ORDERS: ExecutionOrder[] = [
  order({
    id: '10102001',
    locationId: 'loc-001',
    areaId: 'area-1',
    recipient: 'مریم طاهری',
    phone: '09121234567',
    uiStatus: 'pending',
    lastEventLabel: '۱۴:۱۲',
  }),
  order({
    id: '10102002',
    locationId: 'loc-001',
    areaId: 'area-1',
    recipient: 'رضا نجفی',
    phone: '09351234567',
    uiStatus: 'delivered',
    lastEventLabel: '۱۱:۴۸',
  }),
  order({
    id: '10102003',
    locationId: 'loc-002',
    areaId: 'area-1',
    recipient: 'سارا احمدی',
    phone: '09161234567',
    uiStatus: 'followup',
    lastEventLabel: '۱۲:۳۵',
    failureReasonCode: 'closed_door',
    driverNote: 'ساختمان دسترسی ندارد',
  }),
  order({
    id: '10102004',
    locationId: 'loc-003',
    areaId: 'area-1',
    recipient: 'علی رضایی',
    phone: '09191234567',
    uiStatus: 'pending',
    lastEventLabel: '۱۳:۵۲',
  }),
  order({
    id: '10102005',
    locationId: 'loc-003',
    areaId: 'area-1',
    recipient: 'نگین محمدی',
    phone: '09301234567',
    uiStatus: 'followup',
    lastEventLabel: '۱۳:۰۲',
    failureReasonCode: 'incomplete_address',
  }),
  order({
    id: '10102006',
    locationId: 'loc-003',
    areaId: 'area-1',
    recipient: 'کمال شاهی',
    phone: '09141234567',
    uiStatus: 'delivered',
    lastEventLabel: '۱۰:۳۸',
  }),
  order({
    id: '10102007',
    locationId: 'loc-004',
    areaId: 'area-1',
    recipient: 'زهرا کاظمی',
    phone: '09111234567',
    uiStatus: 'delivered',
    lastEventLabel: '۱۱:۱۵',
  }),
  order({
    id: '10102008',
    locationId: 'loc-005',
    areaId: 'area-2',
    recipient: 'فرهاد عباسی',
    phone: '09211234567',
    uiStatus: 'followup',
    lastEventLabel: '۱۴:۵۸',
    failureReasonCode: 'customer_absent',
  }),
  order({
    id: '10102009',
    locationId: 'loc-005',
    areaId: 'area-2',
    recipient: 'لیلا منصوری',
    phone: '09371234567',
    uiStatus: 'pending',
    lastEventLabel: '۱۵:۲۰',
  }),
  order({
    id: '10102010',
    locationId: 'loc-006',
    areaId: 'area-2',
    recipient: 'مجید آقایی',
    phone: '09151234567',
    uiStatus: 'followup',
    lastEventLabel: '۱۳:۴۱',
    failureReasonCode: 'no_answer',
    driverNote: 'دوبار تماس گرفتم',
  }),
  order({
    id: '10102011',
    locationId: 'loc-007',
    areaId: 'area-2',
    recipient: 'شیوا قاسمی',
    phone: '09251234567',
    uiStatus: 'pending',
    lastEventLabel: '۱۵:۴۸',
  }),
  order({
    id: '10102012',
    locationId: 'loc-008',
    areaId: 'area-3',
    recipient: 'پوریا اسدی',
    phone: '09361234567',
    uiStatus: 'followup',
    lastEventLabel: '۱۴:۲۲',
    failureReasonCode: 'incomplete_address',
  }),
  order({
    id: '10102013',
    locationId: 'loc-009',
    areaId: 'area-3',
    recipient: 'سمیرا نوری',
    phone: '09281234567',
    uiStatus: 'delivered',
    lastEventLabel: '۱۲:۰۵',
  }),
];

const LIVE_NOTES: ExecutionFollowupNote[] = [
  {
    id: 'fn-001',
    orderId: '10102003',
    adminName: 'امین رضایی',
    timestampLabel: '۱۳:۱۰',
    note: 'با شماره ثانویه تماس گرفته شد، جواب نداد. پیام صوتی گذاشته شد.',
  },
  {
    id: 'fn-002',
    orderId: '10102010',
    adminName: 'امین رضایی',
    timestampLabel: '۱۴:۰۵',
    note: 'مشتری اعلام کرد عصر در منزل خواهد بود. راننده اطلاع داده شد.',
  },
  {
    id: 'fn-003',
    orderId: '10102008',
    adminName: 'سارا اکبری',
    timestampLabel: '۱۵:۱۰',
    note: 'آدرس جایگزین از مشتری دریافت شد — کوچه سوم، واحد ۴.',
  },
];

function cloneSnapshot(source: ExecutionSnapshot): ExecutionSnapshot {
  return structuredClone(source);
}

function withPhase(source: ExecutionSnapshot, phase: ExecutionPhase): ExecutionSnapshot {
  const next = cloneSnapshot(source);
  if (phase === 'not-started') {
    next.orders = next.orders.map((item) => ({
      ...item,
      uiStatus: 'pending',
      failureReasonCode: undefined,
      driverNote: undefined,
      attempts: [],
    }));
    next.notes = [];
  }
  if (phase === 'completed') {
    next.orders = next.orders.map((item) => ({
      ...item,
      uiStatus: 'delivered',
      failureReasonCode: undefined,
      driverNote: undefined,
      attempts: [
        { id: `att-${item.id}-done`, outcomeCode: 'delivered', atLabel: item.lastEventLabel },
      ],
    }));
  }
  next.phase = derivePhase(next.orders);
  return next;
}

export function createLiveExecutionSnapshot(
  planId: string,
  options?: { window?: string; unpublishedWorkingRevision?: boolean },
): ExecutionSnapshot {
  const snapshot: ExecutionSnapshot = {
    planId,
    publishedRevisionId: `${planId}-pub-1`,
    workingRevisionId: options?.unpublishedWorkingRevision ? `${planId}-work-2` : `${planId}-pub-1`,
    hasUnpublishedWorkingRevision: Boolean(options?.unpublishedWorkingRevision),
    deliveryWindow: options?.window ?? '۱۲ تا ۱۵',
    lastUpdatedLabel: '۱۴:۳۲',
    phase: 'in-progress',
    areas: [AREA_1, AREA_2, AREA_3],
    locations: LOCATIONS,
    orders: LIVE_ORDERS,
    notes: LIVE_NOTES,
  };
  snapshot.phase = derivePhase(snapshot.orders);
  return cloneSnapshot(snapshot);
}

export function createNotStartedSnapshot(planId: string, window?: string): ExecutionSnapshot {
  return withPhase(createLiveExecutionSnapshot(planId, { window }), 'not-started');
}

export function createCompletedSnapshot(planId: string, window?: string): ExecutionSnapshot {
  return withPhase(createLiveExecutionSnapshot(planId, { window }), 'completed');
}

/** Plans that have a published revision in the A04 fixture. */
export const EXECUTION_PUBLISHED_PLAN_IDS = new Set(['P-2403', 'P-2402']);
