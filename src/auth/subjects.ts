import { createSubjects } from "@openauthjs/openauth";
import { object, string } from "valibot";

export const subjects = createSubjects({
  // @ts-expect-error - Overriding the default subjects
  user: object({
    id: string(),
  }),
});
