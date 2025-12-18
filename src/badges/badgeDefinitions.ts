// src/badges/badgeDefinitions.ts
// 達成バッジの定義

export type BadgeId =
  | 'first_record'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'streak_60'
  | 'streak_90'
  | 'sleep_master_7'
  | 'sleep_master_14'
  | 'med_habit_7'
  | 'med_habit_14'
  | 'med_habit_30'
  | 'mood_tracker_7'
  | 'mood_tracker_30'
  | 'note_writer_10'
  | 'note_writer_30'
  | 'note_writer_100'
  | 'activity_logger_7'
  | 'breathing_first'
  | 'breathing_10'
  | 'early_bird'
  | 'night_owl';

export type BadgeCategory =
  | 'streak'      // 連続記録
  | 'sleep'       // 睡眠
  | 'medication'  // 服薬
  | 'mood'        // 気分
  | 'note'        // メモ・症状
  | 'activity'    // 行動
  | 'special';    // 特別

export type BadgeRarity =
  | 'common'      // よくある
  | 'uncommon'    // 少しレア
  | 'rare'        // レア
  | 'epic'        // エピック
  | 'legendary';  // レジェンダリー

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  // 達成に必要な条件（数値）
  requirement: number;
  // 達成条件の説明
  requirementText: string;
}

