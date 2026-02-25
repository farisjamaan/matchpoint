import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const SKILLS = ['React', 'Python', 'AWS', 'Cyber Security', 'Machine Learning', 'Agile'];
const LEVELS = [
  { label: 'Consultant I', bar: 8 },
  { label: 'Consultant II', bar: 12 },
  { label: 'Senior Consultant', bar: 16 },
  { label: 'Manager', bar: 20 },
  { label: 'Senior Manager', bar: 24 },
  { label: 'Director / Partner', bar: 28 },
];

export function SearchCommandCenter({ onSearch, key }: { onSearch: () => void, key?: string }) {
  const [sessionId, setSessionId] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['AWS', 'Python']);
  const [isSearching, setIsSearching] = useState(false);
  const [level, setLevel] = useState('Manager');

  useEffect(() => {
    setSessionId(`0x${Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0')}`);
  }, []);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      onSearch();
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto bg-[#141414] border border-[rgba(255,230,0,0.08)] rounded-2xl ey-shadow-panel p-6 relative z-10"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="font-mono text-[11px] text-[#FFE600]/60 tracking-widest uppercase">Talent Search</h2>
        <span className="font-mono text-[10px] text-[#A3A3A3]/50">SESSION_ID: {sessionId}</span>
      </div>

      <div className="space-y-6">
        {/* Skills */}
        <div className="space-y-2">
          <label className="block font-mono text-[10px] text-[#A3A3A3] uppercase tracking-widest">Required Skills</label>
          <div className="flex flex-wrap gap-2 p-3 bg-[#1C1C1C] border border-[rgba(255,255,255,0.08)] rounded-lg min-h-[52px]">
            {selectedSkills.map(skill => (
              <span key={skill} className="inline-flex items-center gap-1 px-2 py-1 bg-[#1C1C1C] border border-[rgba(255,230,0,0.3)] text-[#FFE600] text-xs font-mono rounded">
                {skill}
                <button 
                  onClick={() => setSelectedSkills(s => s.filter(x => x !== skill))}
                  className="hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <select 
              className="bg-transparent text-sm text-[#A3A3A3] outline-none flex-1 min-w-[100px]"
              onChange={(e) => {
                if (e.target.value && !selectedSkills.includes(e.target.value)) {
                  setSelectedSkills([...selectedSkills, e.target.value]);
                }
                e.target.value = "";
              }}
            >
              <option value="">Add skill...</option>
              {SKILLS.filter(s => !selectedSkills.includes(s)).map(s => (
                <option key={s} value={s} className="bg-[#1C1C1C] text-white">{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Level */}
        <div className="space-y-2">
          <label className="block font-mono text-[10px] text-[#A3A3A3] uppercase tracking-widest">Target Level</label>
          <div className="relative">
            <select 
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full p-3 bg-[#1C1C1C] border border-[rgba(255,255,255,0.08)] rounded-lg text-white appearance-none outline-none focus:ey-glow-focus transition-shadow"
            >
              {LEVELS.map(l => (
                <option key={l.label} value={l.label} className="bg-[#1C1C1C]">
                  {l.label}
                </option>
              ))}
            </select>
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FFE600] rounded-l-lg pointer-events-none" 
                 style={{ height: `${LEVELS.find(l => l.label === level)?.bar || 8}px`, top: '50%', transform: 'translateY(-50%)', left: '1px' }} />
          </div>
        </div>

        {/* Mission Brief */}
        <div className="space-y-2">
          <label className="block font-mono text-[10px] text-[#A3A3A3] uppercase tracking-widest">Mission Brief</label>
          <textarea 
            className="w-full p-3 bg-[#1C1C1C] border border-[rgba(255,255,255,0.08)] rounded-lg text-white placeholder:text-[#A3A3A3]/50 min-h-[140px] outline-none focus:ey-glow-focus transition-shadow resize-none"
            placeholder="Describe the engagement, required competencies, and project context..."
          />
        </div>

        {/* Submit */}
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="w-full h-[52px] bg-[#FFE600] text-[#0D0D0D] font-black tracking-wide rounded-lg flex items-center justify-center gap-2 hover:bg-[#FFD000] hover:scale-[1.01] ey-shadow-btn-hover transition-all ey-sheen disabled:opacity-80 disabled:hover:scale-100 disabled:cursor-not-allowed relative overflow-hidden"
        >
          {isSearching ? (
            <>
              <span className="font-mono text-sm z-10">SCANNING DATABASE...</span>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </>
          ) : (
            <>
              <Search className="w-4 h-4 z-10" />
              <span className="z-10">INITIATE SEARCH</span>
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 flex justify-center gap-6">
        {[
          "10 Candidates Indexed",
          "AI Scoring Active",
          "Evidence Retrieved"
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-[#FFE600]" />
            <span className="font-mono text-[11px] text-[#A3A3A3]">{stat}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
