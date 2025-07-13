package main

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"github.com/nanozuki/exodus.ing/mg/lite"
	"github.com/nanozuki/exodus.ing/mg/pg"
	"gorm.io/gorm"
)

// migrate data from sqlite to postgres
func main() {
	sqliteDB, err := lite.OpenDB("../database.sqlite")
	if err != nil {
		panic(err)
	}
	pgDB, err := pg.OpenDB("host=localhost user=postgres password=mysecretpassword dbname=postgres port=5432 sslmode=disable")
	if err != nil {
		panic(err)
	}
	if err := migrateData(sqliteDB, pgDB); err != nil {
		panic(err)
	}
}

func migrateData(sqliteDB, pgDB *gorm.DB) error {
	if err := migrateUser(sqliteDB, pgDB); err != nil {
		return err
	}
	if err := migrateUserRole(sqliteDB, pgDB); err != nil {
		return err
	}
	if err := migrateSession(sqliteDB, pgDB); err != nil {
		return err
	}
	if err := migrateInviteCode(sqliteDB, pgDB); err != nil {
		return err
	}
	if err := migrateArticle(sqliteDB, pgDB); err != nil {
		return err
	}
	if err := migrateBookmark(sqliteDB, pgDB); err != nil {
		return err
	}
	if err := migrateComment(sqliteDB, pgDB); err != nil {
		return err
	}
	return nil
}

const verifyCodeLetters = "0123456789abcdefghijklmnopqrstuvwxyz"

// generateVerifyCode generates a random 32-character crypto alphanumeric string
func generateVerifyCode() string {
	code := make([]byte, 32)
	for i := range code {
		n, err := rand.Int(rand.Reader, big.NewInt(36))
		if err != nil {
			panic(err) // handle error appropriately in production code
		}
		code[i] = verifyCodeLetters[n.Int64()]
	}
	return string(code)
}

func migrateUser(sqliteDB, pgDB *gorm.DB) error {
	// migrate liteUsers
	var liteUsers []lite.User
	var pgUsers []pg.User
	if err := sqliteDB.Find(&liteUsers).Order("created_at").Error; err != nil {
		return fmt.Errorf("failed to find lite users: %w", err)
	}
	for _, liteUser := range liteUsers {
		pgUser := pg.User{
			ID:         liteUser.ID,
			CreatedAt:  time.UnixMilli(liteUser.CreatedAt).UTC(),
			UpdatedAt:  time.UnixMilli(liteUser.UpdatedAt).UTC(),
			Username:   liteUser.Username,
			GithubID:   liteUser.GithubID,
			Name:       liteUser.Name,
			AboutMe:    liteUser.AboutMe,
			VerifyCode: generateVerifyCode(),
		}
		pgUsers = append(pgUsers, pgUser)
	}
	if err := pgDB.Create(&pgUsers).Error; err != nil {
		return fmt.Errorf("failed to create pg users: %w", err)
	}
	return nil
}

func migrateUserRole(sqliteDB, pgDB *gorm.DB) error {
	var liteUserRoles []lite.UserRole
	var pgUserRoles []pg.UserRole
	if err := sqliteDB.Find(&liteUserRoles).Order("invited_at").Error; err != nil {
		return fmt.Errorf("failed to find lite user roles: %w", err)
	}
	for _, liteUserRole := range liteUserRoles {
		pgUserRole := pg.UserRole{
			UserID:    liteUserRole.UserID,
			RoleKey:   liteUserRole.RoleKey,
			InvitedAt: time.UnixMilli(liteUserRole.InvitedAt).UTC(),
			InviterID: liteUserRole.InviterID,
		}
		pgUserRoles = append(pgUserRoles, pgUserRole)
	}
	if err := pgDB.Create(&pgUserRoles).Error; err != nil {
		return fmt.Errorf("failed to create pg user roles: %w", err)
	}
	return nil
}

func migrateSession(sqliteDB, pgDB *gorm.DB) error {
	var liteSessions []lite.Session
	var pgSessions []pg.Session
	if err := sqliteDB.Find(&liteSessions).Order("expires_at").Error; err != nil {
		return fmt.Errorf("failed to find lite sessions: %w", err)
	}
	for _, liteSession := range liteSessions {
		pgSession := pg.Session{
			ID:        liteSession.ID,
			UserID:    liteSession.UserID,
			ExpiresAt: time.Unix(liteSession.ExpiresAt, 0).UTC(),
		}
		pgSessions = append(pgSessions, pgSession)
	}
	if err := pgDB.Create(&pgSessions).Error; err != nil {
		return fmt.Errorf("failed to create pg sessions: %w", err)
	}
	return nil
}

