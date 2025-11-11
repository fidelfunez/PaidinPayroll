CREATE TABLE `breez_wallets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`user_id` integer,
	`wallet_type` text NOT NULL,
	`breez_node_id` text NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`invoice_capability` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'initializing' NOT NULL,
	`last_sync_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `breez_wallets_breez_node_id_unique` ON `breez_wallets` (`breez_node_id`);--> statement-breakpoint
CREATE TABLE `conversions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`payment_intent_id` integer NOT NULL,
	`strike_quote_id` text NOT NULL,
	`amount_usd` real NOT NULL,
	`amount_btc` real NOT NULL,
	`exchange_rate` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`strike_invoice_id` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_intent_id`) REFERENCES `payment_intents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payment_intents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`stripe_payment_intent_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`status` text DEFAULT 'requires_payment_method' NOT NULL,
	`plaid_account_id` integer NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plaid_account_id`) REFERENCES `plaid_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_intents_stripe_payment_intent_id_unique` ON `payment_intents` (`stripe_payment_intent_id`);--> statement-breakpoint
CREATE TABLE `plaid_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`plaid_item_id` text NOT NULL,
	`plaid_access_token` text NOT NULL,
	`account_id` text NOT NULL,
	`account_name` text NOT NULL,
	`account_type` text NOT NULL,
	`account_mask` text,
	`institution_id` text NOT NULL,
	`institution_name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`transaction_type` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`event_type` text NOT NULL,
	`event_id` text NOT NULL,
	`payload` text NOT NULL,
	`processed` integer DEFAULT false NOT NULL,
	`processed_at` integer,
	`error` text,
	`created_at` integer NOT NULL
);
