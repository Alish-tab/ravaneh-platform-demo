/**
 * Feature-local Planning fixture types (UI presentation only).
 * Not OpenAPI / backend contracts.
 *
 * Area and Route are different identities. Do not use routeId as an Area id.
 */

import type { PlanningGenerationPhase } from '@/features/planning/generation';

export type PlanningDeliveryTask = {
  taskId: string;
  /** External Order ID — string identity, never derived into phone. */
  orderId: string;
  recipientName: string;
  address: string;
  /** Plan-dataset phone. Never derived from orderId. */
  phone: string;
};

export type PlanningStop = {
  stopId: string;
  seq: number;
  /** Saved operational / resolved location. */
  lat: number;
  lng: number;
  /** Raw imported coordinates. Never overwritten by operational correction. */
  rawLat: number | null;
  rawLng: number | null;
  tasks: PlanningDeliveryTask[];
};

export type PlanningRoutePlanState = 'draft' | 'assigned' | 'modified' | 'published';

export type PlanningRecalcState = 'idle' | 'required' | 'recalculating' | 'failed';

/**
 * Geographic grouping of Physical Stops.
 * Membership is explicit (`memberStopIds` / nested `stops`), never polygon containment.
 */
export type PlanningArea = {
  areaId: string;
  label: string;
  color: string;
  memberStopIds: string[];
  driverId: string | null;
  driverName: string | null;
  /** Working Planning preference only — not Published / lifecycle / section lock. */
  driverAssignmentLocked: boolean;
  /** Nested stops for UI. Source of truth for membership is `memberStopIds`. */
  stops: PlanningStop[];
  planState: PlanningRoutePlanState;
};

/**
 * Ordered movement of a Driver among Physical Stops inside one Area.
 * `routeId` is never the Area identity.
 */
export type PlanningRoute = {
  routeId: string;
  areaId: string;
  orderedStopIds: string[];
  dirty: boolean;
  recalcState: PlanningRecalcState;
  distanceKm: number;
  durationMin: number;
};

/** Planning-local driver catalog entry (picker only). */
export type PlanningDriver = {
  driverId: string;
  driverName: string;
  /** Explicit fixture conflict presentation — not a Backend scheduling rule. */
  hasPlanConflict?: boolean;
  conflictReason?: string;
};

export type PlanningDepot = {
  name: string;
  lat: number;
  lng: number;
};

export type PlanningMutationImpact = {
  affectedAreaIds: string[];
  dirtyRouteIds: string[];
  planningAttention: string[];
};

export type PlanningPublishBlockerCode =
  | 'area-without-driver'
  | 'unassigned-order'
  | 'planning-conflict'
  | 'dirty-route'
  | 'mutation-in-progress'
  | 'upstream-spatial'
  | 'review-blocker';

export type PlanningPublishBlocker = {
  code: PlanningPublishBlockerCode;
  message: string;
};

export type PlanningPublishReadiness = {
  canPublish: boolean;
  blockers: PlanningPublishBlocker[];
};

export type PlanningDispatchResult =
  | {
      kind: 'found';
      orderId: string;
      areaId: string;
      areaLabel: string;
      driverName: string | null;
      address: string;
      phone: string;
      stopId: string;
    }
  | { kind: 'unassigned'; orderId: string; stopId: string; address: string; phone: string }
  | { kind: 'excluded'; orderId: string }
  | { kind: 'notfound'; orderId: string };

export type PlanningSystemErrorKind = 'network' | 'server' | 'conflict' | null;

export type PlanningPlanFixture = {
  planId: string;
  planName: string;
  /** Omitted unless the Plan data explicitly has a depot. */
  depot: PlanningDepot | null;
  areas: PlanningArea[];
  routes: PlanningRoute[];
  unassignedStops: PlanningStop[];
  generationPhase: PlanningGenerationPhase;
  targetAreaCount: number;
  lockAssignmentsOnRebuild: boolean;
  reviewBlockerCount: number;
  eligibleOrderCount: number;
  upstreamSpatialAttention: boolean;
  lastMutationImpact?: PlanningMutationImpact;
};

export type PlanningSelection = {
  selectedAreaId: string | null;
  selectedStopId: string | null;
  selectedOrderId: string | null;
  selectedUnassignedStopId: string | null;
  /** @deprecated Use selectedAreaId. Kept for transitional call sites. */
  selectedRouteId?: string | null;
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
