package pg

/* PostgreSQL Models to present the database schema like these:
CREATE TABLE "article" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"content_type" text NOT NULL,
	"path" text NOT NULL
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

CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" integer NOT NULL
);

CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"username" text NOT NULL,
	"github_id" integer,
	"name" text NOT NULL,
	"about_me" text NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_github_id_unique" UNIQUE("github_id"),
	CONSTRAINT "user_name_unique" UNIQUE("name")
);

CREATE TABLE "user_domain" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"domain" text NOT NULL,
	"verify_txt_record" text NOT NULL,
	"verified_at" timestamp,
	CONSTRAINT "user_domain_domain_unique" UNIQUE("domain")
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
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");
CREATE INDEX "expires_at_idx" ON "session" USING btree ("expires_at");
CREATE INDEX "user_domain_user_id_idx" ON "user_domain" USING btree ("user_id");
CREATE INDEX "user_role_inviter_id_idx" ON "user_role" USING btree ("inviter_id");
*/

import (
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func OpenDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	return db, err
}

type Article struct {
	ID          string    `gorm:"primaryKey;type:text"`
	CreatedAt   time.Time `gorm:"autoCreateTime;type:timestamp"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime;type:timestamp"`
	UserID      string    `gorm:"not null;type:text"`
	Title       string    `gorm:"not null;type:text"`
	Content     string    `gorm:"not null;type:text"`
	ContentType string    `gorm:"not null;type:text"`
	Path        string    `gorm:"not null;type:text"`
}

type Bookmark struct {
	UserID    string    `gorm:"not null;type:text"`
	ArticleID string    `gorm:"not null;type:text"`
	CreatedAt time.Time `gorm:"autoCreateTime;type:timestamp"`
}

type Comment struct {
	ID        string    `gorm:"primaryKey;type:text"`
	Path      string    `gorm:"not null;type:text"`
	CreatedAt time.Time `gorm:"autoCreateTime;type:timestamp"`
	UpdatedAt time.Time `gorm:"autoUpdateTime;type:timestamp"`
	UserID    string    `gorm:"not null;type:text"`
	ArticleID string    `gorm:"not null;type:text"`
	Content   string    `gorm:"not null;type:text"`
}

type InviteCode struct {
	ID        int64     `gorm:"primaryKey;type:serial"`
	Code      string    `gorm:"not null;type:text;unique"`
	RoleKey   string    `gorm:"not null;type:text"`
	InviterID string    `gorm:"not null;type:text"`
	UsedAt    time.Time `gorm:"type:timestamp"`
}

type Session struct {
	ID        string    `gorm:"primaryKey;type:text"`
	UserID    string    `gorm:"not null;type:text"`
	ExpiresAt time.Time `gorm:"not null;type:timestamp"`
}
type User struct {
	ID        string    `gorm:"primaryKey;type:text"`
	CreatedAt time.Time `gorm:"autoCreateTime;type:timestamp"`
	UpdatedAt time.Time `gorm:"autoUpdateTime;type:timestamp"`
	Username  string    `gorm:"not null;type:text;unique"`
	GithubID  int64     `gorm:"type:integer;unique"`
	Name      string    `gorm:"not null;type:text;unique"`
	AboutMe   string    `gorm:"not null;type:text"`
}
type UserDomain struct {
	ID              int64     `gorm:"primaryKey;type:serial"`
	UserID          string    `gorm:"not null;type:text"`
	Domain          string    `gorm:"not null;type:text;unique"`
	VerifyTxtRecord string    `gorm:"not null;type:text"`
	VerifiedAt      time.Time `gorm:"type:timestamp"`
}

type UserRole struct {
	UserID    string    `gorm:"not null;type:text"`
	RoleKey   string    `gorm:"not null;type:text"`
	InvitedAt time.Time `gorm:"autoCreateTime;type:timestamp"`
	InviterID string    `gorm:"type:text"`
}
