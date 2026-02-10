import {
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

interface DnaRadarProps {
  scores: ProminenceScores | null;
  thumbnail?: boolean;
}

export function buildChartData(scores: ProminenceScores) {
  return DNA_KEYS.map((key) => {
    const config = DNA_CATEGORIES.find((c) => c.key === key);
    return {
      category: config?.label ?? key,
      score: scores[key] ?? 0,
    };
  });
}

export function DnaRadar({ scores, thumbnail = false }: DnaRadarProps) {
  if (!scores) {
    return <p className="text-muted-foreground text-center">No scores available</p>;
  }

  const data = buildChartData(scores);
  const primaryColor = 'hsl(var(--primary))';

  if (thumbnail) {
    return (
      <RadarChart width={120} height={120} data={data} cx="50%" cy="50%" outerRadius="80%">
        <PolarGrid />
        <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
        <Radar dataKey="score" fill={primaryColor} fillOpacity={0.5} stroke={primaryColor} />
      </RadarChart>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
        <PolarGrid />
        <PolarAngleAxis dataKey="category" />
        <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
        <Radar dataKey="score" fill={primaryColor} fillOpacity={0.5} stroke={primaryColor} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
