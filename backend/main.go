package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	if err := InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer CloseDB()

	r := gin.Default()

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// Health check
	r.GET("/ping", ping)

	// Static files
	r.Static("/uploads", "./uploads")

	// API routes
	api := r.Group("/api")
	{
		// Auth routes (no auth required)
		auth := api.Group("/auth")
		{
			auth.POST("/telegram", handleTelegramAuth)
			auth.POST("/phone", handlePhoneAuth)
		}

		// User routes (auth required)
		user := api.Group("/user")
		user.Use(AuthMiddleware())
		{
			user.GET("/me", handleGetUserMe)
			user.PUT("/me", handleUpdateUserMe)
			user.POST("/avatar", handleUploadAvatar)
			user.GET("/inventory", handleGetInventory)
			user.GET("/metrics", handleGetUserMetrics) // New metrics endpoint
		}

		// Task routes (auth required)
		tasks := api.Group("/tasks")
		tasks.Use(AuthMiddleware())
		{
			tasks.GET("", handleGetTasks)
			tasks.GET("/:id", handleGetTaskByID)
			tasks.POST("/:id/submit", handleSubmitTask)
		}

		// Shop routes
		shop := api.Group("/shop")
		{
			shop.GET("/items", handleGetShopItems)             // Public endpoint
			shop.POST("/buy", AuthMiddleware(), handleBuyItem) // Auth required
		}

		// Admin routes (auth + admin role required)
		admin := api.Group("/admin")
		admin.Use(AuthMiddleware(), AdminMiddleware())
		{
			admin.POST("/redeem", handleRedeemPurchase)
			admin.GET("/metrics", handleAdminMetrics)
			admin.GET("/users", handleAdminGetUsers)
			admin.GET("/tasks", handleAdminGetTasks)
			admin.POST("/tasks", handleAdminCreateTask)
			admin.PUT("/tasks/:id", handleAdminUpdateTask)
			admin.DELETE("/tasks/:id", handleAdminDeleteTask)
		}

		// Admin login (no auth required)
		api.POST("/admin/login", handleAdminLogin)

		// Leaderboard route (optional auth - works with or without)
		api.GET("/leaderboard", handleGetLeaderboard)
	}

	r.Run(":8080")
}
