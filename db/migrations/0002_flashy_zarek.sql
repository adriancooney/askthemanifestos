CREATE TABLE IF NOT EXISTS "party_assistants" (
	"id" serial PRIMARY KEY NOT NULL,
	"party" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"openai_assistant_id" varchar NOT NULL,
	CONSTRAINT "party_assistants_party_unique" UNIQUE("party"),
	CONSTRAINT "party_assistants_openai_assistant_id_unique" UNIQUE("openai_assistant_id")
);
