# FluentEdge Backend V2

A scalable, high-performance Node.js + Express.js backend implementation with **Socket.IO** for real-time communication and **direct PostgreSQL queries** (`pg.Pool`), without Prisma or any ORM.

---

## 📁 Architecture & Folder Structure

```
backend_v2/
├── package.json           # Node.js dependencies & scripts
├── .env.example           # Environment template
├── .env                   # Environment variables
├── src/
│   ├── config/
│   │   ├── env.js         # Environment variables parser
│   │   ├── database.js    # pg.Pool with SSL & direct SQL query helpers
│   │   ├── cors.js        # CORS with localhost and local network IP support
│   │   └── socket.js      # Socket.IO initialization and instance accessor
│   ├── utils/
│   │   ├── response.util.js # Standardized API response format ({ success, data, error })
│   │   └── jwt.util.js    # JWT sign & verify helpers
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT authentication & role authorization
│   │   ├── error.middleware.js  # Global error handler
│   │   └── logger.middleware.js # HTTP request logger
│   ├── models/            # Direct SQL query models (No ORM / No Prisma)
│   │   ├── user.model.js        # Users, auth tokens, profiles
│   │   ├── course.model.js      # Courses, units, lessons
│   │   ├── class.model.js       # Classes, student enrollments
│   │   └── notification.model.js# In-app notifications
│   ├── services/          # Business logic layer
│   │   ├── auth.service.js      # Registration, login, token refresh
│   │   ├── user.service.js      # Profile management
│   │   ├── course.service.js    # Course curriculum logic
│   │   ├── class.service.js     # Classes and enrollments
│   │   ├── notification.service.js # Notification creation & push
│   │   └── socket.service.js    # Socket.IO broadcasting helper
│   ├── controllers/       # HTTP Request & Response handlers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── course.controller.js
│   │   ├── class.controller.js
│   │   ├── notification.controller.js
│   │   └── health.controller.js
│   ├── routes/            # Express route definitions
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── course.routes.js
│   │   ├── class.routes.js
│   │   ├── notification.routes.js
│   │   └── index.js       # Root v1 router
│   ├── sockets/           # Real-time Socket.IO modules
│   │   ├── auth.socket.js # Handshake JWT authentication
│   │   ├── chat.socket.js # Rooms, chat messages, typing indicators
│   │   ├── notification.socket.js # User notification rooms
│   │   └── index.js       # Socket connection manager
│   ├── app.js             # Express application pipeline
│   └── server.js          # HTTP + Socket.IO server startup
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend_v2
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and configure your PostgreSQL database connection:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
Runs `node --watch src/server.js` with instant hot reloading on file changes.

---

## 📡 API Endpoints (v1)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1` | API Welcome & Metadata | No |
| `GET` | `/api/v1/health` | Service & DB Health Check | No |
| `POST` | `/api/v1/auth/register` | Register new student or teacher | No |
| `POST` | `/api/v1/auth/login` | Login with email & password | No |
| `POST` | `/api/v1/auth/refresh-token` | Refresh expired access token | No |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token | No |
| `GET` | `/api/v1/auth/me` | Current authenticated user | Yes |
| `GET` | `/api/v1/users/profile` | Full profile with role details | Yes |
| `PATCH` | `/api/v1/users/profile` | Update profile information | Yes |
| `GET` | `/api/v1/courses` | Public published courses | No |
| `GET` | `/api/v1/courses/:id` | Course details with units & lessons | No |
| `GET` | `/api/v1/courses/teacher/my-courses` | Teacher's courses | Yes (Teacher) |
| `POST` | `/api/v1/courses/teacher/create` | Create new course | Yes (Teacher) |
| `GET` | `/api/v1/classes/teacher` | Teacher's live classes | Yes (Teacher) |
| `POST` | `/api/v1/classes/teacher` | Create new class | Yes (Teacher) |
| `GET` | `/api/v1/classes/student` | Student's enrolled classes | Yes (Student) |
| `GET` | `/api/v1/notifications` | User notifications | Yes |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark notification as read | Yes |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all notifications read | Yes |

---

## ⚡ Real-Time Socket.IO Events

### Client -> Server:
- `join_room`: `{ roomId }` — Join a class or discussion room
- `leave_room`: `{ roomId }` — Leave a room
- `send_message`: `{ roomId, message }` — Send a message to a room
- `typing`: `{ roomId }` — Notify room that user is typing
- `stop_typing`: `{ roomId }` — Notify room that user stopped typing

### Server -> Client:
- `receive_message`: `{ id, roomId, message, sender, timestamp }`
- `user_joined`: `{ userId, name, timestamp }`
- `user_left`: `{ userId, timestamp }`
- `user_typing`: `{ userId, name }`
- `user_stop_typing`: `{ userId }`
- `notification:new`: `{ id, title, message, type, link, createdAt }`
- `class:created`: `{ classId, name, teacherId }`
