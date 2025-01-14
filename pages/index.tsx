import { useState } from 'react';
import type { NextPage } from 'next';

interface TravelPlan {
  content: string;
}

interface TravelFormData {
  origin: string;
  destination: string;
  duration: number;
  budget?: number;
}

interface ParsedPlan {
  overview: {
    transportation: string;
    accommodation: string;
    budget: string;
    items: string;
  };
  schedule: {
    day: string;
    time: string;
    action: string;
    detail: string;
    transport: string;
  }[];
  additional: {
    food: string;
    climate: string;
    notes: string;
  };
}

interface DaySchedule {
  day: string;
  schedules: {
    time: string;
    action: string;
    detail: string;
    transport: string;
  }[];
}

const parsePlan = (content: string): ParsedPlan => {
  const sections = content.split('#').filter(Boolean);
  const plan: ParsedPlan = {
    overview: {
      transportation: '',
      accommodation: '',
      budget: '',
      items: '',
    },
    schedule: [],
    additional: {
      food: '',
      climate: '',
      notes: '',
    }
  };

  sections.forEach(section => {
    const [title, ...content] = section.trim().split('\n');
    const cleanContent = content.filter(line => line.trim());

    if (title.includes('概要')) {
      cleanContent.forEach(line => {
        if (line.includes('移動手段')) plan.overview.transportation = line.split('移動手段')[1];
        if (line.includes('宿泊先')) plan.overview.accommodation = line.split('宿泊先')[1];
        if (line.includes('予算')) plan.overview.budget = line.split('予算')[1];
        if (line.includes('持ち物')) plan.overview.items = line.split('持ち物')[1];
      });
    } else if (title.includes('詳細日程')) {
      const scheduleLines = cleanContent.join('\n')
        .split('\n')
        .filter(line => line.includes('|'))
        .slice(2); // ヘッダーとセパレータを除外

      scheduleLines.forEach(line => {
        const [day, time, action, detail, transport] = line
          .split('|')
          .slice(1, -1)
          .map(cell => cell.trim());
        
        if (day) {
          plan.schedule.push({ day, time, action, detail, transport });
        }
      });
    } else if (title.includes('補足情報')) {
      cleanContent.forEach(line => {
        if (line.includes('グルメスポット')) plan.additional.food = line.split('グルメスポット')[1];
        if (line.includes('気候')) plan.additional.climate = line.split('気候')[1];
        if (line.includes('注意点')) plan.additional.notes = line.split('注意点')[1];
      });
    }
  });

  return plan;
};

const AccordionCard = ({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden mb-4 bg-white shadow-sm">
      <button
        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{title}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

const DayScheduleAccordion = ({ 
  daySchedule,
  index
}: { 
  daySchedule: DaySchedule;
  index: number;
}) => {
  const [isOpen, setIsOpen] = useState(index === 0);

  return (
    <div className="border rounded-lg overflow-hidden mb-4 bg-white shadow-sm">
      <button
        className="w-full px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 transition-colors flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-blue-900">{`${index + 1}日目`}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="text-sm text-gray-600 border-b">
                <th className="pb-2 font-medium text-left w-24">時間</th>
                <th className="pb-2 font-medium text-left w-32">行動</th>
                <th className="pb-2 font-medium text-left">詳細</th>
                <th className="pb-2 font-medium text-left w-32">移動手段</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {daySchedule.schedules.map((schedule, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 text-gray-500">{schedule.time}</td>
                  <td className="py-3 font-medium text-gray-800">{schedule.action}</td>
                  <td className="py-3 text-gray-600">{schedule.detail}</td>
                  <td className="py-3 text-gray-500">{schedule.transport}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Home: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null);
  const [dots, setDots] = useState('');
  const [formData, setFormData] = useState<TravelFormData>({
    origin: '日本',
    destination: 'タイ',
    duration: 5,
    budget: 200000
  });
  const [error, setError] = useState<string>('');

  // ドットアニメーション用のインターバル
  const startLoadingAnimation = () => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 1000);
    return interval;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.origin || !formData.destination || formData.duration <= 0) {
      setError('すべての項目を入力してください。日数は1以上の数値を入力してください。');
      return;
    }

    setIsLoading(true);
    setPlan(null);
    setParsedPlan(null);
    const interval = startLoadingAnimation();

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('プランの生成に失敗しました');
      }

      const data = await response.json();
      setPlan(data);
      setParsedPlan(parsePlan(data.content));
    } catch (error) {
      console.error('エラーが発生しました:', error);
      setError('プランの生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
      setDots('');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">旅行プランナー</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <div className="space-y-4">
          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
              出発地
            </label>
            <input
              type="text"
              id="origin"
              name="origin"
              value={formData.origin}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              目的地
            </label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              旅行日数
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              min="1"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
              予算（円）
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              min="0"
              step="10000"
              value={formData.budget}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <p className="mt-1 text-sm text-gray-500">
              ※予算を入力すると、より詳細な予算プランを提案します
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? '生成中...' : 'プランを生成'}
            </button>
          </div>
        </div>
      </form>

      {isLoading && (
        <div className="text-center text-xl">
          旅行プランを考え中{dots}
        </div>
      )}

      {parsedPlan && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">旅行の概要</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-700">移動手段</h3>
                <p className="text-gray-600">{parsedPlan.overview.transportation}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">宿泊先</h3>
                <p className="text-gray-600">{parsedPlan.overview.accommodation}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">予算目安</h3>
                <p className="text-gray-600">{parsedPlan.overview.budget}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">持ち物</h3>
                <p className="text-gray-600">{parsedPlan.overview.items}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">詳細日程</h2>
            <div className="space-y-2">
              {Array.from({ length: formData.duration }).map((_, index) => {
                const daySchedules = parsedPlan.schedule.filter(
                  schedule => schedule.day.includes(`${index + 1}日目`) || 
                  (schedule.day === '' && parsedPlan.schedule.find(s => s.day.includes(`${index + 1}日目`)))
                );
                
                const scheduleData: DaySchedule = {
                  day: `${index + 1}日目`,
                  schedules: daySchedules.map(schedule => ({
                    time: schedule.time,
                    action: schedule.action,
                    detail: schedule.detail,
                    transport: schedule.transport
                  }))
                };

                return <DayScheduleAccordion key={index} daySchedule={scheduleData} index={index} />;
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">補足情報</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-700">おすすめグルメスポット</h3>
                <p className="text-gray-600">{parsedPlan.additional.food}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">気候と服装</h3>
                <p className="text-gray-600">{parsedPlan.additional.climate}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">注意点</h3>
                <p className="text-gray-600">{parsedPlan.additional.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 