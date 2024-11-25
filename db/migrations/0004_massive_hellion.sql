CREATE TABLE IF NOT EXISTS "parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar,
	"default_party_assistant_id" integer,
	CONSTRAINT "parties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "party_assistants" DROP CONSTRAINT "party_assistants_party_unique";--> statement-breakpoint
ALTER TABLE "party_assistants" ADD COLUMN "party_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "party_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parties" ADD CONSTRAINT "parties_default_party_assistant_id_party_assistants_id_fk" FOREIGN KEY ("default_party_assistant_id") REFERENCES "public"."party_assistants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "party_assistants" ADD CONSTRAINT "party_assistants_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "party_assistants" DROP COLUMN IF EXISTS "party";