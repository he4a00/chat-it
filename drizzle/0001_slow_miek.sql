CREATE TABLE "learner_stats" (
	"user_id" text PRIMARY KEY NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_practice_day" text,
	"total_attempts" integer DEFAULT 0 NOT NULL,
	"total_correct" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"chat_id" text,
	"message_id" text,
	"widget_type" text NOT NULL,
	"item_id" text,
	"topic_id" text,
	"subject" text NOT NULL,
	"topic_label" text NOT NULL,
	"outcome" text NOT NULL,
	"is_correct" boolean,
	"hint_used" boolean DEFAULT false NOT NULL,
	"difficulty" text,
	"attempt_no" integer DEFAULT 1 NOT NULL,
	"time_spent_ms" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"subject_key" text NOT NULL,
	"topic" text NOT NULL,
	"topic_key" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learner_memory_notes" ADD COLUMN "topic_id" text;--> statement-breakpoint
ALTER TABLE "learner_memory_notes" ADD COLUMN "type" text DEFAULT 'observation' NOT NULL;--> statement-breakpoint
ALTER TABLE "learner_memory_notes" ADD COLUMN "confidence" real;--> statement-breakpoint
ALTER TABLE "learner_memory_notes" ADD COLUMN "source_message_id" text;--> statement-breakpoint
ALTER TABLE "learner_memory_notes" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "learner_profiles" ADD COLUMN "subjects" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "learner_profiles" ADD COLUMN "onboarding_answers" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "learner_profiles" ADD COLUMN "onboarding_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "learner_profiles" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "learner_stats" ADD CONSTRAINT "learner_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_attempts_user_created_idx" ON "practice_attempts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "practice_attempts_user_topic_idx" ON "practice_attempts" USING btree ("user_id","topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topics_subject_topic_key_idx" ON "topics" USING btree ("subject_key","topic_key");--> statement-breakpoint
ALTER TABLE "learner_memory_notes" ADD CONSTRAINT "learner_memory_notes_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_memory_notes" ADD CONSTRAINT "learner_memory_notes_source_message_id_messages_id_fk" FOREIGN KEY ("source_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;