package main

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://postgres:postgres@localhost:5432/hackathon?sslmode=disable"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := autoMigrate(); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	if err := seedData(); err != nil {
		log.Printf("Failed to seed data: %v", err)
	}

	return nil
}

func autoMigrate() error {
	if err := DB.AutoMigrate(
		&User{},
		&Task{},
		&UserTask{},
		&ShopItem{},
		&Purchase{},
	); err != nil {
		return err
	}

	if !DB.Migrator().HasIndex(&UserTask{}, "idx_user_task") {
		DB.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_task ON user_tasks(user_id, task_id)")
	}

	return nil
}

func CloseDB() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}

func seedData() error {
	tasks := []Task{
		{
			Title:         "Survey: Profile",
			Description:   "Tell us about yourself",
			Type:          "survey",
			Question:      "Let's get to know you",
			Options:       StringArray{"Start"},
			CorrectAnswer: "",
			Questions: []QuestionItem{
				{
					Type:    "text",
					Text:    "Which university do you attend?",
					Options: []string{},
				},
				{
					Type:    "choice",
					Text:    "What is your field of study?",
					Options: []string{"Computer Science", "Engineering", "Mathematics", "Physics", "Other"},
				},
				{
					Type:    "choice",
					Text:    "Which internship program are you interested in?",
					Options: []string{"Frontend Development", "Backend Development", "Data Science", "DevOps", "QA"},
				},
			},
			Reward:   50,
			Position: 0,
			Language: "en",
		},
		{
			Title:         "Level 1: Basics",
			Description:   "Learn the basics of Go",
			Type:          "quiz",
			Question:      "What is the keyword to define a variable in Go?",
			Options:       StringArray{"var", "let", "const", "def"},
			CorrectAnswer: "var",
			Reward:        100,
			Position:      1,
			Language:      "en",
		},
		{
			Title:         "Level 2: Functions",
			Description:   "Understanding functions",
			Type:          "quiz",
			Question:      "How do you define a function in Go?",
			Options:       StringArray{"func", "function", "def", "fn"},
			CorrectAnswer: "func",
			Reward:        150,
			Position:      2,
			Language:      "en",
		},
		{
			Title:         "Level 3: Structs",
			Description:   "Working with structs",
			Type:          "quiz",
			Question:      "Which keyword is used to define a struct?",
			Options:       StringArray{"struct", "class", "object", "type"},
			CorrectAnswer: "type",
			Reward:        200,
			Position:      3,
			Language:      "en",
		},
		{
			Title:         "Level 4: Interfaces",
			Description:   "Go Interfaces",
			Type:          "quiz",
			Question:      "Are interfaces implicit or explicit in Go?",
			Options:       StringArray{"Implicit", "Explicit", "Both", "None"},
			CorrectAnswer: "Implicit",
			Reward:        250,
			Position:      4,
			Language:      "en",
		},

		{
			Title:         "Опрос: Профиль",
			Description:   "Расскажите о себе",
			Type:          "survey",
			Question:      "Давайте познакомимся",
			Options:       StringArray{"Начать"},
			CorrectAnswer: "",
			Questions: []QuestionItem{
				{
					Type:    "text",
					Text:    "В каком университете вы учитесь?",
					Options: []string{},
				},
				{
					Type:    "choice",
					Text:    "Какое у вас направление?",
					Options: []string{"Информатика", "Инженерия", "Математика", "Физика", "Другое"},
				},
				{
					Type:    "choice",
					Text:    "Какая стажировка вас интересует?",
					Options: []string{"Frontend", "Backend", "Data Science", "DevOps", "QA"},
				},
			},
			Reward:   50,
			Position: 0,
			Language: "ru",
		},
		{
			Title:         "Уровень 1: Основы",
			Description:   "Изучаем основы Go",
			Type:          "quiz",
			Question:      "Какое ключевое слово используется для определения переменной в Go?",
			Options:       StringArray{"var", "let", "const", "def"},
			CorrectAnswer: "var",
			Reward:        100,
			Position:      1,
			Language:      "ru",
		},
		{
			Title:         "Уровень 2: Функции",
			Description:   "Понимание функций",
			Type:          "quiz",
			Question:      "Как определить функцию в Go?",
			Options:       StringArray{"func", "function", "def", "fn"},
			CorrectAnswer: "func",
			Reward:        150,
			Position:      2,
			Language:      "ru",
		},
		{
			Title:         "Уровень 3: Структуры",
			Description:   "Работа со структурами",
			Type:          "quiz",
			Question:      "Какое ключевое слово используется для определения структуры?",
			Options:       StringArray{"struct", "class", "object", "type"},
			CorrectAnswer: "type",
			Reward:        200,
			Position:      3,
			Language:      "ru",
		},
		{
			Title:         "Уровень 4: Интерфейсы",
			Description:   "Интерфейсы в Go",
			Type:          "quiz",
			Question:      "Являются ли интерфейсы в Go неявными или явными?",
			Options:       StringArray{"Неявными", "Явными", "И теми и другими", "Никакими"},
			CorrectAnswer: "Неявными",
			Reward:        250,
			Position:      4,
			Language:      "ru",
		},
		{
			Title:         "Уровень 5: Горутины",
			Description:   "Параллельное программирование в Go",
			Type:          "quiz",
			Question:      "Как запустить горутину?",
			Options:       StringArray{"go func()", "async func()", "thread func()", "spawn func()"},
			CorrectAnswer: "go func()",
			Reward:        300,
			Position:      5,
			Language:      "ru",
		},
		{
			Title:         "Уровень 6: Каналы",
			Description:   "Коммуникация между горутинами",
			Type:          "quiz",
			Question:      "Как создать канал в Go?",
			Options:       StringArray{"make(chan int)", "new(chan int)", "chan int{}", "create channel"},
			CorrectAnswer: "make(chan int)",
			Reward:        350,
			Position:      6,
			Language:      "ru",
		},
		{
			Title:         "Опрос: Карьера",
			Description:   "Узнаем о ваших карьерных целях",
			Type:          "survey",
			Question:      "Расскажите о своих планах",
			Options:       StringArray{"Продолжить"},
			CorrectAnswer: "",
			Questions: []QuestionItem{
				{
					Type:    "choice",
					Text:    "Какой формат работы вам подходит?",
					Options: []string{"Офис", "Удалёнка", "Гибрид", "Пока не знаю"},
				},
				{
					Type:    "choice",
					Text:    "В какой сфере хотите развиваться?",
					Options: []string{"Веб-разработка", "Мобильная разработка", "Машинное обучение", "Геймдев", "Системное программирование"},
				},
				{
					Type:    "text",
					Text:    "Какие технологии вы уже изучали?",
					Options: []string{},
				},
				{
					Type:    "choice",
					Text:    "Готовы ли вы к переезду?",
					Options: []string{"Да", "Нет", "Возможно"},
				},
			},
			Reward:   200,
			Position: 7,
			Language: "ru",
		},
		{
			Title:         "Уровень 8: Ошибки",
			Description:   "Обработка ошибок в Go",
			Type:          "quiz",
			Question:      "Как обычно обрабатывают ошибки в Go?",
			Options:       StringArray{"if err != nil", "try-catch", "throw-catch", "error handler"},
			CorrectAnswer: "if err != nil",
			Reward:        400,
			Position:      8,
			Language:      "ru",
		},
		{
			Title:         "Уровень 9: Указатели",
			Description:   "Работа с указателями",
			Type:          "quiz",
			Question:      "Как получить адрес переменной x?",
			Options:       StringArray{"&x", "*x", "ref(x)", "addr(x)"},
			CorrectAnswer: "&x",
			Reward:        450,
			Position:      9,
			Language:      "ru",
		},
		{
			Title:         "Уровень 10: Слайсы",
			Description:   "Динамические массивы в Go",
			Type:          "quiz",
			Question:      "Как добавить элемент в слайс?",
			Options:       StringArray{"append(slice, elem)", "slice.push(elem)", "slice.add(elem)", "slice += elem"},
			CorrectAnswer: "append(slice, elem)",
			Reward:        500,
			Position:      10,
			Language:      "ru",
		},
		{
			Title:         "Опрос: Обратная связь",
			Description:   "Помогите нам стать лучше",
			Type:          "survey",
			Question:      "Ваше мнение важно для нас",
			Options:       StringArray{"Начать опрос"},
			CorrectAnswer: "",
			Questions: []QuestionItem{
				{
					Type:    "choice",
					Text:    "Как вам приложение?",
					Options: []string{"Отлично", "Хорошо", "Нормально", "Есть замечания"},
				},
				{
					Type:    "text",
					Text:    "Что бы вы хотели улучшить?",
					Options: []string{},
				},
				{
					Type:    "choice",
					Text:    "Будете ли рекомендовать друзьям?",
					Options: []string{"Да, обязательно", "Возможно", "Скорее нет"},
				},
			},
			Reward:   150,
			Position: 11,
			Language: "ru",
		},
		{
			Title:         "Уровень 12: Мапы",
			Description:   "Хеш-таблицы в Go",
			Type:          "quiz",
			Question:      "Как создать мапу в Go?",
			Options:       StringArray{"make(map[string]int)", "new Map()", "map{}", "dict()"},
			CorrectAnswer: "make(map[string]int)",
			Reward:        550,
			Position:      12,
			Language:      "ru",
		},
		{
			Title:         "Уровень 13: Defer",
			Description:   "Отложенное выполнение",
			Type:          "quiz",
			Question:      "Когда выполняется defer?",
			Options:       StringArray{"При выходе из функции", "Сразу", "В отдельной горутине", "Никогда"},
			CorrectAnswer: "При выходе из функции",
			Reward:        600,
			Position:      13,
			Language:      "ru",
		},
		{
			Title:         "Уровень 14: Пакеты",
			Description:   "Организация кода",
			Type:          "quiz",
			Question:      "Как импортировать пакет fmt?",
			Options:       StringArray{"import \"fmt\"", "include <fmt>", "require fmt", "using fmt"},
			CorrectAnswer: "import \"fmt\"",
			Reward:        650,
			Position:      14,
			Language:      "ru",
		},
		{
			Title:         "Уровень 15: Тестирование",
			Description:   "Написание тестов в Go",
			Type:          "quiz",
			Question:      "Как называется файл с тестами в Go?",
			Options:       StringArray{"*_test.go", "*.spec.go", "*.test.go", "test_*.go"},
			CorrectAnswer: "*_test.go",
			Reward:        700,
			Position:      15,
			Language:      "ru",
		},
	}

	for _, task := range tasks {
		var existingTask Task
		if err := DB.Where("position = ? AND language = ?", task.Position, task.Language).First(&existingTask).Error; err == nil {
			task.ID = existingTask.ID
			DB.Save(&task)
		} else {
			DB.Create(&task)
		}
	}
	log.Println("Seeded/Updated tasks")

	DB.Exec("DELETE FROM shop_items")
	items := []ShopItem{
		{
			Name:        "Футболка X5Tech",
			Description: "Фирменная футболка с логотипом",
			Price:       1500,
			Image:       "👕",
			Stock:       50,
		},
		{
			Name:        "Худи X5Tech",
			Description: "Тёплое худи с принтом",
			Price:       2500,
			Image:       "🧥",
			Stock:       30,
		},
		{
			Name:        "Кепка X5Tech",
			Description: "Стильная кепка с вышивкой",
			Price:       800,
			Image:       "🧢",
			Stock:       100,
		},
		{
			Name:        "Стикерпак X5Tech",
			Description: "Набор фирменных стикеров",
			Price:       300,
			Image:       "🎨",
			Stock:       200,
		},
		{
			Name:        "Термокружка X5Tech",
			Description: "Кружка с логотипом X5Tech",
			Price:       600,
			Image:       "☕",
			Stock:       75,
		},
		{
			Name:        "Рюкзак X5Tech",
			Description: "Практичный рюкзак для ноутбука",
			Price:       3000,
			Image:       "🎒",
			Stock:       25,
		},
	}
	if err := DB.Create(&items).Error; err != nil {
		return err
	}
	log.Println("Seeded shop items (merch only)")

	// Seed admin user
	var adminCount int64
	DB.Model(&User{}).Where("role = ?", "admin").Count(&adminCount)
	if adminCount == 0 {
		adminUser := User{
			PhoneNumber: "admin",
			Username:    "admin",
			FirstName:   "Admin",
			LastName:    "User",
			Role:        "admin",
			Balance:     0,
		}
		if err := DB.Create(&adminUser).Error; err != nil {
			log.Printf("Failed to create admin user: %v", err)
		} else {
			log.Println("Seeded admin user (login: admin)")
		}
	}

	return nil
}
