import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import type { GenerationProperties } from '@/stores/generator-store';

const PLATFORMS = [
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'blog', label: 'Blog Post' },
  { value: 'generic', label: 'Generic' },
] as const;

const LENGTHS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
] as const;

interface PropertiesFormProps {
  value: GenerationProperties;
  onChange: (properties: GenerationProperties) => void;
}

export function PropertiesForm({ value, onChange }: PropertiesFormProps) {
  function update(patch: Partial<GenerationProperties>) {
    onChange({ ...value, ...patch });
  }

  function togglePlatform(platform: string) {
    const platforms = value.platforms.includes(platform)
      ? value.platforms.filter((p) => p !== platform)
      : [...value.platforms, platform];
    update({ platforms });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platforms */}
        <div className="space-y-3">
          <Label>Platforms</Label>
          <div className="flex flex-wrap gap-4">
            {PLATFORMS.map((p) => (
              <label key={p.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={value.platforms.includes(p.value)}
                  onCheckedChange={() => togglePlatform(p.value)}
                  aria-label={p.label}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {/* Length */}
        <div className="space-y-3">
          <Label>Length</Label>
          <RadioGroup
            value={value.length}
            onValueChange={(v) => update({ length: v as GenerationProperties['length'] })}
            className="flex gap-4"
          >
            {LENGTHS.map((l) => (
              <label key={l.value} className="flex items-center gap-2 text-sm">
                <RadioGroupItem value={l.value} aria-label={l.label} />
                {l.label}
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <SliderField label="Tone" value={value.tone} onChange={(tone) => update({ tone })} />
          <SliderField label="Humor" value={value.humor} onChange={(humor) => update({ humor })} />
          <SliderField
            label="Formality"
            value={value.formality}
            onChange={(formality) => update({ formality })}
          />
        </div>

        {/* Text inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-audience">Target Audience</Label>
            <Input
              id="target-audience"
              placeholder="e.g. developers, marketers"
              value={value.targetAudience}
              onChange={(e) => update({ targetAudience: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta-style">CTA Style</Label>
            <Input
              id="cta-style"
              placeholder="e.g. subtle, direct"
              value={value.ctaStyle}
              onChange={(e) => update({ ctaStyle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="include-phrases">Include Phrases</Label>
            <Input
              id="include-phrases"
              placeholder="Phrases to include"
              value={value.includePhrases}
              onChange={(e) => update({ includePhrases: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exclude-phrases">Exclude Phrases</Label>
            <Input
              id="exclude-phrases"
              placeholder="Phrases to exclude"
              value={value.excludePhrases}
              onChange={(e) => update({ excludePhrases: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-muted-foreground text-sm">
          {value === 50 ? 'Inherit from DNA' : value}
        </span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={100}
        step={1}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
      />
    </div>
  );
}
