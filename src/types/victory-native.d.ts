// src/types/victory-native.d.ts

declare module 'victory-native' {
  // 今使っているコンポーネントだけ any で定義しておく
  export const CartesianChart: any;
  export const Line: any;
  export const Scatter: any;

  // （将来また使うかもしれない旧 API も残しておきたければ↓も付けてOK）
  export const VictoryAxis: any;
  export const VictoryBar: any;
  export const VictoryChart: any;
  export const VictoryGroup: any;
  export const VictoryLine: any;
  export const VictoryScatter: any;
  export const VictoryTheme: any;
}