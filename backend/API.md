# API Documentation

## Base URL

```
http://localhost:8080
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After successful authentication via Telegram, you'll receive a JWT token that should be included in subsequent requests.

### Authentication Methods

1. **Cookie-based (Recommended)**: The token is automatically set as an HTTP-only cookie (`auth_token`) after login
2. **Header-based**: Include the token in the `Authorization` header as `Bearer <token>`

### Example with Header

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Endpoints

### Health Check

#### `GET /ping`

Check if the API is running.

**Response:**
```json
{
  "message": "pong"
}
```

**Example:**
```bash
curl http://localhost:8080/ping
```

---

## Authentication

### `POST /api/auth/telegram`

Authenticate using Telegram WebApp InitData.

**Request Body:**
```json
{
  "hash": "telegram_hash_string",
  "user_id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://example.com/photo.jpg",
  "auth_date": 1234567890
}
```

**Response:**
```json
{
  "token": "jwt_access_token_here"
}
```

**Status Codes:**
- `200 OK` - Authentication successful
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid Telegram hash

**Example:**
```bash
curl -X POST http://localhost:8080/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "abc123...",
    "user_id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "auth_date": 1234567890
  }'
```

**Note:** The token is also set as a cookie (`auth_token`) for subsequent requests.

---

## User Endpoints

### `GET /api/user/me`

Get current user's profile information.

**Authentication:** Required

**Response:**
```json
{
  "id": 1,
  "username": "johndoe",
  "balance": 150,
  "current_streak": 5,
  "completed_tasks_count": 10,
  "role": "student"
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found

**Example:**
```bash
curl http://localhost:8080/api/user/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### `PUT /api/user/me`

Update current user's profile (resume link and tech stack).

**Authentication:** Required

**Request Body:**
```json
{
  "resume_link": "https://example.com/resume.pdf",
  "stack": ["Go", "JavaScript", "Python"]
}
```

**Response:**
```json
{
  "message": "User updated successfully"
}
```

**Status Codes:**
- `200 OK` - Update successful
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid token

**Example:**
```bash
curl -X PUT http://localhost:8080/api/user/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_link": "https://example.com/resume.pdf",
    "stack": ["Go", "JavaScript"]
  }'
```

---

### `GET /api/user/inventory`

Get user's purchased items and their redemption status.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": 1,
    "item_id": 5,
    "item_name": "Футболка",
    "purchase_id": "uuid-code-123",
    "status": "pending",
    "purchased_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "item_id": 3,
    "item_name": "Стикерпак",
    "purchase_id": "uuid-code-456",
    "status": "redeemed",
    "purchased_at": "2024-01-14T08:20:00Z"
  }
]
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Missing or invalid token

**Example:**
```bash
curl http://localhost:8080/api/user/inventory \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### `GET /api/user/metrics`

Get detailed user metrics and statistics.

**Authentication:** Required

**Response:**
```json
{
  "user_id": 1,
  "username": "johndoe",
  "balance": 150,
  "current_streak": 5,
  "completed_tasks_count": 10,
  "total_earned": 500,
  "total_spent": 350,
  "items_purchased": 2,
  "items_redeemed": 1,
  "net_balance": 150
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Failed to get metrics

**Example:**
```bash
curl http://localhost:8080/api/user/metrics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Task Endpoints

### `GET /api/tasks`

Get all tasks with their status (locked, available, completed) for the current user.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": 101,
    "title": "Основы Go",
    "type": "quiz",
    "status": "completed",
    "reward": 50,
    "position": 1
  },
  {
    "id": 102,
    "title": "Найди баг",
    "type": "code",
    "status": "available",
    "reward": 100,
    "position": 2
  },
  {
    "id": 103,
    "title": "Продвинутый Go",
    "type": "quiz",
    "status": "locked",
    "reward": 150,
    "position": 3
  }
]
```

**Status Values:**
- `locked` - Task is not yet available (previous tasks not completed)
- `available` - Task is available to complete
- `completed` - Task has been completed

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Missing or invalid token

**Example:**
```bash
curl http://localhost:8080/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### `GET /api/tasks/{id}`

Get detailed information about a specific task.

**Authentication:** Required

**Path Parameters:**
- `id` (integer) - Task ID

**Response:**
```json
{
  "id": 101,
  "question": "Какая команда запускает горутину?",
  "options": ["start", "go", "run", "async"],
  "type": "choice"
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid task ID
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Task is locked
- `404 Not Found` - Task not found

**Example:**
```bash
curl http://localhost:8080/api/tasks/101 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### `POST /api/tasks/{id}/submit`

Submit an answer for a task.

**Authentication:** Required

**Path Parameters:**
- `id` (integer) - Task ID

**Request Body:**
```json
{
  "answer": "go"
}
```

Or using answer index:
```json
{
  "answer_index": 1
}
```

**Response:**
```json
{
  "success": true,
  "earned": 50,
  "new_balance": 200,
  "correct_answer": "go"
}
```

**Status Codes:**
- `200 OK` - Answer submitted (check `success` field for correctness)
- `400 Bad Request` - Invalid request body or task ID
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Failed to submit answer

