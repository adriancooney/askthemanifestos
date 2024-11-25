ALTER TABLE "questions" DROP CONSTRAINT "questions_party_id_parties_id_fk";
--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN "party_assistant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN "cost" integer;--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN "completed" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "answers" ADD CONSTRAINT "answers_party_assistant_id_party_assistants_id_fk" FOREIGN KEY ("party_assistant_id") REFERENCES "public"."party_assistants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN IF EXISTS "party_id";