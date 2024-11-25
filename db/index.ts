import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  answers,
  answersRelations,
  parties,
  partiesRelations,
  partyAssistants,
  partyAssistantsRelations,
  questions,
  questionsRelations,
} from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({
  client: sql,
  schema: {
    questions,
    questionsRelations,
    answers,
    answersRelations,
    partyAssistants,
    partyAssistantsRelations,
    parties,
    partiesRelations,
  },
});
