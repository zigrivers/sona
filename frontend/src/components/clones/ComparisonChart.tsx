import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import type { ProminenceScores } from '@/types/dna';
import { DNA_CATEGORIES as DNA_KEYS } from '@/types/dna';

import { DNA_CATEGORIES } from './dna-categories';

interface ComparisonChartProps {
  scoresA: ProminenceScores;
  scoresB: ProminenceScores;
  nameA: string;
  nameB: string;
}

function buildComparisonData(scoresA: ProminenceScores, scoresB: ProminenceScores) {
  return DNA_KEYS.map((key) => {
    const config = DNA_CATEGORIES.find((c) => c.key === key);
    return {
      category: config?.label ?? key,
      scoreA: scoresA[key] ?? 0,
      scoreB: scoresB[key] ?? 0,
    };
  });
}

export function ComparisonChart({ scoresA, scoresB, nameA, nameB }: ComparisonChartProps) {
  const data = buildComparisonData(scoresA, scoresB);
  const primaryColor = 'hsl(var(--primary))';
  const secondaryColor = 'hsl(var(--chart-2))';

  return (
    <div data-testid="comparison-chart" data-name-a={nameA} data-name-b={nameB}>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
          <PolarGrid />
          <PolarAngleAxis dataKey="category" />
          <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
          <Radar
            name={nameA}
            dataKey="scoreA"
            fill={primaryColor}
            fillOpacity={0.3}
            stroke={primaryColor}
          />
          <Radar
            name={nameB}
            dataKey="scoreB"
            fill={secondaryColor}
            fillOpacity={0.3}
            stroke={secondaryColor}
          />
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
