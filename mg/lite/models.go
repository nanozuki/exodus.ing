package lite

/* Sqlite Models to present the database schema like these:
CREATE TABLE `article` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`content_type` text NOT NULL,
	`path` text NOT NULL
);

CREATE UNIQUE INDEX `article_title_idx` ON `article` (`title`,`user_id`);
CREATE INDEX `article_user_id_idx` ON `article` (`user_id`);
CREATE INDEX `article_path_idx` ON `article` (`path`);
CREATE TABLE `bookmark` (
	`user_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer NOT NULL
);

CREATE INDEX `bookmark_user_id_idx` ON `bookmark` (`user_id`);
CREATE INDEX `bookmark_article_id_idx` ON `bookmark` (`article_id`);
CREATE TABLE `comment` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	`article_id` text NOT NULL,
	`content` text NOT NULL
);

CREATE INDEX `comment_article_id_idx` ON `comment` (`article_id`);
CREATE INDEX `comment_user_id_idx` ON `comment` (`user_id`);
CREATE INDEX `comment_path_idx` ON `comment` (`path`);
CREATE TABLE `invite_code` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`role_key` text NOT NULL,
	`inviter_id` text NOT NULL,
	`used_at` integer
);

CREATE UNIQUE INDEX `invite_code_code_unique` ON `invite_code` (`code`);
CREATE INDEX `invite_code_inviter_id_idx` ON `invite_code` (`inviter_id`);
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL
);

CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);
CREATE INDEX `expires_at_idx` ON `session` (`expires_at`);
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`username` text NOT NULL,
	`github_id` integer,
	`name` text NOT NULL,
	`about_me` text NOT NULL
);

CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);
CREATE UNIQUE INDEX `user_github_id_unique` ON `user` (`github_id`);
CREATE UNIQUE INDEX `user_name_unique` ON `user` (`name`);
CREATE TABLE `user_domain` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`domain` text NOT NULL,
	`verify_txt_record` text NOT NULL,
	`verified_at` integer
);

CREATE UNIQUE INDEX `user_domain_domain_unique` ON `user_domain` (`domain`);
CREATE INDEX `user_domain_user_id_idx` ON `user_domain` (`user_id`);
CREATE TABLE `user_role` (
	`user_id` text NOT NULL,
	`role_key` text NOT NULL,
	`invited_at` integer NOT NULL,
	`inviter_id` text,
	PRIMARY KEY(`user_id`, `role_key`)
);

CREATE INDEX `user_role_inviter_id_idx` ON `user_role` (`inviter_id`);
*/

import (
	"gorm.io/driver/sqlite" // Sqlite driver based on CGO
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func OpenDB(path string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	return db, err
}

type Article struct {
	ID          string `gorm:"primaryKey;type:text"`
	CreatedAt   int64  `gorm:"not null;type:integer"`
	UpdatedAt   int64  `gorm:"not null;type:integer"`
	UserID      string `gorm:"not null;type:text"`
	Title       string `gorm:"not null;type:text"`
	Content     string `gorm:"not null;type:text"`
	ContentType string `gorm:"not null;type:text"`
	Path        string `gorm:"not null;type:text"`
}

type Bookmark struct {
	UserID    string `gorm:"not null;type:text"`
	ArticleID string `gorm:"not null;type:text"`
	CreatedAt int64  `gorm:"not null;type:integer"`
}

type Comment struct {
	ID        string `gorm:"primaryKey;type:text"`
	Path      string `gorm:"not null;type:text"`
	CreatedAt int64  `gorm:"not null;type:integer"`
	UpdatedAt int64  `gorm:"not null;type:integer"`
	UserID    string `gorm:"not null;type:text"`
	ArticleID string `gorm:"not null;type:text"`
	Content   string `gorm:"not null;type:text"`
}

type InviteCode struct {
	ID        int64  `gorm:"primaryKey;type:integer"`
	Code      string `gorm:"not null;type:text"`
	RoleKey   string `gorm:"not null;type:text"`
	InviterID string `gorm:"not null;type:text"`
	UsedAt    int64  `gorm:"type:integer"`
}

type Session struct {
	ID        string `gorm:"primaryKey;type:text"`
	UserID    string `gorm:"not null;type:text"`
	ExpiresAt int64  `gorm:"not null;type:integer"`
}

type User struct {
	ID        string `gorm:"primaryKey;type:text"`
	CreatedAt int64  `gorm:"not null;type:integer"`
	UpdatedAt int64  `gorm:"not null;type:integer"`
	Username  string `gorm:"not null;type:text"`
	GithubID  int64  `gorm:"type:integer"`
	Name      string `gorm:"not null;type:text"`
	AboutMe   string `gorm:"not null;type:text"`
}

type UserDomain struct {
	ID              int64  `gorm:"primaryKey;autoincrement;type:integer"`
	UserID          string `gorm:"not null;type:text"`
	Domain          string `gorm:"not null;type:text"`
	VerifyTxtRecord string `gorm:"not null;type:text"`
	VerifiedAt      int64  `gorm:"type:integer"`
}

type UserRole struct {
	UserID    string `gorm:"not null;type:text"`
	RoleKey   string `gorm:"not null;type:text"`
	InvitedAt int64  `gorm:"not null;type:integer"`
	InviterID string `gorm:"type:text"`
}
