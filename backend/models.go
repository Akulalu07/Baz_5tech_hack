package main

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// StringArray is a custom type for handling string arrays in Postgres
type StringArray []string

// Scan implements the sql.Scanner interface
func (a *StringArray) Scan(value interface{}) error {
	var str string
	switch v := value.(type) {
	case []byte:
		str = string(v)
	case string:
		str = v
	default:
		return errors.New("type assertion to []byte or string failed")
	}

	// Handle Postgres array format {val1,val2}
	// This is a basic parser. For production, use a proper parser.
	str = strings.Trim(str, "{}")
	if str == "" {
		*a = StringArray{}
		return nil
	}

	// Split by comma, assuming no commas in values for now
	// If values are quoted like {"val 1", "val 2"}, we need to handle quotes
	// But for simple options, split is fine.
	// A slightly better way:
	parts := strings.Split(str, ",")
	var result StringArray
	for _, p := range parts {
		// Remove quotes if present (Postgres adds quotes if needed)
		p = strings.Trim(p, "\"")
		result = append(result, p)
	}
	*a = result
	return nil
}

// Value implements the driver.Valuer interface
func (a StringArray) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "{}", nil
	}

	// Construct Postgres array string: {val1,val2}
	// We should quote values to be safe
	var parts []string
	for _, s := range a {
		// Escape quotes in string
		escaped := strings.ReplaceAll(s, "\"", "\\\"")
		parts = append(parts, fmt.Sprintf("\"%s\"", escaped))
	}

	return fmt.Sprintf("{%s}", strings.Join(parts, ",")), nil
}

// User model
type User struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	TelegramID    *int64      `gorm:"uniqueIndex" json:"telegram_id"`
	PhoneNumber   string      `gorm:"uniqueIndex" json:"phone_number"`
	Username      string      `gorm:"type:varchar(255)" json:"username"`
	FirstName     string      `gorm:"type:varchar(255)" json:"first_name"`
	LastName      string      `gorm:"type:varchar(255)" json:"last_name"`
	PhotoURL      string      `gorm:"type:text" json:"photo_url"`
	Balance       int         `gorm:"default:0" json:"balance"`
	CurrentStreak int         `gorm:"default:0" json:"current_streak"`
	LastTaskDate  *time.Time  `gorm:"type:date" json:"last_task_date"`
	Role          string      `gorm:"type:varchar(50);default:student" json:"role"`
	ResumeLink    string      `gorm:"type:text" json:"resume_link"`
	Stack         StringArray `gorm:"type:text[]" json:"stack"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
}

type QuestionItem struct {
	Type          string   `json:"type"` // "choice" or "text"
	Text          string   `json:"text"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer"`
}

// Task model
type Task struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Title         string         `gorm:"type:varchar(255);not null" json:"title"`
	Description   string         `gorm:"type:text" json:"description"`
	Type          string         `gorm:"type:varchar(50);not null" json:"type"`
	Question      string         `gorm:"type:text" json:"question"`
	Options       StringArray    `gorm:"type:text[]" json:"options"`
	CorrectAnswer string         `gorm:"type:text" json:"correct_answer"`
	Questions     []QuestionItem `gorm:"type:jsonb;serializer:json" json:"questions"`
	Reward        int            `gorm:"not null" json:"reward"`
	Position      int            `gorm:"not null" json:"position"`
	Language      string         `gorm:"type:varchar(10);default:'en'" json:"language"`
	CreatedAt     time.Time      `json:"created_at"`
}

// UserTask model (progress tracking)
type UserTask struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	UserID      uint       `gorm:"not null;index" json:"user_id"`
	TaskID      uint       `gorm:"not null;index" json:"task_id"`
	Status      string     `gorm:"type:varchar(50);default:locked" json:"status"`
	CompletedAt *time.Time `json:"completed_at"`
	Earned      int        `gorm:"default:0" json:"earned"`
	User        User       `gorm:"foreignKey:UserID" json:"-"`
	Task        Task       `gorm:"foreignKey:TaskID" json:"-"`
}

// TableName specifies the table name for UserTask
func (UserTask) TableName() string {
	return "user_tasks"
}

// ShopItem model
type ShopItem struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Price       int       `gorm:"not null" json:"price"`
	Image       string    `gorm:"type:text" json:"image"`
	Stock       int       `gorm:"default:0" json:"stock"`
	CreatedAt   time.Time `json:"created_at"`
}

