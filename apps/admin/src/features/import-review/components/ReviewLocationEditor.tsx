import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

import { BaseMap } from '@/shared/map/BaseMap';
import { InvalidateOnMount } from '@/shared/map/MapViewport';
import { LtrData } from '@/shared/ui';

import {
  REVIEW_TEST_PROPOSED_LOCATION,
  formatLatLng,
} from '@/features/import-review/review-model';
import type { ReviewLatLng } from '@/features/import-review/review-types';

type ReviewLocationEditorProps = {
  saved: ReviewLatLng | null;
  proposed: ReviewLatLng | null;
  onPropose: (coords: ReviewLatLng) => void;
  readOnly?: boolean;
};

function ReviewLocationLayer({
  saved,
  proposed,
  onPropose,
  readOnly,
}: ReviewLocationEditorProps) {
  const map = useMap();
  const onProposeRef = useRef(onPropose);
  useEffect(() => {
    onProposeRef.current = onPropose;
  });

  useEffect(() => {
    if (readOnly) return;
    const handler = (event: L.LeafletMouseEvent) => {
      event.originalEvent.stopPropagation();
      onProposeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    };
    map.on('click', handler);
    map.getContainer().style.cursor = 'crosshair';
    return () => {
      map.off('click', handler);
      map.getContainer().style.cursor = '';
    };
  }, [map, readOnly]);

  useEffect(() => {
    if (!saved) return;
    const icon = L.divIcon({
      className: '',
      html: `<div data-testid="review-saved-marker" style="width:16px;height:16px;border-radius:50%;border:2px dashed rgba(255,255,255,0.7);background:rgba(100,130,160,0.28);box-sizing:border-box;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const marker = L.marker([saved.lat, saved.lng], {
      icon,
      interactive: false,
      zIndexOffset: 500,
    }).addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, saved]);

  useEffect(() => {
    if (!proposed) return;
    const icon = L.divIcon({
      className: '',
      html: `<div data-testid="review-proposed-marker" style="width:16px;height:16px;border-radius:50%;background:#3d7bd4;border:2px solid white;box-shadow:0 0 0 2px #3d7bd4;box-sizing:border-box;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const marker = L.marker([proposed.lat, proposed.lng], {
      icon,
      interactive: false,
      zIndexOffset: 600,
    }).addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, proposed]);

  return null;
}

export function ReviewLocationEditor({
  saved,
  proposed,
  onPropose,
  readOnly = false,
}: ReviewLocationEditorProps) {
  const center: [number, number] = proposed
    ? [proposed.lat, proposed.lng]
    : saved
      ? [saved.lat, saved.lng]
      : [35.6892, 51.389];

  return (
    <div className="review-location-editor">
      <div
        className="review-location-map"
        data-testid="review-location-map"
        onClick={(event) => {
          if (readOnly) return;
          const target = event.target as HTMLElement;
          if (target.closest('[data-testid="base-map-stub"]')) {
            onPropose(
              proposed
                ? { lat: REVIEW_TEST_PROPOSED_LOCATION.lat + 0.01, lng: REVIEW_TEST_PROPOSED_LOCATION.lng + 0.01 }
                : REVIEW_TEST_PROPOSED_LOCATION,
            );
          }
        }}
      >
        <BaseMap
          center={center}
          zoom={saved || proposed ? 14 : 12}
          className="review-location-leaflet"
          zoomControl={false}
          scrollWheelZoom={!readOnly}
        >
          <InvalidateOnMount />
          <ReviewLocationLayer
            saved={saved}
            proposed={proposed}
            onPropose={onPropose}
            readOnly={readOnly}
          />
        </BaseMap>
      </div>
      <div className="review-location-coords">
        <div className="flex min-w-0 flex-col items-center gap-1 text-center">
          <span className="review-inspector-label !mb-0">موقعیت ذخیره‌شده</span>
          {saved ? (
            <LtrData className="max-w-full" data-testid="review-saved-coords">
              {formatLatLng(saved)}
            </LtrData>
          ) : (
            <span
              data-testid="review-saved-coords"
              className="max-w-full text-[var(--text-disabled)]"
            >
              موقعیت عملیاتی ثبت نشده
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col items-center gap-1 text-center">
          <span className="review-inspector-label !mb-0">موقعیت پیشنهادی</span>
          {proposed ? (
            <LtrData className="max-w-full" data-testid="review-proposed-coords">
              {formatLatLng(proposed)}
            </LtrData>
          ) : (
            <span
              data-testid="review-proposed-coords"
              className="max-w-full text-[var(--text-disabled)]"
            >
              روی نقشه کلیک کنید
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
