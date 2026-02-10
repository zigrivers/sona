import { cn } from '@/lib/utils';
import type { DetectionResponse } from '@/types/api';

interface AiDetectionPreviewProps {
  result: DetectionResponse;
}

function getRiskColor(level: string) {
  if (level === 'low') return { bg: 'bg-green-100', text: 'text-green-800' };
  if (level === 'medium') return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
  return { bg: 'bg-red-100', text: 'text-red-800' };
}

export function AiDetectionPreview({ result }: AiDetectionPreviewProps) {
  const color = getRiskColor(result.risk_level);

  return (
    <div className="space-y-3">
      {/* Risk level + confidence */}
      <div className="flex items-center gap-2">
        <span
          data-slot="badge"
          className={cn(
            'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold capitalize',
            color.bg,
            color.text
          )}
        >
          {result.risk_level}
        </span>
        <span className="text-muted-foreground text-sm">{result.confidence}% confidence</span>
      </div>

      {/* Summary */}
      <p className="text-sm">{result.summary}</p>

      {/* Flagged passages */}
      {result.flagged_passages.length > 0 ? (
        <ul className="space-y-3">
          {result.flagged_passages.map((passage, i) => (
            <li key={i} className="border-l-2 border-yellow-400 pl-3 text-sm">
              <p className="font-medium">{passage.text}</p>
              <p className="text-muted-foreground">{passage.reason}</p>
              <p className="text-primary text-xs">{passage.suggestion}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">No flagged passages found.</p>
      )}

      {/* Disclaimer */}
      <p className="text-muted-foreground text-xs italic">
        AI detection is probabilistic and may produce false positives. Use as one input among many.
      </p>
    </div>
  );
}
