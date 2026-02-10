import { DollarSign } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CostEstimateProps {
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  className?: string;
}

function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return '<$0.01 estimated';
  }
  return `$${costUsd.toFixed(2)} estimated`;
}

export function CostEstimate({ costUsd, inputTokens, outputTokens, className }: CostEstimateProps) {
  const tooltipText = [
    `${inputTokens.toLocaleString()} input tokens · ${outputTokens.toLocaleString()} output tokens`,
    'Estimates are approximate and may differ from actual provider billing',
  ].join('\n');

  return (
    <span
      className={cn('text-muted-foreground inline-flex items-center gap-1 text-xs', className)}
      title={tooltipText}
    >
      <DollarSign className="size-3" />
      {formatCost(costUsd)}
    </span>
  );
}
