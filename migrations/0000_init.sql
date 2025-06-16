CREATE TABLE "analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"instagram_msg_count" integer DEFAULT 0,
	"youtube_msg_count" integer DEFAULT 0,
	"new_msg_count" integer DEFAULT 0,
	"replied_msg_count" integer DEFAULT 0,
	"auto_replied_msg_count" integer DEFAULT 0,
	"avg_response_time_minutes" integer DEFAULT 0,
	"high_intent_leads_count" integer DEFAULT 0,
	"top_topics" jsonb DEFAULT '[]'::jsonb,
	"sensitive_topics_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true,
	"trigger_type" text DEFAULT 'keywords' NOT NULL,
	"trigger_keywords" jsonb DEFAULT '[]'::jsonb,
	"action" text NOT NULL,
	"response_template" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"content_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"url" text NOT NULL,
	"engagement_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"source" text NOT NULL,
	"intent_category" text,
	"contact_info" text,
	"notes" text,
	"airtable_record_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'new'
);
--> statement-breakpoint
CREATE TABLE "message_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"external_participant_id" text NOT NULL,
	"participant_name" text NOT NULL,
	"participant_avatar" text,
	"source" text NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"last_message_content" text,
	"status" text DEFAULT 'active',
	"auto_reply" boolean DEFAULT false,
	"unread_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"sender_name" text NOT NULL,
	"sender_avatar" text,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"is_high_intent" boolean DEFAULT false,
	"intent_category" text,
	"intent_confidence" integer,
	"is_sensitive" boolean DEFAULT false,
	"sensitive_category" text,
	"reply" text,
	"reply_timestamp" timestamp,
	"is_ai_generated" boolean DEFAULT false,
	"is_outbound" boolean DEFAULT false,
	"parent_message_id" integer,
	"metadata" jsonb,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"api_keys" jsonb,
	"ai_settings" jsonb,
	"notification_settings" jsonb,
	"ai_auto_replies_instagram" boolean DEFAULT false,
	"ai_auto_replies_youtube" boolean DEFAULT false,
	"instagram_token" text,
	"youtube_token" text,
	"openai_token" text,
	"airtable_token" text,
	"airtable_base_id" text,
	"airtable_table_name" text,
	"creator_tone_description" text,
	"ai_temperature" integer DEFAULT 70,
	"ai_model" text DEFAULT 'gpt-4o',
	"max_response_length" integer DEFAULT 500,
	"notification_email" text,
	"notify_on_high_intent" boolean DEFAULT true,
	"notify_on_sensitive_topics" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_items_user_id_idx" ON "content_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_items_content_type_idx" ON "content_items" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "content_items_external_id_idx" ON "content_items" USING btree ("external_id");