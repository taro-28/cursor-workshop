import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";

interface TravelPlanInput {
  destination: string;
  origin: string;
  duration: number;
}

// 旅行プランの各ステップを定義するためのプロンプトテンプレート
const planningPrompt = PromptTemplate.fromTemplate(`
あなたは旅行プランナーです。以下の条件に基づいて詳細な旅行プランを作成してください：

出発地: {origin}
目的地: {destination}
旅行日数: {duration}日

以下の形式で出力してください：

# 概要
1. 移動手段（出発地から目的地まで）
2. 宿泊先のエリア
3. 予算目安
4. 持ち物アドバイス

# 詳細日程
| 日付 | 時間 | 行動 | 詳細 | 移動手段 |
|------|------|------|------|----------|
※1日目から最終日まで、時系列で具体的な行動を記載してください。
※各日の最初と最後に起床時間と就寝時間を含めてください。
※食事の時間も含めてください。
※移動時間も考慮して現実的な時間配分にしてください。
※観光スポット間の移動手段と所要時間も記載してください。

# 補足情報
1. おすすめグルメスポット
2. 気候や服装のアドバイス
3. 現地での注意点
`);

export class TravelPlannerGraph {
  private llm: ChatOpenAI;

  constructor(llm: ChatOpenAI) {
    this.llm = llm;
  }

  async generatePlan(input: TravelPlanInput): Promise<string> {
    const chain = RunnableSequence.from([
      planningPrompt,
      this.llm,
      (response: BaseMessage) => response.content,
    ]);

    const result = await chain.invoke({
      origin: input.origin,
      destination: input.destination,
      duration: input.duration,
    });

    return result as string;
  }
} 