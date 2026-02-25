import { useState } from "react";
import { MultiSelect, Option } from "@/components/MultiSelect";
import { CandidateCard } from "@/components/CandidateCard";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, X } from "lucide-react";
import { searchCandidates, CandidateResult } from "@/lib/api";

const roleOptions: Option[] = [
  { value: "Consultant I", label: "Consultant I" },
  { value: "Consultant II", label: "Consultant II" },
  { value: "Senior Consultant", label: "Senior Consultant" },
  { value: "Assistant Manager", label: "Assistant Manager" },
  { value: "Manager", label: "Manager" },
  { value: "Senior Manager", label: "Senior Manager" },
  { value: "Director", label: "Director" },
  { value: "Senior Director", label: "Senior Director" },
  { value: "Partner", label: "Partner" },
];

const skillOptions: Option[] = [
  { value: "React", label: "React" },
  { value: "TypeScript", label: "TypeScript" },
  { value: "JavaScript", label: "JavaScript" },
  { value: "Python", label: "Python" },
  { value: "Java", label: "Java" },
  { value: "C#", label: "C#" },
  { value: "SQL", label: "SQL" },
  { value: "AWS", label: "AWS" },
  { value: "Azure", label: "Azure" },
  { value: "Google Cloud", label: "Google Cloud" },
  { value: "Docker", label: "Docker" },
  { value: "Kubernetes", label: "Kubernetes" },
  { value: "Agile/Scrum", label: "Agile/Scrum" },
  { value: "Project Management", label: "Project Management" },
  { value: "Data Analysis", label: "Data Analysis" },
  { value: "Machine Learning", label: "Machine Learning" },
  { value: "UI/UX Design", label: "UI/UX Design" },
  { value: "DevOps", label: "DevOps" },
  { value: "Cybersecurity", label: "Cybersecurity" },
  { value: "Financial Modeling", label: "Financial Modeling" },
  { value: "Tax Advisory", label: "Tax Advisory" },
  { value: "Audit", label: "Audit" },
  { value: "Consulting", label: "Consulting" },
  { value: "Communication", label: "Communication" },
  { value: "Leadership", label: "Leadership" },
];

const Index = () => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleDescription, setRoleDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSkills.length === 0 && roleDescription.trim().length < 10) {
      toast({
        title: "More input needed",
        description:
          "Select at least one skill or enter a role description (10+ characters).",
        variant: "destructive",
      });
      return;
    }

    const query =
      roleDescription.trim().length >= 10
        ? roleDescription.trim()
        : `Looking for a consultant with the following skills: ${selectedSkills.join(", ")}`;

    setIsSubmitting(true);

    try {
      const response = await searchCandidates(
        query,
        selectedSkills,
        selectedRoles.length > 0 ? selectedRoles : undefined
      );
      setResults(response.results);
      setShowResults(true);
      toast({
        title: `Found ${response.results.length} matching candidate${response.results.length !== 1 ? "s" : ""}`,
        description: "Review the results below.",
      });
    } catch (err) {
      toast({
        title: "Search failed",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewSearch = () => {
    setShowResults(false);
    setResults([]);
    setSelectedSkills([]);
    setSelectedRoles([]);
    setRoleDescription("");
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Header */}
      <header className="bg-[#0D0D0D] border-t-2 border-t-[#FFE600] border-b border-b-[rgba(255,255,255,0.06)]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-[3px]">
                <div className="h-[6px] w-8 bg-[#FFE600]" />
                <div className="h-[6px] w-6 bg-[#FFE600]" />
                <div className="h-[6px] w-4 bg-[#FFE600]" />
              </div>
              <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                EY
              </span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              Match Point
            </h1>
          </div>
          <p className="text-white/60 max-w-xl text-sm font-mono">
            Evidence Based Matching System.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 md:py-16 flex-1">
        {!showResults ? (
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl mx-auto bg-[#141414] border border-[rgba(255,230,0,0.08)] rounded-2xl ey-shadow-panel p-6 animate-fade-in"
          >
            {/* Panel header */}
            <div className="mb-8">
              <h2 className="font-mono text-[11px] text-[#FFE600]/60 tracking-widest uppercase">
                Talent Search
              </h2>
            </div>

            <div className="space-y-6">
              {/* Required Skills */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] text-[#A3A3A3] uppercase tracking-widest">
                  Required Skills
                </label>
                <MultiSelect
                  options={skillOptions}
                  selected={selectedSkills}
                  onChange={setSelectedSkills}
                  placeholder="Search and select skills..."
                />
                <p className="text-xs text-[#A3A3A3]/60">
                  Select one or more skills to find matching candidates.
                </p>
              </div>

              {/* Target Level */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] text-[#A3A3A3] uppercase tracking-widest">
                  Target Level
                </label>
                <MultiSelect
                  options={roleOptions}
                  selected={selectedRoles}
                  onChange={setSelectedRoles}
                  placeholder="Search and select levels..."
                />
                <p className="text-xs text-[#A3A3A3]/60">
                  Optional: Filter candidates by seniority level.
                </p>
              </div>

              {/* Mission Brief */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] text-[#A3A3A3] uppercase tracking-widest">
                  Mission Brief
                </label>
                <Textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Describe the engagement, required competencies, and project context..."
                  className="min-h-[160px] resize-y transition-colors hover:border-primary focus:border-primary"
                />
                <p className="text-xs text-[#A3A3A3]/60">
                  Optional: Provide additional context about the role or project.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[52px] bg-[#FFE600] text-[#0D0D0D] font-semibold text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-[#FFD000] hover:scale-[1.01] ey-shadow-btn-hover transition-all ey-sheen disabled:opacity-80 disabled:hover:scale-100 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {isSubmitting ? (
                  <>
                    <span className="text-sm relative z-10">
                      Searching...
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shimmer" />
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Find Talent</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Matching Candidates
                </h2>
                <p className="text-sm text-[#A3A3A3] mt-1">
                  Found {results.length} candidate
                  {results.length !== 1 ? "s" : ""} matching your criteria
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleNewSearch}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                New Search
              </Button>
            </div>

            {/* Results Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((candidate, index) => (
                <CandidateCard
                  key={`${candidate.name}-${index}`}
                  candidate={candidate}
                  index={index}
                />
              ))}
            </div>

            {results.length > 0 && (
              <div className="mt-8 p-4 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.06)]">
                <p className="text-sm text-[#A3A3A3] text-center">
                  Candidates are ranked by AI fit score. Higher scores indicate
                  a stronger match for your requirements.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] mt-auto">
        <div className="container mx-auto px-6 py-6">
          <p className="text-xs text-[#A3A3A3] text-center font-mono">
            Internal use only. For support, contact innovation lab team.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
