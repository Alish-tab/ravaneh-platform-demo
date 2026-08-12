/**
 * Zustand for client UI state only (selection, panels, map mode, layers).
 * Never duplicate server entities (Plans, Routes, Tasks, Drivers) here —
 * those belong to TanStack Query after OpenAPI is available.
 */
export { create } from 'zustand';
