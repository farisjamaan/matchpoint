import { useState } from "react";
import { MultiSelect, Option } from "@/components/MultiSelect";
import { CandidateCard } from "@/components/CandidateCard";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, X } from "lucide-react";
import { searchCandidates, CandidateResult } from "@/lib/api";

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

    // Build query: use roleDescription if long enough, otherwise derive from skills
    const query =
      roleDescription.trim().length >= 10
        ? roleDescription.trim()
        : `Looking for a consultant with the following skills: ${selectedSkills.join(", ")}`;

    setIsSubmitting(true);

    try {
      const response = await searchCandidates(query, selectedSkills);
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
    setRoleDescription("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* EY-Style Header Section */}
      <header className="bg-black">
        {/* Yellow accent bar */}
        <div className="h-2 bg-primary" />
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-4 mb-3">
            {/* EY-style logo mark */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-[3px]">
                <div className="h-[6px] w-8 bg-primary" />
                <div className="h-[6px] w-6 bg-primary" />
                <div className="h-[6px] w-4 bg-primary" />
              </div>
              <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                EY
              </span>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Match Point
            </h1>
          </div>
          <p className="text-white/60 max-w-xl text-sm">
            Evidence-driven internal talent matching system.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 md:py-16 flex-1">
        {!showResults ? (
          <form
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto space-y-8 animate-fade-in"
          >
            {/* Skills Selection */}
            <div className="space-y-3">
              <Label htmlFor="skills" className="form-label">
                Select Required Skills
              </Label>
              <MultiSelect
                options={skillOptions}
                selected={selectedSkills}
                onChange={setSelectedSkills}
                placeholder="Search and select skills..."
              />
              <p className="text-xs text-muted-foreground">
                Select one or more skills to find matching candidates.
              </p>
            </div>

            {/* Role Description */}
            <div className="space-y-3">
              <Label htmlFor="role-description" className="form-label">
                Role Description
              </Label>
              <Textarea
                id="role-description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Describe the project or role requirements, responsibilities, and any additional context..."
                className="min-h-[160px] resize-y transition-colors hover:border-primary focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Provide additional context about the role or project.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md transition-all hover:shadow-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Find Talent
                  </span>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Matching Candidates
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
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

            {/* Action Hint */}
            {results.length > 0 && (
              <div className="mt-8 p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Candidates are ranked by AI fit score. Higher scores indicate
                  a stronger match for your requirements.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-6 py-6">
          <p className="text-xs text-muted-foreground text-center">
            Internal use only. For support, contact the People team.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
