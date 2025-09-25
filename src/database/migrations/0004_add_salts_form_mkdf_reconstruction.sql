ALTER TABLE "device_registrations" ADD COLUMN "combination_salt" text;--> statement-breakpoint
ALTER TABLE "device_registrations" ADD COLUMN "pin_salt" text;