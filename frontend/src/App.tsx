import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import { DesignSystemPage } from '@/pages/DesignSystemPage';

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Sona</h1>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Dev tools */}
        <Route path="/design-system" element={<DesignSystemPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
