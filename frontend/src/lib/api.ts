const API_BASE = "/api/v1";

export interface CandidateResumeResponse {
  name: string;
  content: string;
}

export interface CandidateResult {
  name: string;
  role?: string | null;
  score: number;
  rationale: string;
  evidence: string[];
  email?: string | null;
  phone?: string | null;
}

export interface SearchResponse {
  query: string;
  results: CandidateResult[];
}

export async function searchCandidates(
  query: string,
  requiredSkills: string[],
  targetRoles?: string[]
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      required_skills: requiredSkills,
      target_roles: targetRoles && targetRoles.length > 0 ? targetRoles : [],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

export async function getCandidateResume(name: string): Promise<CandidateResumeResponse> {
  const response = await fetch(`${API_BASE}/candidates/${encodeURIComponent(name)}/resume`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}