func migrateInviteCode(sqliteDB, pgDB *gorm.DB) error {
	var liteInviteCodes []lite.InviteCode
	var pgInviteCodes []pg.InviteCode
	if err := sqliteDB.Find(&liteInviteCodes).Error; err != nil {
		return fmt.Errorf("failed to find lite invite codes: %w", err)
	}
	for _, liteInviteCode := range liteInviteCodes {
		pgInviteCode := pg.InviteCode{
			Code:      liteInviteCode.Code,
			RoleKey:   liteInviteCode.RoleKey,
			InviterID: liteInviteCode.InviterID,
			UsedAt:    time.UnixMilli(liteInviteCode.UsedAt).UTC(),
		}
		pgInviteCodes = append(pgInviteCodes, pgInviteCode)
	}
	if err := pgDB.Create(&pgInviteCodes).Error; err != nil {
		return fmt.Errorf("failed to create pg invite codes: %w", err)
	}
	return nil
}

func migrateArticle(sqliteDB, pgDB *gorm.DB) error {
	var liteArticles []lite.Article
	var pgArticles []pg.Article
	if err := sqliteDB.Find(&liteArticles).Order("created_at").Error; err != nil {
		return fmt.Errorf("failed to find lite articles: %w", err)
	}
	for _, liteArticle := range liteArticles {
		pgArticle := pg.Article{
			ID:          liteArticle.ID,
			CreatedAt:   time.UnixMilli(liteArticle.CreatedAt).UTC(),
			UpdatedAt:   time.UnixMilli(liteArticle.UpdatedAt).UTC(),
			UserID:      liteArticle.UserID,
			Title:       liteArticle.Title,
			Content:     liteArticle.Content,
			ContentType: liteArticle.ContentType,
			Path:        liteArticle.Path,
		}
		pgArticles = append(pgArticles, pgArticle)
	}
	if err := pgDB.Create(&pgArticles).Error; err != nil {
		return fmt.Errorf("failed to create pg articles: %w", err)
	}
	return nil
}

func migrateBookmark(sqliteDB, pgDB *gorm.DB) error {
	var liteBookmarks []lite.Bookmark
	var pgBookmarks []pg.Bookmark
	if err := sqliteDB.Find(&liteBookmarks).Order("created_at").Error; err != nil {
		return fmt.Errorf("failed to find lite bookmarks: %w", err)
	}
	for _, liteBookmark := range liteBookmarks {
		pgBookmark := pg.Bookmark{
			UserID:    liteBookmark.UserID,
			ArticleID: liteBookmark.ArticleID,
			CreatedAt: time.UnixMilli(liteBookmark.CreatedAt).UTC(),
		}
		pgBookmarks = append(pgBookmarks, pgBookmark)
	}
	if err := pgDB.Create(&pgBookmarks).Error; err != nil {
		return fmt.Errorf("failed to create pg bookmarks: %w", err)
	}
	return nil
}

func migrateComment(sqliteDB, pgDB *gorm.DB) error {
	var liteComments []lite.Comment
	var pgComments []pg.Comment
	if err := sqliteDB.Find(&liteComments).Order("created_at").Error; err != nil {
		return fmt.Errorf("failed to find lite comments: %w", err)
	}
	for _, liteComment := range liteComments {
		pgComment := pg.Comment{
			ID:        liteComment.ID,
			Path:      liteComment.Path,
			CreatedAt: time.UnixMilli(liteComment.CreatedAt).UTC(),
			UpdatedAt: time.UnixMilli(liteComment.UpdatedAt).UTC(),
			UserID:    liteComment.UserID,
			ArticleID: liteComment.ArticleID,
			Content:   liteComment.Content,
		}
		pgComments = append(pgComments, pgComment)
	}
	if err := pgDB.Create(&pgComments).Error; err != nil {
		return fmt.Errorf("failed to create pg comments: %w", err)
	}
	return nil
}
