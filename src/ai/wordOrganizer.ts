// src/ai/wordOrganizer.ts
// v1.0用の「なんちゃってAI」ロジック（拡張版）。
// GPTなど外部APIは使わず、キーワード分類＋テンプレで返信を組み立てる。

export type MoodCategory =
  | "anxiety"
  | "tired"
  | "self_blame"
  | "angry"
  | "other";

export type AiThemeId = "reflect" | "moyamoya" | "anxiety" | "free";

export interface AiInput {
  themeId: AiThemeId;
  text: string;
}

export interface AiReplyResult {
  category: MoodCategory;
  isDanger: boolean;
  reply: string;
  /** もし余裕があれば…レベルの静かな問い（任意） */
  reflectionQuestion?: string;
}

// ===== キーワードによるざっくり分類 =====

const KEYWORDS: Record<MoodCategory, string[]> = {
  anxiety: ["不安", "こわい", "怖い", "心配", "緊張", "ソワソワ"],
  tired: ["疲れ", "だるい", "しんどい", "もう無理", "限界", "休みたい"],
  self_blame: ["自分が悪い", "ダメ", "価値がない", "消えたい", "消えてしまいたい"],
  angry: ["ムカつく", "ムカついて", "怒り", "怒って", "イライラ", "腹が立つ"],
  other: [],
};

function normalize(text: string): string {
  // 日本語メインなので、最低限の正規化だけ
  return text.replace(/\s+/g, " ").trim();
}

export function classifyText(text: string): MoodCategory {
  const t = normalize(text);
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => t.includes(w))) {
      return category as MoodCategory;
    }
  }
  return "other";
}

// ===== 危険ワード検知 =====

const DANGER_WORDS: string[] = [
  "死にたい",
  "消えたい",
  "自殺",
  "首を吊りたい",
  "生きていたくない",
  "終わりにしたい",
  "全部終わらせたい",
  "リスカ",
  "OD",
  "オーバードーズ",
];

export function containsDanger(text: string): boolean {
  const t = normalize(text);
  return DANGER_WORDS.some((w) => t.includes(w));
}

// ===== 一部だけ引用して差し込むためのスニペット抽出 =====

export function extractSnippet(text: string, maxLen = 20): string {
  const noSpaces = text.replace(/\s+/g, "");
  if (noSpaces.length === 0) return "ここに書いたこと";
  return noSpaces.length > maxLen ? noSpaces.slice(0, maxLen) + "…" : noSpaces;
}

// ===== テンプレート群 =====
// 「〇〇〇」をユーザー入力の一部に置き換えて使う。

const TEMPLATES: Record<MoodCategory, string[]> = {
  anxiety: [
    "不安な気持ちの中で、ここに書いてくれたんだと思います。\n「〇〇〇」のあたりに、先のことを考えすぎて心が休めていない感じがありました。\n今は、はっきりした答えを出さなくても大丈夫です。",
    "かなり神経が張りつめている状態みたいですね。\n「〇〇〇」という部分に、頭の中がずっと動き続けている様子が伝わってきました。\n今日は、ここまで言葉にできたことだけでも十分かもしれません。",
  ],
  tired: [
    "かなり疲れがたまっている状態みたいですね。\n「〇〇〇」のところに、限界に近いしんどさを感じました。\n今日は、これ以上がんばるよりも、少し力を抜く方を優先してもいい日かもしれません。",
    "心も体も、ゆっくりしたがっているように見えました。\n「〇〇〇」と書いたあたりに、長く続いた疲れがにじんでいます。\nうまく休めなくても、「休みたいと思えていること」自体は大事なサインです。",
  ],
  self_blame: [
    "自分を強く責めている感じが伝わってきました。\n「〇〇〇」という部分は、本当は一人で抱えきれない重さかもしれません。\n今日は、ダメなところ探しではなく、「ここまで耐えてきた自分」がいることも少しだけ思い出してもいいかもしれません。",
    "かなり厳しい目線で、自分を見ているように感じました。\n「〇〇〇」のあたりは、本来なら誰かと分け合ってもいいくらいの荷物です。\n今はまだ優しくできなくても、「責めてしまうくらい追い込まれている自分」がいることだけは認めてあげてください。",
  ],
  angry: [
    "かなり強い怒りやモヤモヤがたまっているように感じました。\n「〇〇〇」のところには、納得できない気持ちがはっきり表れています。\nちゃんと怒れている自分も、大事な反応のひとつです。",
    "我慢してきたものが、そろそろあふれそうな状態かもしれません。\n「〇〇〇」と書いた部分には、無視できない違和感がありそうです。\nうまく言葉にならなくても、ここに吐き出せたこと自体が一つの区切りになります。",
  ],
  other: [
    "言葉にしづらい気持ちを、ここに残してくれたんだと思います。\n「〇〇〇」という一部だけでも、今の自分のかけらがちゃんと見えています。\nうまく説明できなくても、ここまで書こうとしてくれたこと自体が大事です。",
    "まだはっきり形になっていない気持ちを、そのまま置いてくれたように感じました。\n「〇〇〇」のあたりに、言葉になりきらないモヤッとしたものがありますね。\n今日は、完璧に整理しようとしなくても大丈夫です。",
  ],
};

