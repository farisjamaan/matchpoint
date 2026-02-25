export type Candidate = {
  id: string;
  name: string;
  role: string;
  score: number;
  rationale: string;
  evidence: string[];
  email: string;
  phone: string;
};

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "C-8921",
    name: "Sarah Jenkins",
    role: "Senior Manager, Tech Consulting",
    score: 94,
    rationale: "Exceptional match for cloud migration lead. Led 3 similar enterprise transformations in the financial sector.",
    evidence: [
      "\"Architected AWS migration for Tier 1 bank, reducing latency by 40%\"",
      "\"Certified AWS Solutions Architect Professional (2023)\""
    ],
    email: "sarah.jenkins@ey.com",
    phone: "+1 (555) 019-2834"
  },
  {
    id: "C-4432",
    name: "David Chen",
    role: "Manager, Data & AI",
    score: 88,
    rationale: "Strong technical fit with deep expertise in predictive modeling and Python ecosystem.",
    evidence: [
      "\"Deployed predictive churn model increasing retention by 15%\"",
      "\"Lead contributor to internal EY AI toolkit\""
    ],
    email: "david.chen@ey.com",
    phone: "+1 (555) 012-9931"
  },
  {
    id: "C-1109",
    name: "Elena Rodriguez",
    role: "Director, Cyber Security",
    score: 65,
    rationale: "Partial match. Deep security expertise but lacks direct experience with the specified legacy systems.",
    evidence: [
      "\"Managed global SOC team of 50+ analysts\"",
    ],
    email: "elena.rodriguez@ey.com",
    phone: "+1 (555) 018-4422"
  },
  {
    id: "C-9920",
    name: "Michael Chang",
    role: "Consultant II, Tech Consulting",
    score: 42,
    rationale: "Low match. Junior profile with limited exposure to enterprise architecture planning.",
    evidence: [
      "\"Assisted in cloud readiness assessment for mid-market client\""
    ],
    email: "michael.chang@ey.com",
    phone: "+1 (555) 011-8833"
  }
];