// Purchase model
type Purchase struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	UserID      uint       `gorm:"not null;index" json:"user_id"`
	ItemID      uint       `gorm:"not null;index" json:"item_id"`
	PurchaseID  string     `gorm:"type:uuid;uniqueIndex;not null" json:"purchase_id"`
	Status      string     `gorm:"type:varchar(50);default:pending" json:"status"`
	Email       string     `gorm:"type:varchar(255)" json:"email"`
	PurchasedAt time.Time  `json:"purchased_at"`
	RedeemedAt  *time.Time `json:"redeemed_at"`
	User        User       `gorm:"foreignKey:UserID" json:"-"`
	Item        ShopItem   `gorm:"foreignKey:ItemID" json:"-"`
}

// Database operations using GORM

// GetOrCreateUser gets user by telegram_id or creates a new one
func GetOrCreateUser(telegramID int64, firstName, lastName, username, photoURL string) (*User, error) {
	var user User
	result := DB.Where("telegram_id = ?", telegramID).First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		// Create new user
		user = User{
			TelegramID: &telegramID,
			Username:   username,
			FirstName:  firstName,
			LastName:   lastName,
			PhotoURL:   photoURL,
			Role:       "student",
		}
		if err := DB.Create(&user).Error; err != nil {
			return nil, err
		}
	} else if result.Error != nil {
		return nil, result.Error
	}

	return &user, nil
}

// GetOrCreateUserByPhone gets user by phone number or creates a new one
func GetOrCreateUserByPhone(phoneNumber, firstName, lastName string) (*User, error) {
	var user User
	result := DB.Where("phone_number = ?", phoneNumber).First(&user)

	if result.Error == gorm.ErrRecordNotFound {
		// Create new user
		user = User{
			PhoneNumber: phoneNumber,
			FirstName:   firstName,
			LastName:    lastName,
			Username:    firstName + "_" + lastName, // Simple default username
			Role:        "student",
		}
		if err := DB.Create(&user).Error; err != nil {
			return nil, err
		}
	} else if result.Error != nil {
		return nil, result.Error
	}

	return &user, nil
}

// GetUserByID gets user by ID
func GetUserByID(userID uint) (*User, error) {
	var user User
	if err := DB.First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUser updates user profile
func UpdateUser(userID uint, resumeLink string, stack []string) error {
	return DB.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"resume_link": resumeLink,
		"stack":       stack,
	}).Error
}

// GetTasksWithStatus gets all tasks with their status for a user (filtered by language)
func GetTasksWithStatus(userID uint) ([]TaskResponse, error) {
	var tasks []Task
	// Filter by Russian language only to avoid duplicates
	if err := DB.Where("language = ?", "ru").Order("position").Find(&tasks).Error; err != nil {
		return nil, err
	}

	var responses []TaskResponse
	for _, task := range tasks {
		var userTask UserTask
		result := DB.Where("user_id = ? AND task_id = ?", userID, task.ID).First(&userTask)

		status := "locked"
		if result.Error == nil {
			status = userTask.Status
		} else {
			// Check if this is the first task or previous task is completed
			if task.Position == 0 {
				// First task is always available
				status = "available"
			} else {
				// Check if previous task is completed (same language)
				var prevTask Task
				if err := DB.Where("position < ? AND language = ?", task.Position, "ru").Order("position DESC").First(&prevTask).Error; err == nil {
					var prevUserTask UserTask
					if DB.Where("user_id = ? AND task_id = ? AND status = ?", userID, prevTask.ID, "completed").First(&prevUserTask).Error == nil {
						status = "available"
					}
				}
			}
		}

		responses = append(responses, TaskResponse{
			ID:       int(task.ID),
			Title:    task.Title,
			Type:     task.Type,
			Status:   status,
			Reward:   task.Reward,
			Position: task.Position,
		})
	}

	return responses, nil
}

// GetTaskByID gets task details by ID
func GetTaskByID(taskID uint) (*TaskDetailResponse, error) {
	var task Task
	if err := DB.First(&task, taskID).Error; err != nil {
		return nil, err
	}

	// Convert QuestionItem to QuestionItemResponse
	var questions []QuestionItemResponse
	for _, q := range task.Questions {
		questions = append(questions, QuestionItemResponse{
			Type:          q.Type,
			Text:          q.Text,
			Options:       q.Options,
			CorrectAnswer: q.CorrectAnswer,
		})
	}

	return &TaskDetailResponse{
		ID:            int(task.ID),
		Question:      task.Question,
		Options:       task.Options,
		Type:          task.Type,
		Questions:     questions,
		CorrectAnswer: task.CorrectAnswer,
	}, nil
}

