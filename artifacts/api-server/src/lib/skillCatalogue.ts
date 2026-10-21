import { z } from "zod";
import rawOnet from "../data/occupation-evidence/onet-31.0-skills.json";
import { careerDataset, normalizeSkill } from "./careerMatcher";

/**
 * Searchable skill catalogue for the profile builder.
 *
 * Entries come from two official sources already used by the API:
 * - O*NET 31.0 skill elements (official names, IDs, groups and descriptions).
 * - The job-postings dataset behind Dataset Matching (`career_roles.json`).
 * Aliases are SkillShift-reviewed abbreviations and spelling variants of the
 * same skill; they are not official O*NET or dataset terms. Facets are a
 * SkillShift browsing grouping, not an official classification.
 */

export const SKILL_FACETS = [
  "Foundational",
  "Interpersonal & communication",
  "Data & analytical",
  "Digital & technical",
  "Design & creative",
  "Management & organisation",
  "Industry & domain",
] as const;
export type SkillFacet = (typeof SKILL_FACETS)[number];

const onetCatalogueSchema = z.object({
  release: z.string(),
  skillGroups: z.array(z.object({ elementId: z.string(), name: z.string().min(1), description: z.string() })).length(7),
  skillElements: z.array(z.object({
    elementId: z.string().regex(/^2\.[AB]\.\d+\.[a-z]$/),
    name: z.string().min(1),
    description: z.string().min(1),
    groupId: z.string(),
  })).length(35),
});

/** SkillShift facet for each official O*NET skill group. */
const ONET_GROUP_FACETS: Record<string, SkillFacet> = {
  "2.A.1": "Foundational",
  "2.A.2": "Foundational",
  "2.B.1": "Interpersonal & communication",
  "2.B.2": "Data & analytical",
  "2.B.3": "Digital & technical",
  "2.B.4": "Data & analytical",
  "2.B.5": "Management & organisation",
};

/** Dataset skills outside the default "Digital & technical" facet. */
const DATASET_FACETS: Partial<Record<SkillFacet, string[]>> = {
  "Interpersonal & communication": [
    "collaboration", "communication", "communication and collaboration", "english", "leadership", "stakeholder management",
  ],
  "Data & analytical": [
    "analytical", "analytical skills", "analytics", "attention to detail", "bi", "business analysis", "business intelligence",
    "dashboards", "data", "data analysis", "data analyst", "data analytics", "data interpretation", "data visualization",
    "market research", "statistics",
  ],
  "Design & creative": [
    "accessibility", "adobe creative suite", "adobe photoshop", "adobe xd", "branding", "canva", "color theory", "design",
    "design systems", "figma", "graphic design", "illustrator", "layout", "motion graphics", "photoshop", "responsive design",
    "typography", "ui/ux", "ui/ux design", "usability testing", "user research", "ux",
  ],
  "Management & organisation": [
    "agile", "change management", "ms project", "product development", "product management", "product roadmap",
    "product strategy", "program management", "project management", "project management tools", "risk management",
    "scrum", "scrum master", "procurement",
  ],
  "Industry & domain": [
    "business", "compliance", "construction", "finance", "fintech", "governance", "iso 27001", "marketing", "nist",
    "social media", "supply chain",
  ],
};

/** Display casing for dataset names, which the dataset stores in lower case. */
const DISPLAY_NAMES: Record<string, string> = {
  ai: "AI", "ai/ml": "AI/ML", aws: "AWS", "azure devops": "Azure DevOps", bi: "BI", "ci/cd": "CI/CD", "ci/cd pipelines": "CI/CD pipelines",
  cissp: "CISSP", css: "CSS", css3: "CSS3", chatgpt: "ChatGPT", dax: "DAX", dbt: "dbt", devops: "DevOps", edr: "EDR", etl: "ETL",
  fastapi: "FastAPI", gcp: "GCP", "github actions": "GitHub Actions", html: "HTML", html5: "HTML5", ios: "iOS", "iso 27001": "ISO 27001",
  javascript: "JavaScript", json: "JSON", langchain: "LangChain", llm: "LLM", llms: "LLMs", mlops: "MLOps", mongodb: "MongoDB",
  "ms project": "MS Project", mvvm: "MVVM", mysql: "MySQL", "next.js": "Next.js", nist: "NIST", nlp: "NLP", "node.js": "Node.js",
  postgresql: "PostgreSQL", "power bi": "Power BI", pyspark: "PySpark", pytorch: "PyTorch", qa: "QA", rag: "RAG", "react.js": "React.js",
  "react native": "React Native", "rest apis": "REST APIs", "restful apis": "RESTful APIs", saas: "SaaS", sdlc: "SDLC", siem: "SIEM",
  sql: "SQL", "spring boot": "Spring Boot", tensorflow: "TensorFlow", typescript: "TypeScript", "ui/ux": "UI/UX", "ui/ux design": "UI/UX design",
  ux: "UX", "vue.js": "Vue.js", xcode: "Xcode", autocad: "AutoCAD", "adobe xd": "Adobe XD", "adobe photoshop": "Adobe Photoshop",
  "adobe creative suite": "Adobe Creative Suite", "android sdk": "Android SDK", "infrastructure as code": "Infrastructure as code",
};

