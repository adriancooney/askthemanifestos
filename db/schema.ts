import { relations } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { Annotation } from "openai/resources/beta/threads/messages.mjs";

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  name: varchar("name"),
  slug: varchar("slug").unique().notNull(),
  url: varchar("url"),
  defaultPartyAssistantId: integer("default_party_assistant_id").references(
    (): AnyPgColumn => partyAssistants.id
  ),
  logoImageUrl: varchar("logo_image_url"),
  manifestoUrl: varchar("manifesto_url"),
});

export const partiesRelations = relations(parties, ({ one, many }) => ({
  defaultPartyAssistant: one(partyAssistants, {
    fields: [parties.defaultPartyAssistantId],
    references: [partyAssistants.id],
  }),
  partyAssistants: many(partyAssistants),
}));

export const partyAssistants = pgTable("party_assistants", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  openAiAssistantId: varchar("openai_assistant_id").unique().notNull(),
  partyId: integer("party_id")
    .notNull()
    .references(() => parties.id),
});

export const partyAssistantsRelations = relations(
  partyAssistants,
  ({ one }) => ({
    party: one(parties, {
      fields: [partyAssistants.partyId],
      references: [parties.id],
    }),
  })
);

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  slug: varchar("slug").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  content: text("content").notNull(),
  public: boolean("public").default(false).notNull(),
  votes: integer("votes").default(0).notNull(),
  userId: uuid("user_id").notNull(),
  completed: boolean("completed").default(false),
});

export const questionsRelations = relations(questions, ({ many }) => ({
  answers: many(answers),
}));

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id),
  partyAssistantId: integer("party_assistant_id")
    .notNull()
    .references(() => partyAssistants.id),
  content: text("content").notNull(),
  annotations: jsonb("annotations").$type<Annotation[]>(),
  cost: integer("cost"),
  completed: boolean("completed").default(false),
  votes: integer("votes").default(0).notNull(),
  index: integer("index").default(0).notNull(),
});

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
  partyAssistant: one(partyAssistants, {
    fields: [answers.partyAssistantId],
    references: [partyAssistants.id],
  }),
}));
