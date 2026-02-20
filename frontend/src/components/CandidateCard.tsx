import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { CandidateResult } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type { CandidateResult as Candidate };

interface CandidateCardProps {
  candidate: CandidateResult;
  index: number;
}

function scoreColor(score: number) {
  if (score >= 70) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
}

export function CandidateCard({ candidate, index }: CandidateCardProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const hasContact = candidate.email || candidate.phone;

  return (
    <>
      <Card
        className="border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in bg-card"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <button
                    onClick={() => setOpen(true)}
                    className="font-semibold text-foreground truncate hover:text-primary hover:underline transition-colors text-left"
                  >
                    {candidate.name}
                  </button>
                  {candidate.role && (
                    <p className="text-xs text-muted-foreground truncate">
                      {candidate.role}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 font-bold ${scoreColor(candidate.score)}`}
                >
                  {candidate.score}/100
                </Badge>
              </div>

              {/* Rationale */}
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {candidate.rationale}
              </p>

              {/* Evidence */}
              {candidate.evidence.length > 0 && (
                <div className="space-y-1.5">
                  {candidate.evidence.slice(0, 2).map((quote, i) => (
                    <blockquote
                      key={i}
                      className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-2 italic"
                    >
                      {quote}
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{candidate.name}</p>
                {candidate.role && (
                  <p className="text-sm font-normal text-muted-foreground">
                    {candidate.role}
                  </p>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            {hasContact ? (
              <>
                {candidate.email && (
                  <a
                    href={`mailto:${candidate.email}`}
                    className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{candidate.email}</span>
                  </a>
                )}
                {candidate.phone && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(candidate.phone!);
                      toast({ description: "Phone number copied to clipboard." });
                    }}
                    className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-muted transition-colors w-full text-left"
                    title="Click to copy"
                  >
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span>{candidate.phone}</span>
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contact information available.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
