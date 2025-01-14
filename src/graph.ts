import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";

interface TravelPlanInput {
  destination: string;
  origin: string;
  duration: number;
  budget?: number;
}

// 基本プラン生成のプロンプト
const planningPrompt = PromptTemplate.fromTemplate(`
あなたは旅行プランナーです。以下の条件に基づいて詳細な旅行プランを作成してください：

出発地: {origin}
目的地: {destination}
旅行日数: {duration}日

以下の形式で出力してください。フォーマットは厳密に守ってください：

# 概要
1. 移動手段（出発地から目的地まで）: [説明を記載]
2. 宿泊先のエリア: [説明を記載]
3. 予算目安: [説明を記載]
4. 持ち物アドバイス: [説明を記載]

# 詳細日程
| 日付 | 時間 | 行動 | 詳細 | 移動手段 |
|------|------|------|------|----------|
| 1日目 | 08:00 | [行動] | [詳細] | [移動手段] |
| 1日目 | 10:00 | [行動] | [詳細] | [移動手段] |
| 1日目 | 12:00 | [行動] | [詳細] | [移動手段] |
| 1日目 | 15:00 | [行動] | [詳細] | [移動手段] |
| 1日目 | 19:00 | [行動] | [詳細] | [移動手段] |

※上記のフォーマットを各日について繰り返してください。
※各日は必ず以下の時間帯の予定を含めてください：
1. 朝の予定（07:00-09:00）
   - 起床・朝食
   - 初日の場合は出発準備・移動
   - 最終日の場合は帰国準備・移動
2. 午前の予定（09:00-12:00）
   - 観光、アクティビティ、移動など
3. 昼食の予定（12:00-14:00）
   - 現地のグルメ、レストラン、屋台など
4. 午後の予定（14:00-18:00）
   - 観光、ショッピング、体験など
5. 夜の予定（18:00-22:00）
   - 夕食、ナイトマーケット、休息など

※時間は24時間表記で記載してください（例: 09:00, 14:30）
※移動手段が不要な場合は「-」と記載してください
※各予定には具体的な説明を含めてください
※1日5つの予定を必ず記載してください

# 補足情報
1. おすすめグルメスポット: [説明を記載]
2. 気候や服装のアドバイス: [説明を記載]
3. 現地での注意点: [説明を記載]
`);

// 予算最適化のプロンプト
const budgetOptimizationPrompt = PromptTemplate.fromTemplate(`
以下の旅行プランに対して、予算の最適化と詳細な内訳を提案してください。

旅行プラン:
{originalPlan}

予算目安: {budget}円

以下の形式で予算の最適化案を出力してください：

# 予算内訳
1. 交通費
  - 航空券/移動手段
  - 現地交通費
2. 宿泊費
  - ホテルグレード
  - 宿泊エリア
3. 食費
  - 朝食
  - 昼食
  - 夕食
4. アクティビティ費用
  - 観光スポット入場料
  - オプショナルツアー
5. その他経費
  - お土産
  - 予備費

# 最適化提案
※予算に応じた具体的な提案を記載してください
※コストパフォーマンスを考慮した選択肢を提示してください
※予算超過の場合は、調整案を提示してください

# 総評
※予算の実現可能性について評価してください
※季節による価格変動についても言及してください
`);

export class TravelPlannerGraph {
  private llm: ChatOpenAI;

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
  }

  async generatePlan(input: TravelPlanInput): Promise<string> {
    // 基本プラン生成
    const basicPlanChain = RunnableSequence.from([
      planningPrompt,
      this.llm,
      (response: BaseMessage) => response.content as string,
    ]);

    const basicPlan = await basicPlanChain.invoke({
      origin: input.origin,
      destination: input.destination,
      duration: input.duration,
    });

    // 予算が指定されている場合は予算最適化を実行
    if (input.budget) {
      const budgetOptimizationChain = RunnableSequence.from([
        budgetOptimizationPrompt,
        this.llm,
        (response: BaseMessage) => response.content as string,
      ]);

      const optimizedBudget = await budgetOptimizationChain.invoke({
        originalPlan: basicPlan,
        budget: input.budget,
      });

      // 基本プランと予算最適化プランを結合
      return `${basicPlan}\n\n# 予算最適化プラン\n${optimizedBudget}`;
    }

    return basicPlan;
  }
} 