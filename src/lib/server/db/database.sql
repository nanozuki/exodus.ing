CREATE TABLE "article" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"content_type" text NOT NULL,
	"path" text NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"bookmark_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "bookmark" (
	"user_id" text NOT NULL,
	"article_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "comment" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"article_id" text NOT NULL,
	"content" text NOT NULL
);

CREATE TABLE "invite_code" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"role_key" text NOT NULL,
	"inviter_id" text NOT NULL,
	"used_at" timestamp,
	CONSTRAINT "invite_code_code_unique" UNIQUE("code")
);

CREATE TABLE "pending_auth" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_type" text NOT NULL,
	"state" text,
	"provider" text,
	"provider_user_id" text,
	"provider_username" text,
	"provider_email" text,
	"payload" jsonb,
	"next" text,
	"sign_up_username" text,
	"sign_up_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);

CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);

CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"username" text NOT NULL,
	"github_id" integer,
	"name" text NOT NULL,
	"about_me" text NOT NULL,
	"verify_code" text NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_github_id_unique" UNIQUE("github_id"),
	CONSTRAINT "user_name_unique" UNIQUE("name")
);

CREATE TABLE "user_auth" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"provider_username" text,
	"provider_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "user_role" (
	"user_id" text NOT NULL,
	"role_key" text NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text,
	CONSTRAINT "user_role_user_id_role_key_pk" PRIMARY KEY("user_id","role_key")
);

CREATE UNIQUE INDEX "article_title_idx" ON "article" USING btree ("title","user_id");
CREATE INDEX "article_user_id_idx" ON "article" USING btree ("user_id");
CREATE INDEX "article_path_idx" ON "article" USING btree ("path");
CREATE INDEX "bookmark_user_id_idx" ON "bookmark" USING btree ("user_id");
CREATE INDEX "bookmark_article_id_idx" ON "bookmark" USING btree ("article_id");
CREATE INDEX "comment_article_id_idx" ON "comment" USING btree ("article_id");
CREATE INDEX "comment_user_id_idx" ON "comment" USING btree ("user_id");
CREATE INDEX "comment_path_idx" ON "comment" USING btree ("path");
CREATE INDEX "invite_code_inviter_id_idx" ON "invite_code" USING btree ("inviter_id");
CREATE UNIQUE INDEX "pending_auth_state_idx" ON "pending_auth" USING btree ("state");
CREATE INDEX "pending_auth_expires_at_idx" ON "pending_auth" USING btree ("expires_at");
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");
CREATE INDEX "expires_at_idx" ON "session" USING btree ("expires_at");
CREATE UNIQUE INDEX "user_auth_provider_user_id_idx" ON "user_auth" USING btree ("provider","provider_user_id");
CREATE INDEX "user_auth_user_id_idx" ON "user_auth" USING btree ("user_id");
CREATE INDEX "user_role_inviter_id_idx" ON "user_role" USING btree ("inviter_id");
