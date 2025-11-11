ALTER TABLE `companies` ADD `subscription_plan` text DEFAULT 'starter';--> statement-breakpoint
ALTER TABLE `companies` ADD `subscription_status` text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `companies` ADD `subscription_start_date` integer;--> statement-breakpoint
ALTER TABLE `companies` ADD `subscription_end_date` integer;--> statement-breakpoint
ALTER TABLE `companies` ADD `max_employees` integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE `companies` ADD `monthly_fee` real DEFAULT 29.99;--> statement-breakpoint
ALTER TABLE `companies` ADD `billing_email` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `payment_status` text DEFAULT 'current';