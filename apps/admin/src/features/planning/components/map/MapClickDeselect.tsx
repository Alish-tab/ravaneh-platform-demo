import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

type MapClickDeselectProps = {
  enabled: boolean;
  onClearSelection: () => void;
};

/**
 * Clears map/panel selection when the user clicks empty map space.
 * Layer/marker handlers must call L.DomEvent.stopPropagation so they do not
 * also trigger this map-level click.
 */
export function MapClickDeselect({ enabled, onClearSelection }: MapClickDeselectProps) {
  const map = useMap();
  const onClearRef = useRef(onClearSelection);
  useEffect(() => {
    onClearRef.current = onClearSelection;
  });

  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      onClearRef.current();
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [enabled, map]);

  return null;
}

/** Prevent layer clicks from also firing the map empty-space deselect handler. */
export function stopMapClickPropagation(event: L.LeafletMouseEvent): void {
  L.DomEvent.stopPropagation(event);
}
