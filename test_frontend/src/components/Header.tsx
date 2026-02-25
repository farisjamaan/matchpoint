import { Moon } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0D0D0D] border-b border-[rgba(255,230,0,0.15)] flex items-center justify-between px-6">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#FFE600]" />
      
      <div className="flex items-center gap-4">
        {/* EY Logo Mark */}
        <div className="flex flex-col gap-[3px] items-end">
          <div className="h-[6px] w-[32px] bg-[#FFE600]" />
          <div className="h-[6px] w-[24px] bg-[#FFE600]" />
          <div className="h-[6px] w-[16px] bg-[#FFE600]" />
        </div>
        <span className="font-black text-white text-xl tracking-tighter">EY</span>
        
        <div className="h-[32px] w-[1px] bg-[rgba(255,255,255,0.15)] mx-2" />
        
        <span className="font-semibold text-white tracking-tight text-lg">Match Point</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFE600] animate-pulse" />
          <span className="font-mono text-[10px] text-[#FFE600]/70 tracking-widest">SYSTEM ACTIVE</span>
        </div>
        
        <button className="text-[#A3A3A3] hover:text-white transition-colors">
          <Moon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
