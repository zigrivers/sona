import { useState } from 'react';

import { MethodologyEditor } from '@/components/settings/MethodologyEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SECTIONS = [
  { key: 'voice_cloning', label: 'Voice Cloning' },
  { key: 'authenticity', label: 'Authenticity Guidelines' },
  { key: 'platform_practices', label: 'Platform Best Practices' },
] as const;

export function MethodologyPage() {
  const [activeTab, setActiveTab] = useState('voice_cloning');

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Methodology</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((s) => (
          <TabsContent key={s.key} value={s.key}>
            <MethodologyEditor sectionKey={s.key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
