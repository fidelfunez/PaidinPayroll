CREATE TABLE `btc_rate_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rate` real NOT NULL,
	`source` text DEFAULT 'coingecko' NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `btcpay_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`btcpay_invoice_id` text NOT NULL,
	`order_id` text NOT NULL,
	`amount_usd` real NOT NULL,
	`amount_btc` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`status_message` text,
	`customer_email` text,
	`customer_name` text,
	`payment_url` text,
	`lightning_payment_url` text,
	`onchain_payment_url` text,
	`total_paid` real DEFAULT 0,
	`payment_method` text,
	`transaction_hash` text,
	`paid_date` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `btcpay_invoices_btcpay_invoice_id_unique` ON `btcpay_invoices` (`btcpay_invoice_id`);--> statement-breakpoint
CREATE TABLE `btcpay_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`btcpay_transaction_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`confirmations` integer DEFAULT 0,
	`block_height` integer,
	`block_hash` text,
	`txid` text,
	`timestamp` integer,
	`status` text NOT NULL,
	`payment_type` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `btcpay_invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant_ids` text NOT NULL,
	`last_message_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expense_reimbursements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`amount_usd` real NOT NULL,
	`amount_btc` real,
	`btc_rate` real,
	`status` text DEFAULT 'pending' NOT NULL,
	`receipt_url` text,
	`approved_by` integer,
	`approved_date` integer,
	`paid_date` integer,
	`transaction_hash` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`sender_id` integer NOT NULL,
	`content` text NOT NULL,
	`timestamp` integer NOT NULL,
	`read_by` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`amount_usd` real NOT NULL,
	`amount_btc` real NOT NULL,
	`btc_rate` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`scheduled_date` integer NOT NULL,
	`paid_date` integer,
	`transaction_hash` text,
	`lnbits_payment_hash` text,
	`lnbits_invoice_id` text,
	`processing_notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'employee' NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`bio` text,
	`btc_address` text,
	`withdrawal_method` text DEFAULT 'not_set' NOT NULL,
	`bank_account_details` text,
	`monthly_salary` real,
	`profile_photo` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);