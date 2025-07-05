CREATE TABLE "mail_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"provider" varchar(100) NOT NULL,
	"imap_host" varchar(255) NOT NULL,
	"imap_port" integer DEFAULT 993 NOT NULL,
	"imap_secure" boolean DEFAULT true NOT NULL,
	"smtp_host" varchar(255) NOT NULL,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_secure" boolean DEFAULT true NOT NULL,
	"username" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"oauth_access_token" text,
	"oauth_refresh_token" text,
	"oauth_token_expiry" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_date" timestamp,
	"sync_status" varchar(50) DEFAULT 'idle',
	"sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"mail_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size" integer NOT NULL,
	"content_id" varchar(255),
	"local_path" varchar(500),
	"is_inline" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"path" varchar(500) NOT NULL,
	"delimiter" varchar(10) DEFAULT '/',
	"is_selectable" boolean DEFAULT true NOT NULL,
	"has_children" boolean DEFAULT false NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_label_relations" (
	"id" serial PRIMARY KEY NOT NULL,
	"mail_id" integer NOT NULL,
	"label_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mails" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"folder_id" integer NOT NULL,
	"uid" integer NOT NULL,
	"message_id" varchar(500) NOT NULL,
	"thread_id" varchar(255),
	"subject" text NOT NULL,
	"from" jsonb NOT NULL,
	"to" jsonb NOT NULL,
	"cc" jsonb,
	"bcc" jsonb,
	"reply_to" jsonb,
	"text_content" text,
	"html_content" text,
	"snippet" varchar(500),
	"date" timestamp NOT NULL,
	"received_date" timestamp DEFAULT now() NOT NULL,
	"size" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"is_answered" boolean DEFAULT false NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"attachment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"folder_id" integer,
	"last_sync_date" timestamp DEFAULT now() NOT NULL,
	"last_uid" integer,
	"sync_type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"error_message" text,
	"emails_processed" integer DEFAULT 0,
	"emails_added" integer DEFAULT 0,
	"emails_updated" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail_attachments" ADD CONSTRAINT "mail_attachments_mail_id_mails_id_fk" FOREIGN KEY ("mail_id") REFERENCES "public"."mails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_folders" ADD CONSTRAINT "mail_folders_account_id_mail_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_label_relations" ADD CONSTRAINT "mail_label_relations_mail_id_mails_id_fk" FOREIGN KEY ("mail_id") REFERENCES "public"."mails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_label_relations" ADD CONSTRAINT "mail_label_relations_label_id_mail_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."mail_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_labels" ADD CONSTRAINT "mail_labels_account_id_mail_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mails" ADD CONSTRAINT "mails_account_id_mail_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mails" ADD CONSTRAINT "mails_folder_id_mail_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."mail_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_status" ADD CONSTRAINT "sync_status_account_id_mail_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."mail_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_status" ADD CONSTRAINT "sync_status_folder_id_mail_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."mail_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "mail_accounts" USING btree ("email");