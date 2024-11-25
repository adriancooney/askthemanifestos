ALTER TABLE "answers" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "party_assistants" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "parties" ADD COLUMN "name" varchar;--> statement-breakpoint
ALTER TABLE "parties" ADD COLUMN "url" varchar;--> statement-breakpoint
ALTER TABLE "parties" ADD COLUMN "logo_image_url" varchar;