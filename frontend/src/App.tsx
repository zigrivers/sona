import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/sonner';
import { CloneDetailPage } from '@/pages/clones/CloneDetailPage';
import { ClonesPage } from '@/pages/clones/ClonesPage';
import { CreateClonePage } from '@/pages/clones/CreateClonePage';
import { MergePage } from '@/pages/clones/MergePage';
import { CreatePage } from '@/pages/create/CreatePage';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import { LibraryPage } from '@/pages/library/LibraryPage';
import { DataPage } from '@/pages/settings/DataPage';
import { MethodologyPage } from '@/pages/settings/MethodologyPage';
import { PresetsPage } from '@/pages/settings/PresetsPage';
import { ProvidersPage } from '@/pages/settings/ProvidersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/clones" replace />} />
            {/* Clones */}
            <Route path="/clones" element={<ClonesPage />} />
            <Route path="/clones/new" element={<CreateClonePage />} />
            <Route path="/clones/:id" element={<CloneDetailPage />} />
            <Route path="/clones/compare" element={<ClonesPage />} />
            <Route path="/clones/merge" element={<MergePage />} />
            {/* Content Generator */}
            <Route path="/create" element={<CreatePage />} />
            <Route path="/create/:id" element={<CreatePage />} />
            {/* Content Library */}
            <Route path="/library" element={<LibraryPage />} />
            {/* Settings */}
            <Route path="/settings/providers" element={<ProvidersPage />} />
            <Route path="/settings/methodology" element={<MethodologyPage />} />
            <Route path="/settings/presets" element={<PresetsPage />} />
            <Route path="/settings/data" element={<DataPage />} />
          </Route>
          {/* Dev tools — outside main layout */}
          <Route path="/design-system" element={<DesignSystemPage />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