// SubmitTaskAnswer submits task answer and updates user progress
func SubmitTaskAnswer(userID, taskID uint, answer string) (bool, int, error) {
	var task Task
	if err := DB.First(&task, taskID).Error; err != nil {
		return false, 0, err
	}

	isCorrect := answer == task.CorrectAnswer
	if task.Type == "survey" {
		isCorrect = true
	}
	earned := 0

	if isCorrect {
		earned = task.Reward

		// Start transaction
		tx := DB.Begin()
		defer func() {
			if r := recover(); r != nil {
				tx.Rollback()
			}
		}()

		// Update user balance
		if err := tx.Model(&User{}).Where("id = ?", userID).UpdateColumn("balance", gorm.Expr("balance + ?", earned)).Error; err != nil {
			tx.Rollback()
			return false, 0, err
		}

		// Update streak
		var user User
		if err := tx.First(&user, userID).Error; err != nil {
			tx.Rollback()
			return false, 0, err
		}

		now := time.Now()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

		if user.LastTaskDate != nil {
			lastDate := time.Date(user.LastTaskDate.Year(), user.LastTaskDate.Month(), user.LastTaskDate.Day(), 0, 0, 0, 0, user.LastTaskDate.Location())
			daysDiff := int(today.Sub(lastDate).Hours() / 24)

			if daysDiff == 1 {
				// Consecutive day
				if err := tx.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{
					"current_streak": gorm.Expr("current_streak + 1"),
					"last_task_date": today,
				}).Error; err != nil {
					tx.Rollback()
					return false, 0, err
				}
			} else if daysDiff > 1 {
				// Streak broken, reset to 1
				if err := tx.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{
					"current_streak": 1,
					"last_task_date": today,
				}).Error; err != nil {
					tx.Rollback()
					return false, 0, err
				}
			}
		} else {
			// First task
			if err := tx.Model(&User{}).Where("id = ?", userID).Updates(map[string]interface{}{
				"current_streak": 1,
				"last_task_date": today,
			}).Error; err != nil {
				tx.Rollback()
				return false, 0, err
			}
		}

		// Update or create user_task
		nowTime := time.Now()
		userTask := UserTask{
			UserID:      userID,
			TaskID:      taskID,
			Status:      "completed",
			CompletedAt: &nowTime,
			Earned:      earned,
		}

		if err := tx.Where("user_id = ? AND task_id = ?", userID, taskID).
			Assign(map[string]interface{}{
				"status":       "completed",
				"completed_at": &nowTime,
				"earned":       earned,
			}).
			FirstOrCreate(&userTask).Error; err != nil {
			tx.Rollback()
			return false, 0, err
		}

		if err := tx.Commit().Error; err != nil {
			return false, 0, err
		}
	}

	return isCorrect, earned, nil
}

// GetShopItems gets all shop items
func GetShopItems() ([]ShopItemResponse, error) {
	var items []ShopItem
	if err := DB.Order("id").Find(&items).Error; err != nil {
		return nil, err
	}

	var responses []ShopItemResponse
	for _, item := range items {
		responses = append(responses, ShopItemResponse{
			ID:          int(item.ID),
			Name:        item.Name,
			Description: item.Description,
			Price:       item.Price,
			Image:       item.Image,
			Stock:       item.Stock,
		})
	}

	return responses, nil
}

// BuyItem creates a purchase
func BuyItem(userID, itemID uint, email string) (string, error) {
	tx := DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Check user balance and item stock
	var user User
	if err := tx.First(&user, userID).Error; err != nil {
		tx.Rollback()
		return "", err
	}

	var item ShopItem
	if err := tx.First(&item, itemID).Error; err != nil {
		tx.Rollback()
		return "", err
	}

	if user.Balance < item.Price {
		tx.Rollback()
		return "", fmt.Errorf("insufficient balance")
	}

	if item.Stock <= 0 {
		tx.Rollback()
		return "", fmt.Errorf("item out of stock")
	}

	// Deduct balance
	if err := tx.Model(&User{}).Where("id = ?", userID).UpdateColumn("balance", gorm.Expr("balance - ?", item.Price)).Error; err != nil {
		tx.Rollback()
		return "", err
	}

	// Decrease stock
	if err := tx.Model(&ShopItem{}).Where("id = ?", itemID).UpdateColumn("stock", gorm.Expr("stock - 1")).Error; err != nil {
		tx.Rollback()
		return "", err
	}

	// Create purchase
	purchaseID := uuid.New().String()
	purchase := Purchase{
		UserID:     userID,
		ItemID:     itemID,
		PurchaseID: purchaseID,
		Status:     "pending",
		Email:      email,
	}

	if err := tx.Create(&purchase).Error; err != nil {
		tx.Rollback()
		return "", err
	}

	if err := tx.Commit().Error; err != nil {
		return "", err
	}

	return purchaseID, nil
}

// GetUserInventory gets user's purchases
func GetUserInventory(userID uint) ([]InventoryItemResponse, error) {
	var purchases []Purchase
	if err := DB.Where("user_id = ?", userID).
		Preload("Item").
		Order("purchased_at DESC").
		Find(&purchases).Error; err != nil {
		return nil, err
	}

	var inventory []InventoryItemResponse
	for _, purchase := range purchases {
		inventory = append(inventory, InventoryItemResponse{
			ID:          int(purchase.ID),
			ItemID:      int(purchase.ItemID),
			ItemName:    purchase.Item.Name,
			PurchaseID:  purchase.PurchaseID,
			Status:      purchase.Status,
			PurchasedAt: purchase.PurchasedAt.Format(time.RFC3339),
		})
	}

	return inventory, nil
}

