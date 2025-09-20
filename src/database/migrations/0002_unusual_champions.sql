ALTER TABLE "organizations" ADD COLUMN "private_key_encrypted" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "key_derivation_salt" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "encryption_iv" text NOT NULL;