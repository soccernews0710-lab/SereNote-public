// app/stats/LineChart.tsx
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { ChartPoint } from '../../src/stats/statsLogic';
import { useTheme } from '../../src/theme/useTheme';

type LineChartProps = {
  color: string;
  points: ChartPoint[];
  yMin: number;
  yMax: number;
  height?: number;
  valueFormatter?: (v: number) => string;
};

export const LineChart: React.FC<LineChartProps> = ({
  color,
  points,
  yMin,
  yMax,
  height = 140,
  valueFormatter,
}) => {
  const { theme } = useTheme();

  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [points.length, width, fadeAnim]);

  if (points.length === 0) {
    return (
      <View
        style={[
          styles.chartPlaceholderBox,
          {
            borderColor: theme.colors.borderSoft,
            backgroundColor: theme.colors.surfaceAlt,
          },
        ]}
        onLayout={handleLayout}
      >
        <Text
          style={[
            styles.chartPlaceholderText,
            { color: theme.colors.textSub },
          ]}
        >
          まだデータがありません
        </Text>
      </View>
    );
  }

  if (width === 0) {
    return (
      <View
        style={[
          styles.chartPlaceholderBox,
          {
            borderColor: theme.colors.borderSoft,
            backgroundColor: theme.colors.surfaceAlt,
          },
        ]}
        onLayout={handleLayout}
      />
    );
  }

  const paddingX = 12;
  const paddingY = 10;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const minY = yMin;
  const maxY = yMax;
  const rangeY = maxY - minY || 1;

  const xs: number[] = [];
  const ys: number[] = [];

  points.forEach((p, i) => {
    const t = points.length === 1 ? 0.5 : i / (points.length - 1);
    const x = paddingX + t * innerWidth;
    const norm = (p.value - minY) / rangeY;
    const y = paddingY + innerHeight - norm * innerHeight;
    xs.push(x);
    ys.push(y);
  });

  let d = '';
  xs.forEach((x, i) => {
    const y = ys[i];
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  const selected =
    selectedIndex != null && points[selectedIndex]
      ? {
          ...points[selectedIndex],
          x: xs[selectedIndex],
          y: ys[selectedIndex],
        }
      : null;

  const handleTouch = (e: GestureResponderEvent) => {
    const { locationX } = e.nativeEvent;
    const x = Math.min(width - paddingX, Math.max(paddingX, locationX));
    const ratio = points.length === 1 ? 0 : (x - paddingX) / innerWidth;
    const idx = Math.round(ratio * (points.length - 1));
    setSelectedIndex(idx);
  };

  return (
    <View
      style={[
        styles.chartTouchArea,
        {
          borderColor: theme.colors.borderSoft,
          backgroundColor: theme.colors.surfaceAlt,
        },
      ]}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {d && (
            <Path
              d={`${d} L ${xs[xs.length - 1]} ${height - paddingY} L ${
                xs[0]
              } ${height - paddingY} Z`}
              fill="url(#lineGrad)"
              stroke="none"
            />
          )}

          {d && <Path d={d} stroke={color} strokeWidth={2} fill="none" />}

          {xs.map((x, i) => (
            <Circle
              key={`pt-${i}`}
              cx={x}
              cy={ys[i]}
              r={selectedIndex === i ? 4.5 : 3}
              fill={selectedIndex === i ? color : '#ffffff'}
              stroke={color}
              strokeWidth={1.5}
            />
          ))}
        </Svg>
      </Animated.View>

      <View style={styles.chartTooltipBox}>
        {selected ? (
          <>
            <Text
              style={[
                styles.chartTooltipDate,
                { color: theme.colors.textSub },
              ]}
            >
              {selected.label}
            </Text>
            <Text
              style={[
                styles.chartTooltipValue,
                { color: theme.colors.textMain },
              ]}
            >
              {valueFormatter
                ? valueFormatter(selected.value)
                : selected.value.toFixed(2)}
            </Text>
          </>
        ) : (
          <Text
            style={[
              styles.chartTooltipHint,
              { color: theme.colors.textSub },
            ]}
          >
            グラフをタップすると、その日の値が表示されます
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartPlaceholderBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 12,
  },
  chartTouchArea: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  chartTooltipBox: {
    marginTop: 6,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTooltipHint: {
    fontSize: 11,
  },
  chartTooltipDate: {
    fontSize: 11,
  },
  chartTooltipValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});