package main

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func ping(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "pong",
	})
}

func handleTelegramAuth(c *gin.Context) {
	var req TelegramAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	if botToken == "" {
		botToken = "default-bot-token"
	}

	if !validateTelegramHashSimple(req.Hash, req.UserID, req.AuthDate, botToken) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Telegram hash"})
		return
	}

	user, err := GetOrCreateUser(req.UserID, req.FirstName, req.LastName, req.Username, req.PhotoURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	token, err := GenerateToken(int(user.ID), user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	SetAuthCookie(c, token)

	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
	})
}

func handlePhoneAuth(c *gin.Context) {
	var req PhoneAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.PhoneNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number is required"})
		return
	}

	// Get or create user
	user, err := GetOrCreateUserByPhone(req.PhoneNumber, req.FirstName, req.LastName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create/get user"})
		return
	}

	// Generate JWT token
	token, err := GenerateToken(int(user.ID), user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Set cookie
	SetAuthCookie(c, token)

	// Also return token in response (for flexibility)
	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
	})
}

// User handlers
func handleGetUserMe(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := GetUserByID(uint(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get completed tasks count
	var completedTasksCount int64
	DB.Model(&UserTask{}).Where("user_id = ? AND status = ?", user.ID, "completed").Count(&completedTasksCount)

	c.JSON(http.StatusOK, UserResponse{
		ID:                  int(user.ID),
		Username:            user.Username,
		FirstName:           user.FirstName,
		LastName:            user.LastName,
		PhotoURL:            user.PhotoURL,
		Balance:             user.Balance,
		CurrentStreak:       user.CurrentStreak,
		CompletedTasksCount: int(completedTasksCount),
		Role:                user.Role,
	})
}

func handleUpdateUserMe(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := UpdateUser(uint(userID), req.ResumeLink, req.Stack); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

func handleUploadAvatar(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Create uploads directory if not exists
	uploadDir := "./uploads/avatars"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}

	// Save file
	filename := fmt.Sprintf("%d_%s", userID, file.Filename)
	filepath := fmt.Sprintf("%s/%s", uploadDir, filename)
	if err := c.SaveUploadedFile(file, filepath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Update user photo_url
	// Assuming we serve uploads at /uploads/avatars/
	photoURL := fmt.Sprintf("/uploads/avatars/%s", filename)
	if err := DB.Model(&User{}).Where("id = ?", userID).Update("photo_url", photoURL).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"photo_url": photoURL})
}

// Metrics handler
func handleGetUserMetrics(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	metrics, err := GetUserMetrics(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get metrics"})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

// Task handlers
func handleGetTasks(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	tasks, err := GetTasksWithStatus(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

func handleGetTaskByID(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	taskIDStr := c.Param("id")
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	task, err := GetTaskByID(uint(taskID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Check if user has access (task is available or completed)
	var userTask UserTask
	result := DB.Where("user_id = ? AND task_id = ?", userID, taskID).First(&userTask)

	if result.Error != nil {
		// Check if this is the first task or previous task is completed
		var taskModel Task
		if err := DB.First(&taskModel, taskID).Error; err == nil {
			if taskModel.Position == 0 {
				// First task is always available
				c.JSON(http.StatusOK, task)
				return
			}
			var prevTask Task
			if err := DB.Where("position < ? AND language = ?", taskModel.Position, taskModel.Language).Order("position DESC").First(&prevTask).Error; err == nil {
				var prevUserTask UserTask
				if DB.Where("user_id = ? AND task_id = ? AND status = ?", userID, prevTask.ID, "completed").First(&prevUserTask).Error != nil {
					c.JSON(http.StatusForbidden, gin.H{"error": "Task is locked"})
					return
				}
			}
		}
	}

	c.JSON(http.StatusOK, task)
}

func handleSubmitTask(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	taskIDStr := c.Param("id")
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var req SubmitTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get answer (either from answer field or answer_index)
	answer := req.Answer
	if answer == "" && req.AnswerIndex >= 0 {
		// Get task options and use index
		var task Task
		if err := DB.First(&task, taskID).Error; err == nil && req.AnswerIndex < len(task.Options) {
			answer = task.Options[req.AnswerIndex]
		}
	}

	isCorrect, earned, err := SubmitTaskAnswer(uint(userID), uint(taskID), answer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit answer"})
		return
	}

	// Get updated balance
	var user User
	if err := DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user balance"})
		return
	}

	// Get correct answer
	var task Task
	var correctAnswer string
	if err := DB.First(&task, taskID).Error; err == nil {
		correctAnswer = task.CorrectAnswer
	}

	c.JSON(http.StatusOK, SubmitTaskResponse{
		Success:       isCorrect,
		Earned:        earned,
		NewBalance:    user.Balance,
		CorrectAnswer: correctAnswer,
	})
}

// Shop handlers
func handleGetShopItems(c *gin.Context) {
	items, err := GetShopItems()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch shop items"})
		return
	}

	c.JSON(http.StatusOK, items)
}

func handleBuyItem(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req BuyItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	purchaseID, err := BuyItem(uint(userID), uint(req.ItemID), req.Email)
	if err != nil {
		if err.Error() == "insufficient balance" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
			return
		}
		if err.Error() == "item out of stock" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Item out of stock"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to purchase item"})
		return
	}

	c.JSON(http.StatusOK, BuyItemResponse{
		PurchaseID: purchaseID,
	})
}

func handleGetInventory(c *gin.Context) {
	userID, err := GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	inventory, err := GetUserInventory(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}

	c.JSON(http.StatusOK, inventory)
}

// Admin handlers
func handleRedeemPurchase(c *gin.Context) {
	var req RedeemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	result, err := RedeemPurchase(req.PurchaseID)
	if err != nil {
		if err.Error() == "purchase already redeemed" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Purchase already redeemed"})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Purchase not found"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// Leaderboard handler
func handleGetLeaderboard(c *gin.Context) {
	// Try to get current user ID (optional)
	var currentUserID uint
	userID, err := GetUserIDFromContext(c)
	if err == nil {
		currentUserID = uint(userID)
	}

	leaderboard, err := GetLeaderboard(currentUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, leaderboard)
}

// Admin login handler
func handleAdminLogin(c *gin.Context) {
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Check admin credentials (simple check - in production use proper password hashing)
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		adminPassword = "admin123" // Default for development
	}

	if req.Username != "admin" || req.Password != adminPassword {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Get admin user
	var user User
	if err := DB.Where("username = ? AND role = ?", "admin", "admin").First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Admin user not found"})
		return
	}

	// Generate token
	token, err := GenerateToken(int(user.ID), user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	SetAuthCookie(c, token)
	c.JSON(http.StatusOK, AuthResponse{Token: token})
}

// Admin metrics handler
func handleAdminMetrics(c *gin.Context) {
	var metrics AdminMetricsResponse

	// Total users
	DB.Model(&User{}).Count(&metrics.TotalUsers)

	// Total tasks
	DB.Model(&Task{}).Count(&metrics.TotalTasks)

	// Total completed tasks
	DB.Model(&UserTask{}).Where("status = ?", "completed").Count(&metrics.TotalCompletedTasks)

	// Total purchases
	DB.Model(&Purchase{}).Count(&metrics.TotalPurchases)

	// Total revenue (sum of prices from purchases)
	var totalRevenue struct {
		Total int
	}
	DB.Model(&Purchase{}).
		Joins("JOIN shop_items ON purchases.item_id = shop_items.id").
		Select("COALESCE(SUM(shop_items.price), 0) as total").
		Scan(&totalRevenue)
	metrics.TotalRevenue = totalRevenue.Total

	// Active users today (users who completed a task today)
	today := time.Now().Format("2006-01-02")
	DB.Model(&UserTask{}).
		Where("DATE(completed_at) = ? AND status = ?", today, "completed").
		Distinct("user_id").
		Count(&metrics.ActiveUsersToday)

	// Average tasks per user
	if metrics.TotalUsers > 0 {
		metrics.AvgTasksPerUser = float64(metrics.TotalCompletedTasks) / float64(metrics.TotalUsers)
	}

	c.JSON(http.StatusOK, metrics)
}

// Admin get all users
// Admin get all users
func handleAdminGetUsers(c *gin.Context) {
	var users []User
	if err := DB.Order("created_at DESC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	responses := make([]AdminUserResponse, 0)
	for _, user := range users {
		var completedCount int64
		DB.Model(&UserTask{}).Where("user_id = ? AND status = ?", user.ID, "completed").Count(&completedCount)

		responses = append(responses, AdminUserResponse{
			ID:                  int(user.ID),
			Username:            user.Username,
			FirstName:           user.FirstName,
			LastName:            user.LastName,
			PhoneNumber:         user.PhoneNumber,
			Balance:             user.Balance,
			CurrentStreak:       user.CurrentStreak,
			CompletedTasksCount: int(completedCount),
			Role:                user.Role,
			CreatedAt:           user.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(http.StatusOK, responses)
}

// Admin get all tasks
func handleAdminGetTasks(c *gin.Context) {
	var tasks []Task
	if err := DB.Order("position, language").Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}

	responses := make([]AdminTaskResponse, 0)
	for _, task := range tasks {
		responses = append(responses, AdminTaskResponse{
			ID:            int(task.ID),
			Title:         task.Title,
			Description:   task.Description,
			Type:          task.Type,
			Question:      task.Question,
			Options:       task.Options,
			CorrectAnswer: task.CorrectAnswer,
			Reward:        task.Reward,
			Position:      task.Position,
			Language:      task.Language,
		})
	}

	c.JSON(http.StatusOK, responses)
}

// Admin create task
func handleAdminCreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.Language == "" {
		req.Language = "ru"
	}

	task := Task{
		Title:         req.Title,
		Description:   req.Description,
		Type:          req.Type,
		Question:      req.Question,
		Options:       req.Options,
		CorrectAnswer: req.CorrectAnswer,
		Reward:        req.Reward,
		Position:      req.Position,
		Language:      req.Language,
	}

	if err := DB.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	c.JSON(http.StatusCreated, AdminTaskResponse{
		ID:            int(task.ID),
		Title:         task.Title,
		Description:   task.Description,
		Type:          task.Type,
		Question:      task.Question,
		Options:       task.Options,
		CorrectAnswer: task.CorrectAnswer,
		Reward:        task.Reward,
		Position:      task.Position,
		Language:      task.Language,
	})
}

// Admin update task
func handleAdminUpdateTask(c *gin.Context) {
	taskIDStr := c.Param("id")
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var task Task
	if err := DB.First(&task, taskID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Update fields if provided
	if req.Title != "" {
		task.Title = req.Title
	}
	if req.Description != "" {
		task.Description = req.Description
	}
	if req.Type != "" {
		task.Type = req.Type
	}
	if req.Question != "" {
		task.Question = req.Question
	}
	if len(req.Options) > 0 {
		task.Options = req.Options
	}
	if req.CorrectAnswer != "" {
		task.CorrectAnswer = req.CorrectAnswer
	}
	if req.Reward > 0 {
		task.Reward = req.Reward
	}
	if req.Position > 0 {
		task.Position = req.Position
	}
	if req.Language != "" {
		task.Language = req.Language
	}

	if err := DB.Save(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	c.JSON(http.StatusOK, AdminTaskResponse{
		ID:            int(task.ID),
		Title:         task.Title,
		Description:   task.Description,
		Type:          task.Type,
		Question:      task.Question,
		Options:       task.Options,
		CorrectAnswer: task.CorrectAnswer,
		Reward:        task.Reward,
		Position:      task.Position,
		Language:      task.Language,
	})
}

// Admin delete task
func handleAdminDeleteTask(c *gin.Context) {
	taskIDStr := c.Param("id")
	taskID, err := strconv.Atoi(taskIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	if err := DB.Delete(&Task{}, taskID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	// Also delete related user_tasks
	DB.Where("task_id = ?", taskID).Delete(&UserTask{})

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
