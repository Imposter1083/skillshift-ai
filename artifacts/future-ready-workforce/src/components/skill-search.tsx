import { useId, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Proficiency } from '@/domain/types';
import { ChiliLevelSlider } from '@/components/chili-level-slider';
import { normalizeSkill } from '@/domain/services';
import {
  catalogueIndex, PROFICIENCY_GUIDE, resolveSkill, searchCatalogue,
  type CatalogueSkill, type SkillSource,
} from '@/domain/skill-catalogue';

export const sourceLabel: Record<SkillSource, string> = {
  onet: 'O*NET skill', dataset: 'Dataset skill', sample: 'Sample-role skill',
};

export function SourceBadges({ skill }: { skill: CatalogueSkill | null }) {
  if (!skill) return <span className="tag tag-below">Custom skill</span>;
  return <>{skill.sources.map(s => <span key={s} className={`tag ${s === 'onet' ? 'tag-medium' : 'tag-low'}`}>{sourceLabel[s]}</span>)}</>;
}

export interface NewSkill { name: string; category: string; level: Proficiency }

/**
 * Searchable skill picker. Users may pick a catalogue skill (by name or a
 * reviewed alias) or add any custom skill; a self-rated level is required.
 */
export function SkillSearch({ catalogue, facets, catalogueNote, existingNames, onAdd, disabled }: {
  catalogue: CatalogueSkill[];
  facets: string[];
  catalogueNote: string;
  existingNames: string[];
  onAdd(skill: NewSkill): void;
  disabled: boolean;
}) {
  const id = useId();
  const index = useMemo(() => catalogueIndex(catalogue), [catalogue]);
  const existing = useMemo(() => new Set(existingNames.map(normalizeSkill)), [existingNames]);
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState('');
  const [level, setLevel] = useState<Proficiency | ''>('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState('');

  const results = useMemo(() => searchCatalogue(catalogue, query, facet), [catalogue, query, facet]);
  const trimmed = query.trim().replace(/\s+/g, ' ');
  const resolved = trimmed ? resolveSkill(index, trimmed) : null;
  // A typed name with no catalogue match can be added as a custom skill.
  const options = [
    ...results.map(r => ({ kind: 'catalogue' as const, ...r })),
    ...(trimmed && !resolved ? [{ kind: 'custom' as const }] : []),
  ];

  const choose = (i: number) => {
    const option = options[i];
    if (!option) return;
    if (option.kind === 'catalogue') setQuery(option.skill.name);
    setOpen(false); setActive(-1); setError('');
  };

  const add = () => {
    if (!trimmed) return setError('Search for a skill or type your own.');
    if (trimmed.length > 60) return setError('Skill names must be 60 characters or fewer.');
    if (level === '') return setError('Choose your self-rated level (1–5) before adding.');
    const name = resolved?.skill.name ?? trimmed;
    if (existing.has(normalizeSkill(name))) return setError(`"${name}" is already in your profile.`);
    onAdd({ name, category: resolved ? resolved.skill.facet : facet || 'Custom', level });
    setQuery(''); setLevel(''); setError(''); setOpen(false); setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(options.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(-1, a - 1)); }
    else if (e.key === 'Escape') { setOpen(false); setActive(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && active >= 0) choose(active); else add();
    }
  };

  const selectedNote = resolved
    ? <>{resolved.via ? <>“{resolved.via}” is a reviewed alias of <b>{resolved.skill.name}</b>, which will be added. </> : <><b>{resolved.skill.name}</b> · </>}<SourceBadges skill={resolved.skill} /></>
    : trimmed ? <>“{trimmed}” is not in the catalogue. It will be added as a <b>custom skill</b>: it stays in your profile but built-in matching only uses recognised names.</> : null;

  return <div className="skill-search" data-testid="skill-search">
    <div className="skill-search-controls">
      <div className="skill-combobox">
        <input
          className="fr-input"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
          aria-label="Search skills or type a new skill"
          placeholder="Search skills, e.g. Python, SQL, ML"
          maxLength={80}
          value={query}
          disabled={disabled}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(-1); setError(''); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          data-testid="input-new-skill"
        />
        {open && options.length > 0 && <ul className="skill-options" role="listbox" id={`${id}-list`} data-testid="list-skill-options">
          {options.map((option, i) => {
            const duplicate = option.kind === 'catalogue' && existing.has(option.skill.key);
            return <li
              key={option.kind === 'catalogue' ? option.skill.key : 'custom'}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className={`skill-option${i === active ? ' is-active' : ''}`}
              onMouseDown={e => { e.preventDefault(); choose(i); }}
              data-testid={option.kind === 'catalogue' ? `option-skill-${option.skill.key.replace(/[^a-z0-9]+/g, '-')}` : 'option-skill-custom'}
            >
              {option.kind === 'catalogue'
                ? <>
                  <span className="skill-option-name">{option.skill.name}
                    {option.matchedAlias && <small> · alias “{option.matchedAlias}”</small>}
                    {duplicate && <small> · already in your profile</small>}
                  </span>
                  <span className="skill-option-meta">{option.skill.facet} <SourceBadges skill={option.skill} /></span>
                </>
                : <span className="skill-option-name">Add “{trimmed}” as a custom skill</span>}
            </li>;
          })}
        </ul>}
      </div>
      <select className="fr-select" value={facet} onChange={e => { setFacet(e.target.value); setOpen(true); }} aria-label="Filter skills by category" data-testid="select-skill-facet">
        <option value="">All categories</option>
        {facets.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
    </div>
    {selectedNote && <p className="skill-search-note" data-testid="text-new-skill-status">{selectedNote}</p>}
    <div className="skill-search-level">
      <ChiliLevelSlider value={level} onChange={setLevel} label="Self-rated level for the new skill" testId="select-new-skill-level" disabled={disabled} />
      <button type="button" className="btn btn-secondary btn-small" onClick={add} disabled={disabled} data-testid="button-add-skill"><Plus size={12} /> Add skill</button>
    </div>
    {error && <p className="field-error" role="alert" data-testid="error-add-skill">{error}</p>}
    <details className="skill-level-guide" data-testid="details-level-guide">
      <summary>What do levels 1–5 mean?</summary>
      <ul>{PROFICIENCY_GUIDE.map(g => <li key={g.level}><b>{g.level} · {g.label}</b> — {g.meaning}</li>)}</ul>
      <p>Levels are your own rating. They are not tested or validated, and O*NET importance or level ratings are never converted into them.</p>
    </details>
    <p className="skill-search-note muted">{catalogueNote}</p>
  </div>;
}
