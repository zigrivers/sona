import { Check, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { VariantItem } from '@/types/api';

const TEMPERATURE_LABELS: Record<number, string> = {
  0.5: 'Conservative',
  0.7: 'Balanced',
  0.9: 'Creative',
};

interface VariantComparisonProps {
  variants: VariantItem[];
  onSelect: (variant: VariantItem) => void;
  onDismiss: () => void;
}

export function VariantComparison({ variants, onSelect, onDismiss }: VariantComparisonProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Compare Variants</h2>
        <Badge variant="secondary">3x generation cost</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {variants.map((variant) => {
          const label = TEMPERATURE_LABELS[variant.temperature] ?? `Temp ${variant.temperature}`;
          const isSelected = selectedIndex === variant.variant_index;

          return (
            <Card
              key={variant.variant_index}
              className={cn(
                'cursor-pointer transition-shadow',
                isSelected && 'ring-primary ring-2'
              )}
              onClick={() => setSelectedIndex(variant.variant_index)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <span className="text-muted-foreground text-xs">{variant.word_count} words</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {variant.content_text}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDismiss}>
          <X className="size-4" />
          Dismiss All
        </Button>
        <Button
          disabled={selectedIndex === null}
          onClick={() => {
            if (selectedIndex !== null) {
              const variant = variants.find((v) => v.variant_index === selectedIndex);
              if (variant) onSelect(variant);
            }
          }}
        >
          <Check className="size-4" />
          Use Selected Variant
        </Button>
      </div>
    </div>
  );
}
