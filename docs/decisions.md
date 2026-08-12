# Technical Decisions

## Driver MVP

Decision: PWA

Reason:
Background GPS is not required for the MVP.

---

## Map

Decision: Leaflet

Reason:
The team already has experience with Leaflet and it provides enough capabilities for the MVP.

---

## MVP Basemap

Decision: OpenStreetMap

Reason:
It is acceptable for the MVP and works with the current Leaflet prototype.

The map provider should remain replaceable.

---

## Optimization

Decision: Neshan

Reason:
Neshan will be used for optimization services.

---

## Backend

Decision: Go

Reason:
Current Backend direction defined by the Backend Owner.

---

## Repository

Decision: Single repository

Structure:

```text
apps/admin
apps/driver
backend
docs
scripts
infra
```
