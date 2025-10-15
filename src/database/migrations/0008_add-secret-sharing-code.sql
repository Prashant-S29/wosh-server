ALTER TABLE "secrets" ADD COLUMN "secret_sharing_token" text;--> statement-breakpoint
ALTER TABLE "secrets" ADD COLUMN "secret_sharing_code" text;--> statement-breakpoint
ALTER TABLE "secrets" ADD COLUMN "is_secret_sharing_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "secret_sharing_token";