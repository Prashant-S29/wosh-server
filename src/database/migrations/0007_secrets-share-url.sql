ALTER TABLE "projects" ADD COLUMN "enable_secret_sharing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "secret_sharing_token" text;