/**
 * 全バッジ定義
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ========== 連続記録系 ==========
  {
    id: 'first_record',
    name: 'はじめの一歩',
    description: '最初の記録をしました',
    emoji: '🌱',
    category: 'streak',
    rarity: 'common',
    requirement: 1,
    requirementText: '最初の記録をする',
  },
  {
    id: 'streak_3',
    name: '3日坊主卒業',
    description: '3日連続で記録できました',
    emoji: '🔥',
    category: 'streak',
    rarity: 'common',
    requirement: 3,
    requirementText: '3日連続で記録する',
  },
  {
    id: 'streak_7',
    name: '1週間達成',
    description: '7日連続で記録を続けました',
    emoji: '⭐',
    category: 'streak',
    rarity: 'uncommon',
    requirement: 7,
    requirementText: '7日連続で記録する',
  },
  {
    id: 'streak_14',
    name: '2週間継続',
    description: '14日連続で記録を続けました',
    emoji: '🌟',
    category: 'streak',
    rarity: 'rare',
    requirement: 14,
    requirementText: '14日連続で記録する',
  },
  {
    id: 'streak_30',
    name: '1ヶ月マスター',
    description: '30日連続で記録を続けました',
    emoji: '🏆',
    category: 'streak',
    rarity: 'epic',
    requirement: 30,
    requirementText: '30日連続で記録する',
  },
  {
    id: 'streak_60',
    name: '2ヶ月チャンピオン',
    description: '60日連続で記録を続けました',
    emoji: '👑',
    category: 'streak',
    rarity: 'epic',
    requirement: 60,
    requirementText: '60日連続で記録する',
  },
  {
    id: 'streak_90',
    name: 'レジェンド',
    description: '90日連続で記録を続けました',
    emoji: '💎',
    category: 'streak',
    rarity: 'legendary',
    requirement: 90,
    requirementText: '90日連続で記録する',
  },

  // ========== 睡眠系 ==========
  {
    id: 'sleep_master_7',
    name: '睡眠記録の習慣',
    description: '7日間睡眠を記録しました',
    emoji: '😴',
    category: 'sleep',
    rarity: 'common',
    requirement: 7,
    requirementText: '睡眠を7日間記録する',
  },
  {
    id: 'sleep_master_14',
    name: '睡眠マスター',
    description: '14日間睡眠を記録しました',
    emoji: '🌙',
    category: 'sleep',
    rarity: 'uncommon',
    requirement: 14,
    requirementText: '睡眠を14日間記録する',
  },

  // ========== 服薬系 ==========
  {
    id: 'med_habit_7',
    name: '服薬記録スタート',
    description: '7日間服薬を記録しました',
    emoji: '💊',
    category: 'medication',
    rarity: 'common',
    requirement: 7,
    requirementText: '服薬を7日間記録する',
  },
  {
    id: 'med_habit_14',
    name: '服薬習慣',
    description: '14日間服薬を記録しました',
    emoji: '💉',
    category: 'medication',
    rarity: 'uncommon',
    requirement: 14,
    requirementText: '服薬を14日間記録する',
  },
  {
    id: 'med_habit_30',
    name: '服薬マスター',
    description: '30日間服薬を記録しました',
    emoji: '🏥',
    category: 'medication',
    rarity: 'rare',
    requirement: 30,
    requirementText: '服薬を30日間記録する',
  },

  // ========== 気分系 ==========
  {
    id: 'mood_tracker_7',
    name: '気分記録の習慣',
    description: '7日間気分を記録しました',
    emoji: '🙂',
    category: 'mood',
    rarity: 'common',
    requirement: 7,
    requirementText: '気分を7日間記録する',
  },
  {
    id: 'mood_tracker_30',
    name: '感情マスター',
    description: '30日間気分を記録しました',
    emoji: '🎭',
    category: 'mood',
    rarity: 'rare',
    requirement: 30,
    requirementText: '気分を30日間記録する',
  },

  // ========== メモ・症状系 ==========
  {
    id: 'note_writer_10',
    name: 'メモ習慣',
    description: 'メモ・症状を10件記録しました',
    emoji: '📝',
    category: 'note',
    rarity: 'common',
    requirement: 10,
    requirementText: 'メモ・症状を10件記録する',
  },
  {
    id: 'note_writer_30',
    name: '記録の達人',
    description: 'メモ・症状を30件記録しました',
    emoji: '📓',
    category: 'note',
    rarity: 'uncommon',
    requirement: 30,
    requirementText: 'メモ・症状を30件記録する',
  },
  {
    id: 'note_writer_100',
    name: 'メモマスター',
    description: 'メモ・症状を100件記録しました',
    emoji: '📚',
    category: 'note',
    rarity: 'rare',
    requirement: 100,
    requirementText: 'メモ・症状を100件記録する',
  },

  // ========== 行動系 ==========
  {
    id: 'activity_logger_7',
    name: '行動記録の習慣',
    description: '7日間行動を記録しました',
    emoji: '🏃',
    category: 'activity',
    rarity: 'common',
    requirement: 7,
    requirementText: '行動を7日間記録する',
  },

  // ========== 特別系 ==========
  {
    id: 'breathing_first',
    name: '深呼吸デビュー',
    description: '初めて呼吸エクササイズを完了しました',
    emoji: '🫁',
    category: 'special',
    rarity: 'common',
    requirement: 1,
    requirementText: '呼吸エクササイズを1回完了する',
  },
  {
    id: 'breathing_10',
    name: 'リラックスマスター',
    description: '呼吸エクササイズを10回完了しました',
    emoji: '🧘',
    category: 'special',
    rarity: 'uncommon',
    requirement: 10,
    requirementText: '呼吸エクササイズを10回完了する',
  },
  {
    id: 'early_bird',
    name: '早起き',
    description: '朝6時前に起床を記録しました',
    emoji: '🌅',
    category: 'special',
    rarity: 'uncommon',
    requirement: 1,
    requirementText: '6時前の起床を記録する',
  },
  {
    id: 'night_owl',
    name: '夜更かし',
    description: '深夜0時以降に就寝を記録しました',
    emoji: '🦉',
    category: 'special',
    rarity: 'common',
    requirement: 1,
    requirementText: '0時以降の就寝を記録する',
  },
];

/**
 * バッジIDから定義を取得
 */
export function getBadgeDefinition(id: BadgeId): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(b => b.id === id);
}

/**
 * カテゴリでフィルタ
 */
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(b => b.category === category);
}

/**
 * レアリティの色を取得
 */
export function getRarityColor(rarity: BadgeRarity): string {
  switch (rarity) {
    case 'common':
      return '#9CA3AF'; // グレー
    case 'uncommon':
      return '#10B981'; // 緑
    case 'rare':
      return '#3B82F6'; // 青
    case 'epic':
      return '#8B5CF6'; // 紫
    case 'legendary':
      return '#F59E0B'; // 金
    default:
      return '#9CA3AF';
  }
}

/**
 * レアリティのラベルを取得
 */
export function getRarityLabel(rarity: BadgeRarity): string {
  switch (rarity) {
    case 'common':
      return 'コモン';
    case 'uncommon':
      return 'アンコモン';
    case 'rare':
      return 'レア';
    case 'epic':
      return 'エピック';
    case 'legendary':
      return 'レジェンダリー';
    default:
      return '';
  }
}
