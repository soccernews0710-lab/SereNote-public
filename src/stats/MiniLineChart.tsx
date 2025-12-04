// src/components/stats/MiniLineChart.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
    Circle,
    Polyline,
    Line as SvgLine,
} from 'react-native-svg';

type MiniLineChartProps = {
  // 各日ごとの値（null は「データなし」）
  values: Array<number | null>;
  // Y軸の最小・最大（例: mood なら 1〜5）
  minY: number;
  maxY: number;
  // 線とドットの色
  color?: string;
  // 高さ
  height?: number;
};

export const MiniLineChart: React.FC<MiniLineChartProps> = ({
  values,
  minY,
  maxY,
  color = '#6366F1', // 薄い紫系
  height = 140,
}) => {
  const width = 320; // 親 View の横幅に合わせたい場合は Stats 側で調整

  const validValues = values.filter(v => v != null) as number[];
  const hasData = validValues.length > 0;

  // viewBox 上の座標系
  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 8;
  const paddingBottom = 16;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (!hasData) {
    // データなしなら、薄い横線だけ表示しておく
    return (
      <View style={[styles.container, { height }]}>
        <Svg width={width} height={height}>
          <SvgLine
            x1={paddingLeft}
            y1={paddingTop + chartHeight / 2}
            x2={paddingLeft + chartWidth}
            y2={paddingTop + chartHeight / 2}
            stroke="#E5E7EB"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        </Svg>
      </View>
    );
  }

  const pointCount = values.length;
  const stepX =
    pointCount > 1 ? chartWidth / (pointCount - 1) : 0;

  // Y 軸の正規化 helper
  const clamp = (v: number) =>
    Math.min(maxY, Math.max(minY, v));
  const normalizeY = (v: number) =>
    (clamp(v) - minY) / (maxY - minY || 1);

  // 折れ線の Polyline 用の points 文字列を作る
  const polylinePoints: string[] = [];
  const dots: { cx: number; cy: number }[] = [];

  values.forEach((v, index) => {
    if (v == null) {
      return;
    }
    const x =
      paddingLeft +
      stepX * index;
    const ratioY = normalizeY(v);
    const y =
      paddingTop +
      chartHeight * (1 - ratioY); // 上が小さい・下が大きい

    polylinePoints.push(`${x},${y}`);
    dots.push({ cx: x, cy: y });
  });

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        {/* 横の基準線（中央値あたり） */}
        <SvgLine
          x1={paddingLeft}
          y1={paddingTop + chartHeight / 2}
          x2={paddingLeft + chartWidth}
          y2={paddingTop + chartHeight / 2}
          stroke="#E5E7EB"
          strokeWidth={1}
        />

        {/* 折れ線 */}
        {polylinePoints.length > 1 && (
          <Polyline
            points={polylinePoints.join(' ')}
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
        )}

        {/* ドット */}
        {dots.map((d, idx) => (
          <Circle
            key={idx}
            cx={d.cx}
            cy={d.cy}
            r={3}
            fill={color}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});