/**
 * Feature-local Planning fixture types (UI presentation only).
 * Not OpenAPI / backend contracts.
 */

export type PlanningDeliveryTask = {
  taskId: string;
  orderId: string;
  recipientName: string;
  address: string;
};

export type PlanningStop = {
  stopId: string;
  seq: number;
  lat: number;
  lng: number;
  tasks: PlanningDeliveryTask[];
};

export type PlanningRoutePlanState = 'draft' | 'assigned' | 'modified' | 'published';

export type PlanningRoute = {
  routeId: string;
  routeNum: number;
  label: string;
  color: string;
  driverId: string | null;
  driverName: string | null;
  /** When true, future rebuild should preserve this driver assignment. */
  driverAssignmentLocked: boolean;
  stops: PlanningStop[];
  distanceKm: number;
  durationMin: number;
  planState: PlanningRoutePlanState;
};

/** Planning-local driver catalog entry (picker only). */
export type PlanningDriver = {
  driverId: string;
  driverName: string;
};

export type PlanningDepot = {
  name: string;
  lat: number;
  lng: number;
};

export type PlanningPlanFixture = {
  planId: string;
  planName: string;
  depot: PlanningDepot;
  routes: PlanningRoute[];
  unassignedStops: PlanningStop[];
};

export type PlanningSelection = {
  selectedRouteId: string | null;
  selectedStopId: string | null;
  selectedOrderId: string | null;
  selectedUnassignedStopId: string | null;
};

export type PlanningAreaFilter = 'all' | 'assigned' | 'unassigned';

/** Area-transfer inspector flow (designer Mode G1). */
export type PlanningTransferScope = 'stop' | 'order';

export type PlanningTransferFlow = {
  stopId: string;
  orderId: string | null;
  scope: PlanningTransferScope | null;
  step: 'scope' | 'pick';
};
