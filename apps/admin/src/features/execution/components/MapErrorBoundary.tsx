import { Component, type ErrorInfo, type ReactNode } from 'react';

type MapErrorBoundaryProps = {
  children: ReactNode;
};

type MapErrorBoundaryState = {
  failed: boolean;
};

/**
 * Keep the operations panel usable if the Leaflet/basemap surface throws.
 */
export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('A04 map failed', error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="execution-map-fallback" role="alert">
          نمایش نقشه در دسترس نیست. داده‌های عملیاتی در پنل قابل استفاده است.
        </div>
      );
    }
    return this.props.children;
  }
}
