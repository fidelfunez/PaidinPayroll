-- Create companies table first
CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`domain` text,
	`logo` text,
	`primary_color` text DEFAULT '#f97316',
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_slug_unique` ON `companies` (`slug`);
--> statement-breakpoint

-- Create btcpay_config table
CREATE TABLE `btcpay_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`url` text NOT NULL,
	`api_key` text NOT NULL,
	`store_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Add nullable company_id columns first
ALTER TABLE `users` ADD `company_id` integer REFERENCES companies(id);
--> statement-breakpoint
ALTER TABLE `payroll_payments` ADD `company_id` integer REFERENCES companies(id);
--> statement-breakpoint
ALTER TABLE `expense_reimbursements` ADD `company_id` integer REFERENCES companies(id);
--> statement-breakpoint
ALTER TABLE `btcpay_invoices` ADD `company_id` integer REFERENCES companies(id);
--> statement-breakpoint
ALTER TABLE `conversations` ADD `company_id` integer REFERENCES companies(id);
--> statement-breakpoint
ALTER TABLE `invoices` ADD `company_id` integer REFERENCES companies(id);
--> statement-breakpoint
ALTER TABLE `integrations` ADD `company_id` integer REFERENCES companies(id);
--> statement-breakpoint
ALTER TABLE `onboarding_flows` ADD `company_id` integer REFERENCES companies(id);
--> statement-breakpoint

-- Create other new tables
CREATE TABLE `integrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'disconnected' NOT NULL,
	`config` text NOT NULL,
	`last_sync` integer,
	`last_error` text,
	`created_by` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`invoice_number` text NOT NULL,
	`client_name` text NOT NULL,
	`client_email` text NOT NULL,
	`amount_usd` real NOT NULL,
	`amount_btc` real,
	`description` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`due_date` integer,
	`paid_date` integer,
	`btc_address` text,
	`payment_url` text,
	`transaction_hash` text,
	`created_by` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);
--> statement-breakpoint
CREATE TABLE `onboarding_flows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`department` text NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `onboarding_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`flow_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`progress` real DEFAULT 0 NOT NULL,
	`start_date` integer NOT NULL,
	`completed_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`flow_id`) REFERENCES `onboarding_flows`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `onboarding_task_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`progress_id` integer NOT NULL,
	`task_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`progress_id`) REFERENCES `onboarding_progress`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `onboarding_tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `onboarding_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`flow_id` integer NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	`order` integer NOT NULL,
	`estimated_time` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`flow_id`) REFERENCES `onboarding_flows`(`id`) ON UPDATE no action ON DELETE cascade
);