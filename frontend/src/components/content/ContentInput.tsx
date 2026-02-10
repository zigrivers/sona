import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ContentInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContentInput({ value, onChange }: ContentInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="content-input">What do you want to say?</Label>
      <Textarea
        id="content-input"
        placeholder="Describe the content you want to generate..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
      />
    </div>
  );
}
