import assert from "node:assert/strict";
import { describe, it } from "node:test";
import rawOnet from "../data/occupation-evidence/onet-31.0-skills.json";
import { careerDataset } from "./careerMatcher";
import { buildSkillCatalogue, getSkillCatalogue, SKILL_FACETS, skillCatalogue } from "./skillCatalogue";

const find = (key: string) => skillCatalogue.find((e) => e.key === key);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

describe("skill catalogue", () => {
  it("contains every O*NET 31.0 skill element with its official ID and group", () => {
    const onet = skillCatalogue.filter((e) => e.sources.includes("onet"));
    assert.equal(onet.length, 35);
    const critical = find("critical thinking")!;
    assert.equal(critical.name, "Critical Thinking");
    assert.deepEqual([critical.onet!.elementId, critical.onet!.group], ["2.A.2.a", "Ways of Working"]);
    const programming = find("programming")!;
    assert.deepEqual([programming.onet!.elementId, programming.onet!.group], ["2.B.3.e", "Technical Skills"]);
  });

  it("contains every Dataset Matching skill under its normalized key", () => {
    for (const skill of careerDataset.allSkills) assert.ok(find(skill)?.sources.includes("dataset"), skill);
    assert.equal(find("python")!.name, "Python");
    assert.equal(find("sql")!.name, "SQL");
    assert.equal(find("machine learning")!.facet, "Digital & technical");
  });

  it("never gives dataset-only skills an O*NET identifier", () => {
    for (const entry of skillCatalogue) {
      assert.equal(entry.onet === null, !entry.sources.includes("onet"), entry.name);
      if (entry.onet) assert.ok(rawOnet.skillElements.some((e) => e.elementId === entry.onet!.elementId && e.name === entry.name));
    }
  });

  it("has unique keys, known facets and aliases that resolve to one skill", () => {
    const keys = skillCatalogue.map((e) => e.key);
    assert.equal(new Set(keys).size, keys.length);
    const aliases = skillCatalogue.flatMap((e) => e.aliases);
    assert.equal(new Set(aliases).size, aliases.length);
    for (const entry of skillCatalogue) {
      assert.ok((SKILL_FACETS as readonly string[]).includes(entry.facet));
      for (const alias of entry.aliases) assert.ok(!keys.includes(alias), alias);
    }
    assert.deepEqual(find("machine learning")!.aliases, ["ml"]);
    assert.ok(find("kubernetes")!.aliases.includes("k8s"));
  });

  it("rejects invalid O*NET input instead of inventing entries", () => {
    const missing = clone(rawOnet);
    missing.skillElements.pop();
    assert.throws(() => buildSkillCatalogue(missing, careerDataset.allSkills));
    assert.throws(() => buildSkillCatalogue(rawOnet, ["python"]), /not a dataset skill/);
  });

  it("labels aliases and facets as SkillShift groupings", () => {
    const { sources } = getSkillCatalogue();
    assert.match(sources.aliases, /not official/);
    assert.match(sources.facets, /SkillShift browsing grouping/);
    assert.match(sources.onet, /CC BY 4\.0/);
  });
});
