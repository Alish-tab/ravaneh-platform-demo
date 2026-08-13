import { BaseMap } from '@/shared/map/BaseMap';
import { ROUTE_PALETTE_HEX } from '@/shared/map/grammar';
import { InlineMessage, LtrData, Panel, StatusBadge } from '@/shared/ui';

export function MapSmokePage() {
  return (
    <section className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">نقشه — Smoke Test</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Leaflet باقی مانده؛ رنگ‌های Route و وضعیت Stop از Map Grammar Foundation آماده‌اند.
        </p>
      </div>

      <InlineMessage tone="info">
        SVG Mock Map از Foundation وارد نشد. Marker/Route style از{' '}
        <LtrData>shared/map/grammar.ts</LtrData> روی Leaflet اعمال می‌شود.
      </InlineMessage>

      <Panel title="Route palette (presentation)">
        <div className="flex flex-wrap gap-2">
          {ROUTE_PALETTE_HEX.map((hex, index) => (
            <StatusBadge
              key={hex}
              tone="neutral"
              label={
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: hex,
                    }}
                  />
                  مسیر {index + 1}
                  <LtrData>{hex}</LtrData>
                </span>
              }
            />
          ))}
        </div>
      </Panel>

      <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--border-default)]">
        <BaseMap className="h-80 w-full" />
      </div>
    </section>
  );
}
