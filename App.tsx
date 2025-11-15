
import React, { useState } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import MainContent from './components/MainContent';
import Contacts from './components/Contacts';
import { ViewType } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('default');

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <Header />
      <Navbar setActiveView={setActiveView} />
      <main className="px-4 py-8 md:px-8">
        <MainContent activeView={activeView} setActiveView={setActiveView} />
      </main>
      <Contacts />
    </div>
  );
};

export default App;
