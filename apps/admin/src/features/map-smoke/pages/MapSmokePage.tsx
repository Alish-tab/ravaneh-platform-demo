import { BaseMap } from '@/shared/map/BaseMap';

export function MapSmokePage() {
  return (
    <section className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">نقشه — Smoke Test</h1>
        <p className="text-sm text-slate-600">
          تأیید Integration مربوط به Leaflet / React-Leaflet و Tileهای قابل تعویض از Environment.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <BaseMap />
      </div>
    </section>
  );
}
