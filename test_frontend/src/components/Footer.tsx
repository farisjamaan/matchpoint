export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0D] border-t border-[rgba(255,255,255,0.04)] h-12 flex items-center justify-between px-6 overflow-hidden">
      <div className="font-mono text-[11px] text-[#A3A3A3]">
        © EY Internal. Confidential.
      </div>
      <div className="font-mono text-[11px] text-[#FFE600]/40">
        MATCHPOINT v1.0
      </div>
      
      {/* Decorative Text */}
      <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 font-black text-[120px] text-white opacity-[0.03] pointer-events-none select-none whitespace-nowrap tracking-tighter">
        MATCHPOINT
      </div>
    </footer>
  );
}
