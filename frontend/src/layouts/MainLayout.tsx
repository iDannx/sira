import React from 'react';
import { Sidebar, Header } from '../components/Navigation';
import { AuraAssistant } from '../components/AuraAssistant';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex bg-[#f8f9fd] min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen relative">
        <Header />
        <main className="p-8 pt-28 max-w-[1600px] mx-auto">
          {children}
        </main>
        <AuraAssistant />
      </div>
    </div>
  );
}
