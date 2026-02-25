import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, Download, X, Check } from 'lucide-react';
import { Candidate } from '../lib/data';
import { useState } from 'react';

export function ContactDialog({ candidate, onClose }: { candidate: Candidate | null, onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!candidate) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(candidate.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-[#141414] border border-[rgba(255,230,0,0.12)] rounded-2xl shadow-2xl overflow-hidden"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-[#A3A3A3] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-[#1C1C1C] border border-[rgba(255,230,0,0.2)] flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-[#FFE600]" />
              </div>
              <h3 className="font-semibold text-white text-lg">{candidate.name}</h3>
              <p className="font-mono text-[12px] text-[#A3A3A3] mt-1">{candidate.role}</p>
              <div className="mt-3 inline-flex items-center justify-center px-2 py-1 bg-[#FFE600]/10 border border-[#FFE600]/30 rounded text-[#FFE600] font-mono text-[11px]">
                FIT SCORE: {candidate.score}
              </div>
            </div>

            {/* Contact Rows */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 p-3 bg-[#1C1C1C] rounded-lg border border-[rgba(255,255,255,0.04)]">
                <Mail className="w-4 h-4 text-[#FFE600]" />
                <span className="font-mono text-[12px] text-white">{candidate.email}</span>
              </div>
              <button 
                onClick={handleCopyPhone}
                className="w-full flex items-center gap-3 p-3 bg-[#1C1C1C] rounded-lg border border-[rgba(255,255,255,0.04)] hover:border-[#FFE600]/30 transition-colors group"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Phone className="w-4 h-4 text-[#FFE600]" />}
                <span className="font-mono text-[12px] text-white group-hover:text-[#FFE600] transition-colors">
                  {copied ? "COPIED!" : candidate.phone}
                </span>
              </button>
            </div>

            {/* Download */}
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="w-full h-11 border border-[#FFE600]/30 text-[#FFE600] rounded-lg flex items-center justify-center gap-2 hover:bg-[#FFE600]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#FFE600]/30 border-t-[#FFE600] rounded-full animate-spin" />
                  <span className="font-mono text-[12px]">GENERATING DOCUMENT...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="font-mono text-[12px]">DOWNLOAD ANNOTATED RESUME</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
