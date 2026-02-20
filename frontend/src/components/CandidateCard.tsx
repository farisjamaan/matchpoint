import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { CandidateResult, getCandidateResume } from "@/lib/api";
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHighlightedHTML(
  name: string,
  role: string | null | undefined,
  content: string,
  evidence: string[]
): string {
  let body = escapeHtml(content);

  for (const phrase of evidence) {
    const trimmed = phrase.trim();
    if (!trimmed) continue;
    const pattern = new RegExp(escapeRegex(escapeHtml(trimmed)), "gi");
    body = body.replace(
      pattern,
      (m) => `<mark>${m}</mark>`
    );
  }

  body = body.replace(/\n/g, "<br>\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)} – Resume</title>
  <style>
    body { font-family: Georgia, serif; max-width: 820px; margin: 48px auto; padding: 0 24px; line-height: 1.7; color: #1a1a1a; }
    h1 { font-size: 1.75rem; color: #111; margin-bottom: 4px; }
    .role { color: #6b7280; font-size: 1rem; margin-top: 0; margin-bottom: 24px; }
    .legend { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 16px; margin-bottom: 28px; font-size: 0.85rem; color: #374151; }
    mark { background: #fef08a; padding: 1px 0; border-radius: 2px; }
    .content { font-size: 0.95rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(name)}</h1>
  ${role ? `<p class="role">${escapeHtml(role)}</p>` : ""}
  <div class="legend">
    <mark>Highlighted</mark> sections are evidence excerpts matching the search query.
  </div>
  <div class="content">${body}</div>
</body>
</html>`;
}

export function CandidateCard({ candidate, index }: CandidateCardProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const hasContact = candidate.email || candidate.phone;

  const downloadResume = async () => {
    setDownloading(true);
    try {
      const { content } = await getCandidateResume(candidate.name);
      const html = buildHighlightedHTML(
        candidate.name,
        candidate.role,
        content,
        candidate.evidence
      );
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${candidate.name.replace(/\s+/g, "_")}_resume.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ description: "Failed to download resume.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

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

            <div className="border-t pt-3">
              <button
                onClick={downloadResume}
                disabled={downloading}
                className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-muted transition-colors w-full text-left font-medium text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>{downloading ? "Downloading…" : "Download Resume"}</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
