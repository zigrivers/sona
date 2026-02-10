import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProminenceScores } from '@/types/dna';
import { DNA_CATEGORIES as DNA_KEYS } from '@/types/dna';

import { DNA_CATEGORIES } from './dna-categories';

interface DimensionTableProps {
  scoresA: ProminenceScores;
  scoresB: ProminenceScores;
  nameA: string;
  nameB: string;
}

export function getDifferenceLabel(
  a: number | undefined,
  b: number | undefined
): 'Similar' | 'Different' | 'Very Different' {
  const delta = Math.abs(((a ?? 0) - (b ?? 0)) * 100);
  if (delta >= 40) return 'Very Different';
  if (delta >= 15) return 'Different';
  return 'Similar';
}

function formatScore(score: number | undefined): string {
  if (score === undefined) return '\u2014';
  return `${Math.round(score * 100)}%`;
}

function badgeVariant(label: ReturnType<typeof getDifferenceLabel>) {
  if (label === 'Very Different') return 'destructive' as const;
  if (label === 'Different') return 'outline' as const;
  return 'secondary' as const;
}

export function DimensionTable({ scoresA, scoresB, nameA, nameB }: DimensionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dimension</TableHead>
          <TableHead>{nameA}</TableHead>
          <TableHead>{nameB}</TableHead>
          <TableHead>Difference</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {DNA_KEYS.map((key) => {
          const config = DNA_CATEGORIES.find((c) => c.key === key);
          const label = config?.label ?? key;
          const a = scoresA[key];
          const b = scoresB[key];
          const diff = getDifferenceLabel(a, b);
          return (
            <TableRow key={key}>
              <TableCell className="font-medium">{label}</TableCell>
              <TableCell>{formatScore(a)}</TableCell>
              <TableCell>{formatScore(b)}</TableCell>
              <TableCell>
                <Badge variant={badgeVariant(diff)}>{diff}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
