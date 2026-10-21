import type { SkillCatalogueEntry } from '@workspace/api-client-react';
import { demoRoles } from './demo-data';
import { normalizeSkill } from './services';

/**
 * Profile skill catalogue: the API catalogue (O*NET 31.0 skills and Dataset
 * Matching skills, with SkillShift-reviewed aliases) merged with the skills of
 * the fictional sample roles. Anything else is a custom skill.
 */
export type SkillSource = 'onet' | 'dataset' | 'sample';
export interface CatalogueSkill {
  name: string;
  key: string;
  facet: string;
  sources: SkillSource[];
  onet: SkillCatalogueEntry['onet'];
  aliases: string[];
}

/** SkillShift facets for the fictional sample-role skills. */
const SAMPLE_FACETS: Record<string, string> = {
  'customer research': 'Data & analytical',
  'service blueprinting': 'Design & creative',
  'data storytelling': 'Data & analytical',
  facilitation: 'Interpersonal & communication',
  excel: 'Digital & technical',
  'workforce planning': 'Management & organisation',
  'critical thinking': 'Data & analytical',
  'learning design': 'Design & creative',
  'project coordination': 'Management & organisation',
  'digital fluency': 'Digital & technical',
  'ai literacy': 'Digital & technical',
  'process improvement': 'Management & organisation',
};

export const PROFICIENCY_GUIDE: { level: 1 | 2 | 3 | 4 | 5; label: string; meaning: string }[] = [
  { level: 1, label: 'New to it', meaning: 'You have read about it or tried it once or twice.' },
  { level: 2, label: 'Exploring', meaning: 'You can do simple tasks with guidance or examples.' },
  { level: 3, label: 'Working knowledge', meaning: 'You use it on routine work without help.' },
  { level: 4, label: 'Confident', meaning: 'You handle complex or unfamiliar situations and review others’ work.' },
  { level: 5, label: 'Can teach', meaning: 'You could teach it, set standards for it or lead others in it.' },
];

export function buildCatalogue(apiEntries: SkillCatalogueEntry[] | undefined): CatalogueSkill[] {
  const entries = new Map<string, CatalogueSkill>();
  for (const e of apiEntries ?? []) entries.set(e.key, { ...e, sources: [...e.sources], aliases: [...e.aliases] });
  for (const role of demoRoles) {
    for (const { name } of role.requiredSkills) {
      const key = normalizeSkill(name);
      const existing = entries.get(key);
      if (existing) { if (!existing.sources.includes('sample')) existing.sources.push('sample'); continue; }
      entries.set(key, { name, key, facet: SAMPLE_FACETS[key] ?? 'Custom', sources: ['sample'], onet: null, aliases: [] });
    }
  }
  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function catalogueIndex(catalogue: CatalogueSkill[]) {
  const byKey = new Map(catalogue.map(e => [e.key, e]));
  const byAlias = new Map(catalogue.flatMap(e => e.aliases.map(a => [normalizeSkill(a), e] as const)));
  return { byKey, byAlias };
}

/** Finds the catalogue skill a typed name refers to, by exact name or reviewed alias. */
export function resolveSkill(index: ReturnType<typeof catalogueIndex>, name: string) {
  const key = normalizeSkill(name);
  const direct = index.byKey.get(key);
  if (direct) return { skill: direct, via: null as string | null };
  const aliased = index.byAlias.get(key);
  return aliased ? { skill: aliased, via: name.trim() } : null;
}

export interface SearchResult { skill: CatalogueSkill; matchedAlias: string | null; rank: number }

/** Case-insensitive search by name, word prefix and alias; optionally limited to one facet. */
export function searchCatalogue(catalogue: CatalogueSkill[], query: string, facet = '', limit = 8): SearchResult[] {
  const q = normalizeSkill(query);
  const results: SearchResult[] = [];
  for (const skill of catalogue) {
    if (facet && skill.facet !== facet) continue;
    if (!q) { results.push({ skill, matchedAlias: null, rank: 5 }); continue; }
    const words = skill.key.split(/[\s/.-]+/);
    let rank = skill.key === q ? 0 : skill.key.startsWith(q) ? 1 : words.some(w => w.startsWith(q)) ? 2 : skill.key.includes(q) ? 4 : -1;
    let matchedAlias: string | null = null;
    for (const alias of skill.aliases) {
      const a = normalizeSkill(alias);
      const aliasRank = a === q ? 0 : a.startsWith(q) ? 3 : -1;
      if (aliasRank >= 0 && (rank < 0 || aliasRank < rank)) { rank = aliasRank; matchedAlias = alias; }
    }
    if (rank >= 0) results.push({ skill, matchedAlias, rank });
  }
  // Official O*NET skills first among equals, then shorter (closer) names.
  results.sort((a, b) => a.rank - b.rank ||
    Number(!b.skill.sources.includes('onet')) - Number(!a.skill.sources.includes('onet')) ||
    a.skill.name.length - b.skill.name.length || a.skill.name.localeCompare(b.skill.name));
  return results.slice(0, limit);
}

export interface SkillUsage { sampleRoles: boolean; occupationEvidence: boolean; datasetMatching: boolean; custom: boolean }

/** Which existing calculations use a profile skill name (all match exact normalized names). */
export function skillUsage(index: ReturnType<typeof catalogueIndex>, name: string): SkillUsage {
  const entry = index.byKey.get(normalizeSkill(name));
  return {
    sampleRoles: Boolean(entry?.sources.includes('sample')),
    occupationEvidence: Boolean(entry?.sources.includes('onet')),
    datasetMatching: Boolean(entry?.sources.includes('dataset')),
    custom: !entry,
  };
}
