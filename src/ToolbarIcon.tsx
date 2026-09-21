import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type ToolbarIconName = 'history' | 'ruler' | 'scientific' | 'backspace';

export function ToolbarIcon({ name, color }: { name: ToolbarIconName; color: string }) {
  const stroke = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  if (name === 'history') return (
    <Svg width={34} height={34} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="14" {...stroke} />
      <Path d="M24 15v9h7" {...stroke} />
    </Svg>
  );

  if (name === 'ruler') return (
    <Svg width={39} height={34} viewBox="0 0 48 48">
      <Rect x="7" y="15" width="34" height="18" rx="4" {...stroke} />
      {[13, 19, 25, 31, 37].map((x, index) => <Line key={x} x1={x} y1="15" x2={x} y2={index % 2 ? 20 : 22} {...stroke} />)}
    </Svg>
  );

  if (name === 'scientific') return (
    <Svg width={36} height={37} viewBox="0 0 48 48">
      <Rect x="10" y="7" width="28" height="34" rx="4" {...stroke} />
      <Path d="M15 18l3 3 4-8M26 14h8M30 14v8M26 22h8M15 28h7M15 34h7M27 28h7M27 34h7" {...stroke} />
    </Svg>
  );

  return (
    <Svg width={32} height={34} viewBox="0 0 48 48">
      <Path d="M17 12h22a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H17L6 24z" {...stroke} />
      <Path d="M24 19l10 10M34 19L24 29" {...stroke} />
    </Svg>
  );
}
