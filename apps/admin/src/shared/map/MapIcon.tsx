import type { SVGProps } from 'react';

type MapIconProps = SVGProps<SVGSVGElement> & { d: string; size?: number };

export function MapIcon({ d, size = 14, stroke = 'currentColor', fill = 'none', strokeWidth = 1.5, ...rest }: MapIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      <path d={d} />
    </svg>
  );
}

export const MAP_TOOLBAR_ICONS = {
  layers: 'M8 1 1 5l7 4 7-4-7-4zM1 11l7 4 7-4M1 7.5l7 4 7-4',
  target: 'M8 1v2M8 13v2M1 8h2M13 8h2M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  focus_area: 'M8 2.5 13 6l-1.5 7h-7L3 6l5-3.5zM7.25 1.75h1.5v1.5h-1.5zM12.25 5.25h1.5v1.5h-1.5zM10.75 12.25h1.5v1.5h-1.5zM3.75 12.25h1.5v1.5h-1.5zM2.25 5.25h1.5v1.5h-1.5z',
} as const;
