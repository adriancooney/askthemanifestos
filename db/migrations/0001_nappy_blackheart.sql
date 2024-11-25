ALTER TABLE "answers" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "created_at" timestamp DEFAULT now();