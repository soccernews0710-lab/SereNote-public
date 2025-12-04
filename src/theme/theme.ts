// src/theme/theme.ts
export type ThemeName =
  | 'serenote'
  | 'calmGreen'
  | 'sunnyYellow'
  | 'nightBlue';

export type SerenoteTheme = {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    card: string;
    primary: string;
    primarySoft: string;
    textMain: string;
    textSub: string;
    borderSoft: string;
    accentBlue: string;
    accentGreen: string;
    accentOrange: string;
    accentMood: string;
    accentSleep: string;
    accentMeds: string;
    accentNotes: string;
  };
};

// 🎨 各テーマ定義
export const themes: Record<ThemeName, SerenoteTheme> = {
  serenote: {
    colors: {
      background: '#F3F4F6',
      surface: '#FFFFFF',
      surfaceAlt: '#E5E7EB',
      card: '#FFFFFF',
      primary: '#6366F1',
      primarySoft: '#EEF2FF',
      textMain: '#111827',
      textSub: '#6B7280',
      borderSoft: '#E5E7EB',
      accentBlue: '#0EA5E9',
      accentGreen: '#22C55E',
      accentOrange: '#F97316',
      accentMood: '#6366F1',
      accentSleep: '#22C55E',
      accentMeds: '#0EA5E9',
      accentNotes: '#F97316',
    },
  },

  calmGreen: {
    colors: {
      background: '#ECFDF3',
      surface: '#FFFFFF',
      surfaceAlt: '#DCFCE7',
      card: '#FFFFFF',
      primary: '#059669',
      primarySoft: '#D1FAE5',
      textMain: '#064E3B',
      textSub: '#047857',
      borderSoft: '#A7F3D0',
      accentBlue: '#0EA5E9',
      accentGreen: '#22C55E',
      accentOrange: '#F97316',
      accentMood: '#10B981',
      accentSleep: '#4ADE80',
      accentMeds: '#22C55E',
      accentNotes: '#F97316',
    },
  },

  sunnyYellow: {
    colors: {
      background: '#FFFBEB',
      surface: '#FFFFFF',
      surfaceAlt: '#FEF3C7',
      card: '#FFFFFF',
      primary: '#F59E0B',
      primarySoft: '#FEF3C7',
      textMain: '#78350F',
      textSub: '#92400E',
      borderSoft: '#FCD34D',
      accentBlue: '#0EA5E9',
      accentGreen: '#22C55E',
      accentOrange: '#F97316',
      accentMood: '#F97316',
      accentSleep: '#F59E0B',
      accentMeds: '#F97316',
      accentNotes: '#EF4444',
    },
  },

  nightBlue: {
    colors: {
      background: '#020617',
      surface: '#0F172A',
      surfaceAlt: '#1E293B',
      card: '#020617',
      primary: '#38BDF8',
      primarySoft: '#0F172A',
      textMain: '#E5E7EB',
      textSub: '#9CA3AF',
      borderSoft: '#1E293B',
      accentBlue: '#38BDF8',
      accentGreen: '#22C55E',
      accentOrange: '#F97316',
      accentMood: '#38BDF8',
      accentSleep: '#22C55E',
      accentMeds: '#A855F7',
      accentNotes: '#F97316',
    },
  },
};

export const defaultThemeName: ThemeName = 'serenote';
export const defaultTheme = themes[defaultThemeName];