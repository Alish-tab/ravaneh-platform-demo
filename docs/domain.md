# Domain

This document describes the main domain concepts of Ravaneh.

## Plan

A planning unit that contains delivery tasks and routes for an operational planning cycle.

Exact semantics of whether a Plan represents a full day or a time slot are still TBD.

## DeliveryTask

Represents a delivery that needs to be completed.

A DeliveryTask may originate from an imported Excel row or may be created manually.

## Review Issue

Represents a data quality issue associated with a DeliveryTask.

Examples:

- Missing Location
- Suspicious Location
- Possible Duplicate

## Location

The geographic location associated with a DeliveryTask or Stop.

A non-zero coordinate does not necessarily mean the location is valid.

## Route

A collection of Stops assigned together for delivery.

Route membership is authoritative on the Backend.

## RouteRevision

A version of a Route.

Admin changes may create a new working revision while the Driver continues to use the last published revision.

## Stop

A physical destination inside a Route.

Multiple DeliveryTasks may belong to the same Stop.

## Driver

The person assigned to execute a published Route.

## DeliveryAttempt

Represents the result of an attempt to complete a delivery.

The exact delivery status model is still TBD.
