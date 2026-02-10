import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import type { DnaFieldConfig } from './dna-categories';
import { DnaFieldEditor } from './DnaFieldEditor';

interface DnaCategorySectionProps {
  categoryKey: string;
  categoryLabel: string;
  fields: DnaFieldConfig[];
  data: Record<string, unknown>;
  onFieldSave: (fieldKey: string, newValue: string | string[]) => void;
  isSaving: boolean;
}

export function DnaCategorySection({
  categoryKey,
  categoryLabel,
  fields,
  data,
  onFieldSave,
  isSaving,
}: DnaCategorySectionProps) {
  return (
    <AccordionItem value={categoryKey}>
      <AccordionTrigger>{categoryLabel}</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-2">
          {fields.map((field) => (
            <DnaFieldEditor
              key={field.key}
              fieldConfig={field}
              value={data[field.key]}
              onSave={(newValue) => onFieldSave(field.key, newValue)}
              isSaving={isSaving}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