**Example:**
```bash
curl -X POST http://localhost:8080/api/tasks/101/submit \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "go"
  }'
```

**Note:** If the answer is correct, the user's balance is increased, the task is marked as completed, and the streak is updated.

---

## Shop Endpoints

### `GET /api/shop/items`

Get all available shop items.

**Authentication:** Not required (public endpoint)

**Response:**
```json
[
  {
    "id": 1,
    "name": "Футболка",
    "price": 500,
    "image": "/images/tshirt.jpg",
    "stock": 50,
    "description": "Футболка с логотипом X5 Tech"
  },
  {
    "id": 2,
    "name": "Носки",
    "price": 200,
    "image": "/images/socks.jpg",
    "stock": 100,
    "description": "Носки с логотипом"
  },
  {
    "id": 3,
    "name": "Стикерпак",
    "price": 100,
    "image": "/images/stickers.jpg",
    "stock": 200,
    "description": "Набор стикеров"
  }
]
```

**Status Codes:**
- `200 OK` - Success

**Example:**
```bash
curl http://localhost:8080/api/shop/items
```

---

### `POST /api/shop/buy`

Purchase an item from the shop.

**Authentication:** Required

**Request Body:**
```json
{
  "item_id": 5
}
```

**Response:**
```json
{
  "purchase_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Status Codes:**
- `200 OK` - Purchase successful
- `400 Bad Request` - Invalid request body, insufficient balance, or item out of stock
- `401 Unauthorized` - Missing or invalid token
- `500 Internal Server Error` - Failed to purchase item

**Example:**
```bash
curl -X POST http://localhost:8080/api/shop/buy \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 5
  }'
```

**Note:** The `purchase_id` is a UUID that should be shown to the organizer to redeem the item. The purchase status will be `pending` until redeemed by an admin.

---

## Admin Endpoints

### `POST /api/admin/redeem`

Redeem a purchase (mark as redeemed and issue the item).

**Authentication:** Required (Admin role only)

**Request Body:**
```json
{
  "purchase_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "success": true,
  "item": "Футболка L",
  "user": "John Doe"
}
```

**Status Codes:**
- `200 OK` - Redemption successful
- `400 Bad Request` - Invalid request body or purchase already redeemed
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Admin access required
- `404 Not Found` - Purchase not found

**Example:**
```bash
curl -X POST http://localhost:8080/api/admin/redeem \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "purchase_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## Leaderboard

### `GET /api/leaderboard`

Get the leaderboard with top users and optionally the current user's position.

**Authentication:** Optional (if authenticated, includes current user position)

**Response:**
```json
{
  "top_users": [
    {
      "rank": 1,
      "user_id": 1,
      "username": "durov",
      "balance": 1500,
      "completed_tasks_count": 25,
      "current_streak": 10
    },
    {
      "rank": 2,
      "user_id": 2,
      "username": "user2",
      "balance": 1200,
      "completed_tasks_count": 20,
      "current_streak": 8
    }
  ],
  "current_user": {
    "rank": 5,
    "user_id": 5,
    "username": "johndoe",
    "balance": 800,
    "completed_tasks_count": 15,
    "current_streak": 5
  }
}
```

**Status Codes:**
- `200 OK` - Success

**Example (without auth):**
```bash
curl http://localhost:8080/api/leaderboard
```

**Example (with auth to see your position):**
```bash
curl http://localhost:8080/api/leaderboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters or body
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions (e.g., admin-only endpoint)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Environment Variables

The following environment variables can be configured:

- `DATABASE_URL` - PostgreSQL connection string (default: `postgres://postgres:postgres@localhost:5432/hackathon?sslmode=disable`)
- `JWT_SECRET` - Secret key for JWT token signing (default: `your-secret-key-change-in-production`)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token for hash validation (default: `default-bot-token`)
- `SKIP_TELEGRAM_VALIDATION` - Set to `true` to skip Telegram hash validation (for development)

---

## Example Workflow

### 1. Authenticate
```bash
curl -X POST http://localhost:8080/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "hash": "...",
    "user_id": 123456789,
    "first_name": "John",
    "auth_date": 1234567890
  }'
```

### 2. Get User Profile
```bash
curl http://localhost:8080/api/user/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get Available Tasks
```bash
curl http://localhost:8080/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Get Task Details
```bash
curl http://localhost:8080/api/tasks/101 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Submit Task Answer
```bash
curl -X POST http://localhost:8080/api/tasks/101/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answer": "go"}'
```

### 6. View Shop Items
```bash
curl http://localhost:8080/api/shop/items
```

### 7. Purchase Item
```bash
curl -X POST http://localhost:8080/api/shop/buy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id": 1}'
```

### 8. Check Inventory
```bash
curl http://localhost:8080/api/user/inventory \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9. View Leaderboard
```bash
curl http://localhost:8080/api/leaderboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

- All timestamps are in ISO 8601 format (RFC3339)
- All monetary values (balance, prices, rewards) are in the base currency unit
- Task positions determine the order and unlock sequence
- The first task (position 1) is always available
- Subsequent tasks require the previous task to be completed
- Purchase IDs are UUIDs that should be displayed as QR codes or text for redemption

