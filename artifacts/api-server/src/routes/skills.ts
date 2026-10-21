import { Router, type IRouter } from "express";
import { GetSkillCatalogueResponse } from "@workspace/api-zod";
import { getSkillCatalogue } from "../lib/skillCatalogue";

const router: IRouter = Router();

// The catalogue never changes at runtime, so validate it once.
let catalogueResponse: ReturnType<typeof getSkillCatalogue> | undefined;

router.get("/skills/catalogue", (_req, res): void => {
  if (!catalogueResponse) {
    const result = getSkillCatalogue();
    GetSkillCatalogueResponse.parse(result);
    catalogueResponse = result;
  }
  res.json(catalogueResponse);
});

export default router;