/**
 * SkillShift-reviewed aliases: common abbreviations or alternative spellings
 * that name exactly the same skill as a catalogue entry. Not official terms.
 */
const ALIASES: Record<string, string> = {
  ml: "machine learning",
  "artificial intelligence": "ai",
  js: "javascript",
  ts: "typescript",
  k8s: "kubernetes",
  postgres: "postgresql",
  golang: "go",
  "amazon web services": "aws",
  "google cloud platform": "gcp",
  "google cloud": "gcp",
  "microsoft azure": "azure",
  "microsoft excel": "excel",
  "ms excel": "excel",
  powerbi: "power bi",
  "microsoft power bi": "power bi",
  nodejs: "node.js",
  reactjs: "react.js",
  vuejs: "vue.js",
  nextjs: "next.js",
  "natural language processing": "nlp",
  "large language models": "llms",
  "large language model": "llm",
  genai: "generative ai",
  "gen ai": "generative ai",
  "scikit-learn": "scikit",
  sklearn: "scikit",
  "user experience": "ux",
  "continuous integration/continuous delivery": "ci/cd",
  "extract, transform, load": "etl",
  "structured query language": "sql",
};

export interface CatalogueEntry {
  name: string;
  key: string;
  facet: SkillFacet;
  sources: ("onet" | "dataset")[];
  onet: { elementId: string; group: string; description: string } | null;
  aliases: string[];
}

export function buildSkillCatalogue(onetInput: unknown, datasetSkills: readonly string[]): CatalogueEntry[] {
  const onet = onetCatalogueSchema.parse(onetInput);
  const groups = new Map(onet.skillGroups.map((g) => [g.elementId, g.name]));
  const entries = new Map<string, CatalogueEntry>();

  for (const element of onet.skillElements) {
    const group = groups.get(element.groupId);
    const facet = ONET_GROUP_FACETS[element.groupId];
    if (!group || !facet) throw new Error(`Skill catalogue: no group or facet for ${element.elementId}`);
    const key = normalizeSkill(element.name);
    entries.set(key, {
      name: element.name, key, facet, sources: ["onet"],
      onet: { elementId: element.elementId, group, description: element.description }, aliases: [],
    });
  }

  const datasetFacet = new Map<string, SkillFacet>();
  for (const [facet, names] of Object.entries(DATASET_FACETS) as [SkillFacet, string[]][]) {
    for (const name of names) {
      if (!datasetSkills.includes(name)) throw new Error(`Skill catalogue: facet override "${name}" is not a dataset skill`);
      datasetFacet.set(name, facet);
    }
  }
  for (const skill of datasetSkills) {
    const key = normalizeSkill(skill);
    const existing = entries.get(key);
    if (existing) { existing.sources.push("dataset"); continue; }
    const name = DISPLAY_NAMES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
    entries.set(key, { name, key, facet: datasetFacet.get(key) ?? "Digital & technical", sources: ["dataset"], onet: null, aliases: [] });
  }

  for (const [alias, target] of Object.entries(ALIASES)) {
    const entry = entries.get(normalizeSkill(target));
    if (!entry) throw new Error(`Skill catalogue: alias "${alias}" points to unknown skill "${target}"`);
    if (entries.has(normalizeSkill(alias))) throw new Error(`Skill catalogue: alias "${alias}" is itself a catalogue skill`);
    entry.aliases.push(alias);
  }

  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const skillCatalogue = buildSkillCatalogue(rawOnet, careerDataset.allSkills);

export function getSkillCatalogue() {
  return {
    facets: [...SKILL_FACETS],
    entries: skillCatalogue,
    sources: {
      onet: `O*NET ${rawOnet.release} skill elements (official names, IDs and groups). Information from the O*NET ${rawOnet.release} Database by USDOL/ETA, used under the CC BY 4.0 license.`,
      dataset: `${careerDataset.source.datasetName} (${careerDataset.source.publisher}, ${careerDataset.source.license}), the dataset used by Dataset Matching.`,
      aliases: "Aliases are SkillShift-reviewed abbreviations and spelling variants of the same skill. They are not official O*NET or dataset terms.",
      facets: "Facets are a SkillShift browsing grouping. O*NET's own group is shown separately for O*NET skills.",
    },
  };
}
