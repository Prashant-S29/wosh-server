ALTER TABLE "secrets" ALTER COLUMN "ciphertext" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "secrets" ALTER COLUMN "nonce" DROP NOT NULL;