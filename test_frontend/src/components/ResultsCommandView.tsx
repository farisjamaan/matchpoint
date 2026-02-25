import { motion } from 'motion/react';
import { User, Mail, Phone, ArrowRight, Search } from 'lucide-react';
import { Candidate, MOCK_CANDIDATES } from '../lib/data';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

export function ResultsCommandView({ onBack, onSelectCandidate, key }: { onBack: () => void, onSelectCandidate: (c: Candidate) => void, key?: string }) {
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-5xl mx-auto pb-24 relative z-10"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-mono text-[12px] text-[#FFE600]/60 tracking-widest uppercase mb-1">Matched Candidates</h2>
          <p className="font-sans text-[14px] text-[#A3A3A3]">{MOCK_CANDIDATES.length} candidates ranked by AI fit score</p>
        </div>
        <button 
          onClick={onBack}
          className="px-3 py-1.5 border border-[rgba(255,255,255,0.15)] rounded text-[#A3A3A3] font-mono text-[11px] hover:text-white hover:border-[rgba(255,255,255,0.3)] transition-colors uppercase tracking-wider"
        >
          ← New Search
        </button>
      </div>
      
      <div className="h-[1px] w-full bg-[#FFE600] opacity-10 mb-6" />

      {/* Grid */}
      {MOCK_CANDIDATES.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl">
          <Search className="w-12 h-12 text-[#FFE600] mb-4 opacity-50" />
          <h3 className="font-mono text-lg text-white mb-2">NO MATCHES FOUND</h3>
          <p className="text-[#A3A3A3] text-sm">Try broadening your search criteria or adjusting the required skills.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} delay={i * 0.1} />
            ))
          ) : (
            MOCK_CANDIDATES.map((candidate, i) => (
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate} 
                delay={i * 0.1} 
                onClick={() => onSelectCandidate(candidate)}
              />
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}

function SkeletonCard({ delay, key }: { delay: number, key?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 h-[280px] relative overflow-hidden"
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.03)] to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
      <div className="flex gap-4 items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-[#1C1C1C]" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-[#1C1C1C] rounded w-1/2" />
          <div className="h-3 bg-[#1C1C1C] rounded w-1/3" />
        </div>
        <div className="w-10 h-10 bg-[#1C1C1C] rounded" />
      </div>
      <div className="h-1 w-full bg-[#1C1C1C] mb-4 rounded-full" />
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-[#1C1C1C] rounded w-full" />
        <div className="h-3 bg-[#1C1C1C] rounded w-4/5" />
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-[#1C1C1C] rounded w-full" />
        <div className="h-8 bg-[#1C1C1C] rounded w-full" />
      </div>
    </motion.div>
  );
}

function CandidateCard({ candidate, delay, onClick, key }: { candidate: Candidate, delay: number, onClick: () => void, key?: string }) {
  const isHigh = candidate.score >= 70;
  const isMed = candidate.score >= 50 && candidate.score < 70;
  const isLow = candidate.score < 50;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[rgba(255,230,0,0.25)] ey-shadow-card-hover transition-all duration-300 flex flex-col"
    >
      <div className="p-5 flex-1">
        {/* Top Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1C1C1C] border border-[rgba(255,230,0,0.2)] flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-[#FFE600]" />
            </div>
            <div>
              <button onClick={onClick} className="font-semibold text-white hover:text-[#FFE600] transition-colors text-left">
                {candidate.name}
              </button>
              <div className="font-mono text-[11px] text-[#A3A3A3]">{candidate.role}</div>
            </div>
          </div>
          <div className={cn(
            "w-10 h-10 rounded flex items-center justify-center font-mono font-black text-sm shrink-0",
            isHigh && "bg-[#FFE600] text-[#0D0D0D]",
            isMed && "border border-[#FFE600] text-[#FFE600] bg-transparent",
            isLow && "border border-red-500/40 text-red-400 bg-transparent"
          )}>
            {candidate.score}
          </div>
        </div>

        {/* Score Bar */}
        <div className="h-1 w-full bg-[rgba(255,255,255,0.05)] rounded-full mb-4 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${candidate.score}%` }}
            transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              isHigh ? "bg-[#FFE600]" : isMed ? "bg-[#FFE600]/60" : "bg-red-500/60"
            )}
          />
        </div>

        {/* Rationale */}
        <p className="font-sans text-[13px] text-[#A3A3A3] line-clamp-2 mb-4">
          {candidate.rationale}
        </p>

        {/* Evidence */}
        <div className="space-y-2">
          <h4 className="font-mono text-[10px] text-[#FFE600]/50 tracking-widest uppercase">Key Evidence</h4>
          {candidate.evidence.slice(0, 2).map((ev, i) => (
            <blockquote key={i} className="border-l-2 border-[#FFE600]/30 bg-[#1C1C1C] rounded-r-md px-3 py-1.5 font-mono italic text-[12px] text-[#A3A3A3]">
              {ev}
            </blockquote>
          ))}
          {candidate.evidence.length > 2 && (
            <div className="inline-block px-2 py-0.5 bg-[#1C1C1C] rounded text-[10px] font-mono text-[#A3A3A3]">
              +{candidate.evidence.length - 2} more
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[rgba(255,255,255,0.04)] p-4 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer" title={candidate.email}>
            <Mail className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] truncate max-w-[100px]">{candidate.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer" title={candidate.phone}>
            <Phone className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">{candidate.phone}</span>
          </div>
        </div>
        <button 
          onClick={onClick}
          className="font-mono text-[11px] text-[#FFE600]/70 hover:text-[#FFE600] flex items-center gap-1 group"
        >
          <span className="group-hover:underline underline-offset-4">VIEW PROFILE</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
