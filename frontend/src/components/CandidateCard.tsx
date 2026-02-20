import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { CandidateResult } from "@/lib/api";

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
  return (
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
              <h3 className="font-semibold text-foreground truncate">
                {candidate.name}
              </h3>
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
  );
}
