import { cn } from '@/lib/utils';

interface AuthenticityScoreProps {
  overallScore: number;
}

function getScoreColor(score: number) {
  if (score >= 75) return { bg: 'bg-green-100', text: 'text-green-800' };
  if (score >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
  return { bg: 'bg-red-100', text: 'text-red-800' };
}

export function AuthenticityScore({ overallScore }: AuthenticityScoreProps) {
  const color = getScoreColor(overallScore);

  return (
    <div className="flex items-center gap-2">
      <span
        data-slot="badge"
        className={cn(
          'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold',
          color.bg,
          color.text
        )}
      >
        {overallScore}
      </span>
      <span className="text-muted-foreground text-sm">Authenticity</span>
    </div>
  );
}
