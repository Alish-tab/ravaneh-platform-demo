import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  d: string;
  size?: number;
};

export function Icon({
  d,
  size = 14,
  stroke = 'currentColor',
  fill = 'none',
  strokeWidth = 1.5,
  ...rest
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export { ICONS } from '@/features/plans/components/icon-paths';
