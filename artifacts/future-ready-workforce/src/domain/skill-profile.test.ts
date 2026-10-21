import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SkillCatalogueEntry } from '@workspace/api-client-react';
import { sampleProfile } from './demo-data.ts';
import { rankCareers } from './services.ts';
import { buildCatalogue, catalogueIndex, resolveSkill, searchCatalogue, skillUsage } from './skill-catalogue.ts';
import { defaultWorkspace, parseWorkspace } from './storage.ts';

// A small fictional stand-in for the API catalogue response.
const api: SkillCatalogueEntry[] = [
  { name: 'Critical Thinking', key: 'critical thinking', facet: 'Foundational', sources: ['onet'], onet: { elementId: '2.A.2.a', group: 'Ways of Working', description: 'Using logic.' }, aliases: [] },
  { name: 'Python', key: 'python', facet: 'Digital & technical', sources: ['dataset'], onet: null, aliases: [] },
  { name: 'SQL', key: 'sql', facet: 'Digital & technical', sources: ['dataset'], onet: null, aliases: ['structured query language'] },
  { name: 'Machine learning', key: 'machine learning', facet: 'Digital & technical', sources: ['dataset'], onet: null, aliases: ['ml'] },
  { name: 'Machine learning models', key: 'machine learning models', facet: 'Digital & technical', sources: ['dataset'], onet: null, aliases: [] },
  { name: 'Excel', key: 'excel', facet: 'Digital & technical', sources: ['dataset'], onet: null, aliases: ['microsoft excel'] },
  { name: 'Leadership', key: 'leadership', facet: 'Interpersonal & communication', sources: ['dataset'], onet: null, aliases: [] },
];
const catalogue = buildCatalogue(api);
const index = catalogueIndex(catalogue);
const names = (query: string, facet = '') => searchCatalogue(catalogue, query, facet).map(r => r.skill.name);

test('search finds Python, SQL, Machine Learning and Critical Thinking case-insensitively by partial name', () => {
  assert.equal(names('pyth')[0], 'Python');
  assert.equal(names('sql')[0], 'SQL');
  assert.deepEqual(names('MACHINE').slice(0, 2), ['Machine learning', 'Machine learning models']);
  assert.equal(names('critical')[0], 'Critical Thinking');
  assert.equal(names('thinking')[0], 'Critical Thinking');
});

test('reviewed aliases resolve to the canonical skill', () => {
  const ml = searchCatalogue(catalogue, 'ML')[0];
  assert.equal(ml.skill.name, 'Machine learning');
  assert.equal(ml.matchedAlias, 'ml');
  assert.deepEqual(resolveSkill(index, ' ml ')?.skill.name, 'Machine learning');
  assert.equal(resolveSkill(index, 'Microsoft Excel')?.via, 'Microsoft Excel');
  assert.equal(resolveSkill(index, 'Quantum basket weaving'), null);
});

test('category filtering limits results to one facet', () => {
  assert.deepEqual(new Set(names('', 'Interpersonal & communication')), new Set(['Leadership', 'Facilitation']));
  assert.ok(names('', 'Digital & technical').every(n => catalogue.find(c => c.name === n)!.facet === 'Digital & technical'));
});

test('sample-role skills merge with official entries instead of duplicating them', () => {
  const critical = catalogue.filter(c => c.key === 'critical thinking');
  assert.equal(critical.length, 1);
  assert.deepEqual(critical[0].sources, ['onet', 'sample']);
  assert.equal(critical[0].name, 'Critical Thinking');
  // Without the API, sample-role skills remain available and are not labelled official.
  const offline = buildCatalogue(undefined);
  assert.ok(offline.length > 0 && offline.every(c => c.sources.join() === 'sample' && c.onet === null));
});

test('skill usage explains which calculations use a skill and keeps custom skills visible', () => {
  assert.deepEqual(skillUsage(index, 'critical thinking'), { sampleRoles: true, occupationEvidence: true, datasetMatching: false, custom: false });
  assert.deepEqual(skillUsage(index, 'Python'), { sampleRoles: false, occupationEvidence: false, datasetMatching: true, custom: false });
  assert.equal(skillUsage(index, 'Underwater welding (fictional)').custom, true);
});

test('changing fictional profile skills changes sample-role readiness', () => {
  const profile = sampleProfile('adult');
  const before = rankCareers(profile).find(a => a.role.id === 'workforce-analyst')!.readiness;
  const after = rankCareers({ ...profile, skills: [...profile.skills, { name: 'Critical Thinking', level: 3, category: 'Foundational' }] })
    .find(a => a.role.id === 'workforce-analyst')!.readiness;
  assert.ok(after > before);
});

test('saved About You details persist through a storage round trip', () => {
  const state = defaultWorkspace();
  Object.assign(state.profiles.adult, {
    occupation: 'Fictional logistics coordinator', experienceYears: 3, education: 'Fictional diploma', interests: ['Data'],
    location: 'Fictional town', workPreference: 'Hybrid', learningHours: 6, budgetMYR: 300, goals: 'Try a data role',
  });
  assert.deepEqual(parseWorkspace(JSON.stringify(state)).state.profiles.adult, state.profiles.adult);
});

test('migration keeps valid skills and details when part of a saved profile is invalid', () => {
  const state = defaultWorkspace();
  const saved = JSON.parse(JSON.stringify(state));
  saved.profiles.adult = {
    ...saved.profiles.adult,
    occupation: 'Fictional analyst',
    budgetMYR: -5, // invalid
    legacyField: 'from an older schema',
    skills: [
      { name: 'Python', level: 3, category: 'Digital & technical' },
      { name: 'python', level: 2, category: 'Duplicate' },
      { name: 'Broken', level: 9, category: 'Invalid level' },
      { name: 'My custom skill', level: 2, category: 'Custom' },
    ],
  };
  const loaded = parseWorkspace(JSON.stringify(saved));
  const adult = loaded.state.profiles.adult;
  assert.ok(loaded.warning);
  assert.equal(adult.occupation, 'Fictional analyst');
  assert.equal(adult.budgetMYR, null);
  assert.deepEqual(adult.skills.map(s => s.name), ['Python', 'My custom skill']);
  assert.ok(!('legacyField' in adult));
});
