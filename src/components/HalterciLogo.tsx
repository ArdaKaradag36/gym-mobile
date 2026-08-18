import Svg, { Circle, Path, Rect } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

export function HalterciLogo({ size = 28, color = '#C3F400' }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M2 6h20" />
      <Rect x="2" y="4" width="2" height="4" rx="0.5" />
      <Rect x="20" y="4" width="2" height="4" rx="0.5" />
      <Circle cx="12" cy="11" r="2" />
      <Path d="M8 12L7 6" />
      <Path d="M16 12L17 6" />
      <Path d="M12 13v5" />
      <Path d="M12 18l-2.5 4" />
      <Path d="M12 18l2.5 4" />
    </Svg>
  );
}
