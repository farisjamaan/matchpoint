const API_BASE = "/api/v1";

export interface CandidateResult {
  name: string;
  role?: string | null;
  score: number;
  rationale: string;
  evidence: string[];
}

export interface SearchResponse {
  query: string;
  results: CandidateResult[];
}

export async function searchCandidates(
  query: string,
  requiredSkills: string[]
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, required_skills: requiredSkills }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}