// テーマごとに、最初の一文を少し変えるためのプレフィックス
const THEME_PREFIX: Record<AiThemeId, string> = {
  reflect: "今日一日のことを、ここで振り返ろうとしてくれたんですね。\n",
  moyamoya: "はっきりしないモヤモヤを、言葉にしようとしてくれたんですね。\n",
  anxiety: "不安や心配ごとについて、ここで整理しようとしてくれたんですね。\n",
  free: "特にテーマを決めずに書いてくれた言葉を、大事に受け取りたいです。\n",
};

// 危険ワード用の固定メッセージ
const DANGER_MESSAGE =
  "とてもつらい気持ちの中で、ここに書いてくれたんだと思います。\n" +
  "このアプリだけでは受け止めきれない部分もあるかもしれません。\n" +
  "もし可能であれば、信頼できそうな身近な人や、お住まいの地域の相談窓口・医療機関にも、少しだけ頼ってみてほしいです。\n" +
  "ここに書いてくれたこと自体は、とても大事な一歩だと思います。";

// ===== そっと投げかける「問い」たち =====

type ReflectionMap = Partial<
  Record<
    MoodCategory,
    Partial<Record<AiThemeId | "default", string[]>>
  >
>;

const REFLECTION_QUESTIONS: ReflectionMap = {
  anxiety: {
    reflect: [
      "今日一日の中で、少しだけホッとした瞬間があるとしたら、どのあたりですか？",
    ],
    anxiety: [
      "いちばん不安が強くなるタイミングは、朝・昼・夜のうち、どの時間帯が多いですか？",
    ],
    default: [
      "今の不安を、誰かに一文だけで伝えるとしたら、どんな言葉になりそうですか？",
    ],
  },
  tired: {
    reflect: [
      "最近「ここから疲れ始めたな」と感じるタイミングに、何か共通点はありますか？",
    ],
    free: [
      "少しだけ減らしてみたい負担があるとしたら、どんなことが思い浮かびますか？",
    ],
    default: [
      "今日は、0〜10の中でいうと「疲れレベル」はどのくらいに感じますか？",
    ],
  },
  self_blame: {
    moyamoya: [
      "同じ出来事を、親しい人が経験していたとしたら、どんな言葉をかけてあげたいですか？",
    ],
    default: [
      "ここ最近で、「少しだけがんばれたな」と思えた場面がもしあれば、どんなことがありますか？",
    ],
  },
  angry: {
    reflect: [
      "今感じている怒りやモヤモヤの中に、「本当はこうしてほしかった」という気持ちはありそうですか？",
    ],
    default: [
      "今日の中で、「ここだけは納得いかない」と感じたポイントを一つ挙げるとしたら、どこになりそうですか？",
    ],
  },
  other: {
    free: [
      "今の気持ちに、強いて一つだけ色をつけるとしたら、どんな色が近いですか？",
    ],
    default: [
      "うまく言葉にならないままでいいので、「今の自分にタイトルをつけるなら？」と聞かれたら、どんな言葉が浮かびますか？",
    ],
  },
};

function pickReflectionQuestion(
  category: MoodCategory,
  themeId: AiThemeId
): string | undefined {
  const byCategory = REFLECTION_QUESTIONS[category];
  if (!byCategory) return undefined;

  const candidates =
    byCategory[themeId] ??
    byCategory.default ??
    undefined;

  if (!candidates || candidates.length === 0) return undefined;

  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx];
}

// ===== メイン関数：入力 -> 返信を作る =====

export function buildAiReply(input: AiInput): AiReplyResult {
  const { themeId, text } = input;
  const normalized = normalize(text);

  if (!normalized) {
    return {
      category: "other",
      isDanger: false,
      reply:
        "まだ言葉がまとまっていないみたいです。\n思いついたタイミングで、短く一言だけでも書いてみてください。",
    };
  }

  if (containsDanger(normalized)) {
    return {
      category: "self_blame",
      isDanger: true,
      reply: DANGER_MESSAGE,
      reflectionQuestion: undefined, // プレッシャーを避ける
    };
  }

  const category = classifyText(normalized);
  const templates = TEMPLATES[category];
  const snippet = extractSnippet(normalized);

  const baseTemplate =
    templates[Math.floor(Math.random() * templates.length)];

  const withSnippet = baseTemplate.replace("〇〇〇", snippet);
  const prefix = THEME_PREFIX[themeId] ?? "";
  const reflectionQuestion = pickReflectionQuestion(category, themeId);

  return {
    category,
    isDanger: false,
    reply: prefix + withSnippet,
    reflectionQuestion,
  };
}