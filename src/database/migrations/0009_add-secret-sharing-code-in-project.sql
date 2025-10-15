ALTER TABLE "projects" RENAME COLUMN "enable_secret_sharing" TO "is_secret_sharing_enabled";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "secret_sharing_token" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "secret_sharing_code" text;--> statement-breakpoint
ALTER TABLE "secrets" DROP COLUMN "secret_sharing_token";--> statement-breakpoint
ALTER TABLE "secrets" DROP COLUMN "secret_sharing_code";--> statement-breakpoint
ALTER TABLE "secrets" DROP COLUMN "is_secret_sharing_enabled";