ALTER TABLE "secrets" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "secrets" DROP COLUMN "auth_tag";