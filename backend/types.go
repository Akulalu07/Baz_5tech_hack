package main

// Auth types
type TelegramAuthRequest struct {
	Hash      string `json:"hash"`
	UserID    int64  `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name,omitempty"`
	Username  string `json:"username,omitempty"`
	PhotoURL  string `json:"photo_url,omitempty"`
	AuthDate  int64  `json:"auth_date"`
}

type PhoneAuthRequest struct {
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	PhoneNumber string `json:"phone_number"`
}

type AuthResponse struct {
	Token string `json:"token"`
}

// User types
type UserResponse struct {
	ID                  int    `json:"id"`
	Username            string `json:"username"`
	FirstName           string `json:"first_name"`
	LastName            string `json:"last_name"`
	PhotoURL            string `json:"photo_url"`
	Balance             int    `json:"balance"`
	CurrentStreak       int    `json:"current_streak"`
	CompletedTasksCount int    `json:"completed_tasks_count"`
	Role                string `json:"role"` // "student" or "admin"
}

type UpdateUserRequest struct {
	ResumeLink string   `json:"resume_link,omitempty"`
	Stack      []string `json:"stack,omitempty"`
}

// Task types
type TaskResponse struct {
	ID       int    `json:"id"`
	Title    string `json:"title"`
	Type     string `json:"type"`   // "quiz" or "code"
	Status   string `json:"status"` // "locked", "available", "completed"
	Reward   int    `json:"reward"`
	Position int    `json:"position"`
}

type QuestionItemResponse struct {
	Type          string   `json:"type"`
	Text          string   `json:"text"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer,omitempty"`
}

type TaskDetailResponse struct {
	ID            int                    `json:"id"`
	Question      string                 `json:"question"`
	Options       []string               `json:"options"`
	Type          string                 `json:"type"`
	Questions     []QuestionItemResponse `json:"questions,omitempty"`
	CorrectAnswer string                 `json:"correct_answer,omitempty"`
}

type SubmitTaskRequest struct {
	Answer      string `json:"answer,omitempty"`
	AnswerIndex int    `json:"answer_index,omitempty"`
}

type SubmitTaskResponse struct {
	Success       bool   `json:"success"`
	Earned        int    `json:"earned"`
	NewBalance    int    `json:"new_balance"`
	CorrectAnswer string `json:"correct_answer"`
}

// Shop types
type ShopItemResponse struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Price       int    `json:"price"`
	Image       string `json:"image"`
	Stock       int    `json:"stock"`
	Description string `json:"description,omitempty"`
}

type BuyItemRequest struct {
	ItemID int    `json:"item_id"`
	Email  string `json:"email"`
}

type BuyItemResponse struct {
	PurchaseID string `json:"purchase_id"`
}

type InventoryItemResponse struct {
	ID          int    `json:"id"`
	ItemID      int    `json:"item_id"`
	ItemName    string `json:"item_name"`
	PurchaseID  string `json:"purchase_id"`
	Status      string `json:"status"` // "pending" or "redeemed"
	PurchasedAt string `json:"purchased_at"`
}

// Admin types
type RedeemRequest struct {
	PurchaseID string `json:"purchase_id"`
}

type RedeemResponse struct {
	Success bool   `json:"success"`
	Item    string `json:"item"`
	User    string `json:"user"`
}

// Leaderboard types
type LeaderboardEntry struct {
	Rank                int    `json:"rank"`
	UserID              int    `json:"user_id"`
	Username            string `json:"username"`
	Balance             int    `json:"balance"`
	CompletedTasksCount int    `json:"completed_tasks_count"`
	CurrentStreak       int    `json:"current_streak"`
}

type LeaderboardResponse struct {
	TopUsers    []LeaderboardEntry `json:"top_users"`
	CurrentUser *LeaderboardEntry  `json:"current_user,omitempty"`
}

// Admin types for dashboard
type AdminMetricsResponse struct {
	TotalUsers          int64   `json:"total_users"`
	TotalTasks          int64   `json:"total_tasks"`
	TotalCompletedTasks int64   `json:"total_completed_tasks"`
	TotalPurchases      int64   `json:"total_purchases"`
	TotalRevenue        int     `json:"total_revenue"` // sum of all spent coins
	ActiveUsersToday    int64   `json:"active_users_today"`
	AvgTasksPerUser     float64 `json:"avg_tasks_per_user"`
}

type AdminUserResponse struct {
	ID                  int    `json:"id"`
	Username            string `json:"username"`
	FirstName           string `json:"first_name"`
	LastName            string `json:"last_name"`
	PhoneNumber         string `json:"phone_number"`
	Balance             int    `json:"balance"`
	CurrentStreak       int    `json:"current_streak"`
	CompletedTasksCount int    `json:"completed_tasks_count"`
	Role                string `json:"role"`
	CreatedAt           string `json:"created_at"`
}

type AdminTaskResponse struct {
	ID            int      `json:"id"`
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	Type          string   `json:"type"`
	Question      string   `json:"question"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer"`
	Reward        int      `json:"reward"`
	Position      int      `json:"position"`
	Language      string   `json:"language"`
}

type CreateTaskRequest struct {
	Title         string   `json:"title" binding:"required"`
	Description   string   `json:"description"`
	Type          string   `json:"type" binding:"required"`
	Question      string   `json:"question"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer"`
	Reward        int      `json:"reward" binding:"required"`
	Position      int      `json:"position"`
	Language      string   `json:"language"`
}

type UpdateTaskRequest struct {
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	Type          string   `json:"type"`
	Question      string   `json:"question"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer"`
	Reward        int      `json:"reward"`
	Position      int      `json:"position"`
	Language      string   `json:"language"`
}

type AdminLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}
