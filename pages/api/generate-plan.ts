import type { NextApiRequest, NextApiResponse } from 'next';
import { ChatOpenAI } from "@langchain/openai";
import { TravelPlannerGraph } from '../../src/graph';
import { config } from 'dotenv';

// 環境変数の読み込み
config();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { origin, destination, duration } = req.body;

    // OpenAI APIの初期化
    const llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
    });

    // 旅行プランナーグラフの初期化
    const travelPlanner = new TravelPlannerGraph(llm);

    // 旅程の生成
    const content = await travelPlanner.generatePlan({
      origin,
      destination,
      duration,
    });

    res.status(200).json({ content });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ message: 'Error generating travel plan' });
  }
} 