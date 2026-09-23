import Svg, { Circle, Line, Path } from 'react-native-svg';

const GREEN = '#79d43f';
const WHITE = '#f0f0f2';

export function hasDrawnGlyph(label: string) {
  return ['()', '%', '÷', '×', '−', '+', '+/−', '='].includes(label);
}

export function KeyArtwork({ label, size }: { label: string; size: number }) {
  const stroke = { stroke: GREEN, strokeLinecap: 'round' as const, fill: 'none' };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 68 68"
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
    >
      <Circle cx="34" cy="34" r="34" fill={label === '=' ? '#369900' : '#1f1f1f'} />
      {label === '()' && (
        <>
          <Path d="M30 24C26 28 26 40 30 44" {...stroke} strokeWidth="2.3" />
          <Path d="M38 24C42 28 42 40 38 44" {...stroke} strokeWidth="2.3" />
        </>
      )}
      {label === '%' && (
        <>
          <Line x1="42" y1="24" x2="26" y2="44" {...stroke} strokeWidth="2.7" />
          <Circle cx="27" cy="26" r="2.3" fill={GREEN} />
          <Circle cx="41" cy="42" r="2.3" fill={GREEN} />
        </>
      )}
      {label === '÷' && (
        <>
          <Line x1="23" y1="34" x2="45" y2="34" {...stroke} strokeWidth="4" />
          <Circle cx="34" cy="24" r="2.4" fill={GREEN} />
          <Circle cx="34" cy="44" r="2.4" fill={GREEN} />
        </>
      )}
      {label === '×' && (
        <>
          <Line x1="26" y1="26" x2="42" y2="42" {...stroke} strokeWidth="4.1" />
          <Line x1="42" y1="26" x2="26" y2="42" {...stroke} strokeWidth="4.1" />
        </>
      )}
      {label === '−' && <Line x1="25.5" y1="34" x2="42.5" y2="34" {...stroke} strokeWidth="4" />}
      {label === '+' && (
        <>
          <Line x1="24" y1="34" x2="44" y2="34" {...stroke} strokeWidth="4" />
          <Line x1="34" y1="24" x2="34" y2="44" {...stroke} strokeWidth="4" />
        </>
      )}
      {label === '+/−' && (
        <>
          <Line
            x1="19"
            y1="32"
            x2="25"
            y2="32"
            stroke={WHITE}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <Line
            x1="22"
            y1="29"
            x2="22"
            y2="35"
            stroke={WHITE}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <Line
            x1="30"
            y1="44"
            x2="39"
            y2="24"
            stroke={WHITE}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <Line
            x1="43"
            y1="36"
            x2="49"
            y2="36"
            stroke={WHITE}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </>
      )}
      {label === '=' && (
        <>
          <Line
            x1="26"
            y1="29"
            x2="42"
            y2="29"
            stroke={WHITE}
            strokeWidth="5"
            strokeLinecap="square"
          />
          <Line
            x1="26"
            y1="39"
            x2="42"
            y2="39"
            stroke={WHITE}
            strokeWidth="5"
            strokeLinecap="square"
          />
        </>
      )}
    </Svg>
  );
}
