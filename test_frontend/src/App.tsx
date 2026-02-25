/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { NoiseOverlay } from './components/NoiseOverlay';
import { SearchCommandCenter } from './components/SearchCommandCenter';
import { ResultsCommandView } from './components/ResultsCommandView';
import { ContactDialog } from './components/ContactDialog';
import { Candidate } from './lib/data';

export default function App() {
  const [view, setView] = useState<'search' | 'results'>('search');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col relative overflow-hidden">
      <NoiseOverlay />
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16 relative z-10 w-full">
        <AnimatePresence mode="wait">
          {view === 'search' ? (
            <SearchCommandCenter key="search" onSearch={() => setView('results')} />
          ) : (
            <ResultsCommandView 
              key="results" 
              onBack={() => setView('search')} 
              onSelectCandidate={setSelectedCandidate}
            />
          )}
        </AnimatePresence>
      </main>

      <Footer />

      {selectedCandidate && (
        <ContactDialog 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
        />
      )}
    </div>
  );
}
