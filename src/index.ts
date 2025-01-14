import { config } from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";
import { TravelPlannerGraph } from './graph';

// 環境変数の読み込み
config();

// 進行状況を表示する関数
function startProgress(): { stop: () => void } {
  process.stdout.write('旅行プランを考え中');
  let dots = 0;
  const interval = setInterval(() => {
    process.stdout.write('.');
    dots++;
    if (dots % 50 === 0) {
      process.stdout.write('\n旅行プランを考え中');
    }
  }, 1000);

  return {
    stop: () => {
      clearInterval(interval);
      process.stdout.write('\n\n');
    }
  };
}

// デフォルトの入力値
const DEFAULT_INPUT = {
  origin: '日本',
  destination: 'タイ',
  duration: 5
};

async function main() {
  // OpenAI APIの初期化
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
  });

  // 旅行プランナーグラフの初期化
  const travelPlanner = new TravelPlannerGraph(llm);

  try {
    console.log(`デフォルト入力値を使用します：\n出発地: ${DEFAULT_INPUT.origin}\n目的地: ${DEFAULT_INPUT.destination}\n旅行日数: ${DEFAULT_INPUT.duration}日\n`);

    // 進行状況の表示を開始
    const progress = startProgress();
    
    // 旅程の生成
    const result = await travelPlanner.generatePlan({
      origin: DEFAULT_INPUT.origin,
      destination: DEFAULT_INPUT.destination,
      duration: DEFAULT_INPUT.duration,
    });

    // 進行状況の表示を停止
    progress.stop();
    
    console.log('=== 旅行プラン ===\n');
    console.log(result);
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main(); 