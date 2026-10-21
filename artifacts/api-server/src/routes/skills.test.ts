import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import app from "../app";

let server: Server;
let base: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(() => {
  server.close();
});

describe("GET /api/skills/catalogue", () => {
  it("returns O*NET and dataset skills with facets, aliases and source notes", async () => {
    const response = await fetch(`${base}/skills/catalogue`);
    assert.equal(response.status, 200);
    const json = (await response.json()) as any;
    assert.ok(json.facets.includes("Digital & technical"));
    const python = json.entries.find((e: any) => e.key === "python");
    assert.deepEqual(python.sources, ["dataset"]);
    assert.equal(python.onet, null);
    const critical = json.entries.find((e: any) => e.key === "critical thinking");
    assert.equal(critical.onet.elementId, "2.A.2.a");
    assert.match(json.sources.aliases, /SkillShift-reviewed/);
  });

  it("uses catalogue names that the occupation and dataset matchers recognise", async () => {
    const catalogue = (await (await fetch(`${base}/skills/catalogue`)).json()) as any;
    const names = catalogue.entries.filter((e: any) => e.sources.includes("onet")).map((e: any) => e.name);
    const match = await fetch(`${base}/occupations/match`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ skills: names }),
    });
    const evidence = (await match.json()) as any;
    for (const occupation of evidence.occupations.filter((o: any) => o.recommendationStatus === "eligible")) {
      assert.equal(occupation.overlap.missingSkills.length, 0, occupation.id);
    }
    const datasetNames = catalogue.entries.filter((e: any) => e.sources.includes("dataset")).slice(0, 50).map((e: any) => e.name);
    const careers = await fetch(`${base}/career/match`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ skills: datasetNames }),
    });
    assert.equal(((await careers.json()) as any).unrecognizedSkills.length, 0);
  });
});
