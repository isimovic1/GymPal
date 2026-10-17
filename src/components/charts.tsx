import { useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors } from '../theme';

function useWidth(initial = 300) {
  const [width, setWidth] = useState(initial);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return { width, onLayout };
}

/** Vertical bars with an optional dashed average line. */
export function BarChart({ data, height = 160, average, color = colors.expense }: {
  data: { label: string; value: number }[];
  height?: number;
  average?: number;
  color?: string;
}) {
  const { width, onLayout } = useWidth();
  const padL = 40;
  const padT = 8;
  const padB = 20;
  const chartH = height - padT - padB;
  const max = Math.max(1, average ?? 0, ...data.map((d) => d.value)) * 1.1;
  const slot = (width - padL) / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(24, slot * 0.65));
  const y = (v: number) => padT + chartH - (v / max) * chartH;
  const labelEvery = Math.ceil(data.length / 8);
  const ticks = [0, max / 2, max].map((t) => (max > 50 ? Math.round(t / 10) * 10 : Math.round(t)));

  return (
    <View onLayout={onLayout} style={{ height }}>
      <Svg width={width} height={height}>
        {ticks.map((t, i) => (
          <SvgText key={i} x={padL - 6} y={y(t) + 4} fontSize={10} fill={colors.muted} textAnchor="end">
            {t}
          </SvgText>
        ))}
        {data.map((d, i) => (
          <Rect
            key={i}
            x={padL + i * slot + (slot - barW) / 2}
            y={y(d.value)}
            width={barW}
            height={Math.max(0, padT + chartH - y(d.value))}
            rx={Math.min(3, barW / 2)}
            fill={d.value === 0 ? colors.border : color}
          />
        ))}
        {average !== undefined && average > 0 && (
          <Line x1={padL} x2={width} y1={y(average)} y2={y(average)} stroke={colors.primary} strokeWidth={1.5} strokeDasharray="5 4" />
        )}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <SvgText key={`l${i}`} x={padL + i * slot + slot / 2} y={height - 5} fontSize={10} fill={colors.muted} textAnchor="middle">
              {d.label}
            </SvgText>
          ) : null,
        )}
      </Svg>
    </View>
  );
}

export interface Point {
  /** x as a number, e.g. days since start. */
  x: number;
  y: number;
}

/** Line chart, e.g. estimated 1RM over time, with an optional horizontal reference line. */
export function LineChart({ points, height = 200, goal, xLabel }: {
  points: Point[];
  height?: number;
  goal?: number;
  xLabel?: (x: number) => string;
}) {
  const { width, onLayout } = useWidth();
  if (points.length === 0) {
    return (
      <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.muted }}>Još nema podataka.</Text>
      </View>
    );
  }
  const padL = 40;
  const padR = 10;
  const padT = 10;
  const padB = 20;
  const ys = points.map((p) => p.y).concat(goal !== undefined ? [goal] : []);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (maxY - minY < 2) {
    minY -= 1;
    maxY += 1;
  }
  const minX = points[0].x;
  const maxX = Math.max(minX + 1, points[points.length - 1].x);
  const sx = (x: number) => padL + ((x - minX) / (maxX - minX)) * (width - padL - padR);
  const sy = (v: number) => padT + (1 - (v - minY) / (maxY - minY)) * (height - padT - padB);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x)},${sy(p.y)}`).join(' ');
  const ticks = [minY, (minY + maxY) / 2, maxY];

  return (
    <View onLayout={onLayout} style={{ height }}>
      <Svg width={width} height={height}>
        {ticks.map((t, i) => (
          <SvgText key={i} x={padL - 6} y={sy(t) + 4} fontSize={10} fill={colors.muted} textAnchor="end">
            {t.toFixed(1)}
          </SvgText>
        ))}
        {goal !== undefined && (
          <Line x1={padL} x2={width - padR} y1={sy(goal)} y2={sy(goal)} stroke={colors.success} strokeWidth={1.5} strokeDasharray="5 4" />
        )}
        <Path d={path} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        {points.length <= 60 &&
          points.map((p, i) => <Circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3} fill={colors.primary} />)}
        {xLabel && (
          <>
            <SvgText x={padL} y={height - 4} fontSize={10} fill={colors.muted}>
              {xLabel(minX)}
            </SvgText>
            <SvgText x={width - padR} y={height - 4} fontSize={10} fill={colors.muted} textAnchor="end">
              {xLabel(maxX)}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}