// RedeemPurchase redeems a purchase (admin only)
func RedeemPurchase(purchaseID string) (*RedeemResponse, error) {
	tx := DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var purchase Purchase
	if err := tx.Where("purchase_id = ?", purchaseID).
		Preload("Item").
		Preload("User").
		First(&purchase).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if purchase.Status == "redeemed" {
		tx.Rollback()
		return nil, fmt.Errorf("purchase already redeemed")
	}

	now := time.Now()
	if err := tx.Model(&purchase).Updates(map[string]interface{}{
		"status":      "redeemed",
		"redeemed_at": &now,
	}).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	userName := purchase.User.FirstName
	if purchase.User.LastName != "" {
		userName += " " + purchase.User.LastName
	}

	return &RedeemResponse{
		Success: true,
		Item:    purchase.Item.Name,
		User:    userName,
	}, nil
}

// GetLeaderboard gets top users and current user position
func GetLeaderboard(currentUserID uint) (*LeaderboardResponse, error) {
	// Get top 20 users
	var users []User
	if err := DB.Order("balance DESC, (SELECT COUNT(*) FROM user_tasks WHERE user_tasks.user_id = users.id AND user_tasks.status = 'completed') DESC").
		Limit(20).
		Find(&users).Error; err != nil {
		return nil, err
	}

	var topUsers []LeaderboardEntry
	for rank, user := range users {
		var completedTasksCount int64
		DB.Model(&UserTask{}).Where("user_id = ? AND status = ?", user.ID, "completed").Count(&completedTasksCount)

		topUsers = append(topUsers, LeaderboardEntry{
			Rank:                rank + 1,
			UserID:              int(user.ID),
			Username:            user.Username,
			Balance:             user.Balance,
			CompletedTasksCount: int(completedTasksCount),
			CurrentStreak:       user.CurrentStreak,
		})
	}

	// Get current user position
	var currentUser *LeaderboardEntry
	if currentUserID > 0 {
		var user User
		if err := DB.First(&user, currentUserID).Error; err == nil {
			var userRank int64
			DB.Model(&User{}).
				Where("balance > ? OR (balance = ? AND id < ?)", user.Balance, user.Balance, user.ID).
				Count(&userRank)

			var completedTasksCount int64
			DB.Model(&UserTask{}).Where("user_id = ? AND status = ?", user.ID, "completed").Count(&completedTasksCount)

			currentUser = &LeaderboardEntry{
				Rank:                int(userRank) + 1,
				UserID:              int(user.ID),
				Username:            user.Username,
				Balance:             user.Balance,
				CompletedTasksCount: int(completedTasksCount),
				CurrentStreak:       user.CurrentStreak,
			}
		}
	}

	return &LeaderboardResponse{
		TopUsers:    topUsers,
		CurrentUser: currentUser,
	}, nil
}

// GetUserMetrics gets detailed user metrics
func GetUserMetrics(userID uint) (map[string]interface{}, error) {
	var user User
	if err := DB.First(&user, userID).Error; err != nil {
		return nil, err
	}

	var completedTasksCount int64
	DB.Model(&UserTask{}).Where("user_id = ? AND status = ?", userID, "completed").Count(&completedTasksCount)

	var totalEarned int
	DB.Model(&UserTask{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(earned), 0)").
		Scan(&totalEarned)

	var totalSpent int
	DB.Model(&Purchase{}).
		Joins("JOIN shop_items ON purchases.item_id = shop_items.id").
		Where("purchases.user_id = ?", userID).
		Select("COALESCE(SUM(shop_items.price), 0)").
		Scan(&totalSpent)

	var itemsPurchased int64
	DB.Model(&Purchase{}).Where("user_id = ?", userID).Count(&itemsPurchased)

	var itemsRedeemed int64
	DB.Model(&Purchase{}).Where("user_id = ? AND status = ?", userID, "redeemed").Count(&itemsRedeemed)

	metrics := map[string]interface{}{
		"user_id":               user.ID,
		"username":              user.Username,
		"balance":               user.Balance,
		"current_streak":        user.CurrentStreak,
		"completed_tasks_count": completedTasksCount,
		"total_earned":          totalEarned,
		"total_spent":           totalSpent,
		"items_purchased":       itemsPurchased,
		"items_redeemed":        itemsRedeemed,
		"net_balance":           totalEarned - totalSpent,
	}

	return metrics, nil
}
