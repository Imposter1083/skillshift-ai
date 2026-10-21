# Skills profile and catalogue

## Catalogue sources

`GET /api/skills/catalogue` (`artifacts/api-server/src/lib/skillCatalogue.ts`) combines:

| Kind | Source | Count | Badge in the UI |
| --- | --- | --- | --- |
| O*NET skill | O*NET 31.0 skill elements: official names, element IDs, official groups and descriptions, from `content_model_reference.csv` (stored in `onet-31.0-skills.json` by `import:onet`) | 35 | O*NET skill |
| Dataset skill | Every skill in `career_roles.json` (Qarera, *Most In-Demand Job Skills of 2026*, CC BY 4.0), the dataset used by Dataset Matching | 227 | Dataset skill |

The frontend (`src/domain/skill-catalogue.ts`) adds the fictional sample-role skills (badge "Sample-role skill"). Entries with the same normalized name merge into one entry with several badges. For example, "Critical Thinking" is both an O*NET skill and a sample-role skill. "Monitoring" is both an O*NET skill and a dataset skill: O*NET defines it as assessing performance, while the dataset term is technical monitoring.

- **O*NET identifiers** appear only on the 35 O*NET skills. Dataset, sample-role and custom skills never carry one.
- **Aliases** (e.g. `ML` → Machine learning, `k8s` → Kubernetes, `postgres` → PostgreSQL) are SkillShift-reviewed abbreviations or spelling variants of exactly the same skill. They are not official terms. Picking or typing an alias adds the canonical name.
- **Facets** (Foundational, Interpersonal & communication, Data & analytical, Digital & technical, Design & creative, Management & organisation, Industry & domain) are a SkillShift browsing grouping. O*NET skills map from their official group; O*NET's group is shown separately.
- **Custom skills**: any other name can be added. Custom skills stay visible in the profile, and the UI states that no built-in matching calculation uses them.
- If the API is unavailable, the sample-role skills remain searchable and custom skills can still be added.

## Matching compatibility

All calculations match exact normalized names (`normalizeSkill`: NFKC, trim, lower case, single spaces):

| Feature | Uses profile skills that are… |
| --- | --- |
| Career explorer sample roles, Digital twin, Roadmap | sample-role skills, with self-rated levels |
| Official occupation evidence (MyCOL + O*NET) | O*NET skills, by name only (no levels) |
| Dataset matching | dataset skills, by name only |

Each profile skill row shows its source badges and which of these calculations use it.

## Proficiency

Levels stay 1–5 and are self-rated. A level must be chosen before a skill is added. Nothing defaults to level 2. The "What do levels 1–5 mean?" guide explains each level. O*NET importance and level ratings are never converted into these levels.

## Persistence

Fictional demo profiles, including About You details, are stored in browser local storage and persist after refresh. The page states that only fictional details may be entered and that no real CV may be uploaded. If a saved profile fails the current schema, `parseWorkspace` keeps each valid field and each valid, non-duplicate skill, and resets only the invalid parts.
