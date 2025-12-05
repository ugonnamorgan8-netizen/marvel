# Marvel Driving School Automation System

## Overview

A comprehensive backend system for managing driving school operations including student enrollment, attendance tracking, training logs, document management, and payment processing.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **File Storage**: Cloudinary
- **Payments**: Flutterwave API
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
├── server/
│   ├── controllers/          # Route handlers
│   │   ├── authController.ts
│   │   ├── studentsController.ts
│   │   ├── attendanceController.ts
│   │   ├── trainingController.ts
│   │   ├── paymentsController.ts
│   │   ├── documentsController.ts
│   │   └── dashboardController.ts
│   ├── helpers/              # External service integrations
│   │   ├── cloudinary.ts
│   │   └── flutterwave.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── db.ts                 # Database connection
│   ├── storage.ts            # Data access layer
│   ├── routes.ts             # API routes
│   └── index.ts              # Entry point
├── shared/
│   └── schema.ts             # Database schema & types
├── client/                   # Frontend (React)
└── .env.example              # Environment variables template
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin/Staff login with email + password
- `POST /api/auth/viewer-login` - Student login with student_code
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate tokens
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/register` - Register new user (admin only)
- `POST /api/auth/change-password` - Change password

### Students
- `GET /api/students` - List all students (with pagination & filters)
- `GET /api/students/:id` - Get student details
- `GET /api/students/code/:code` - Get student by student code
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student (admin only)

### Attendance
- `GET /api/attendance` - List attendance records
- `GET /api/attendance/student/:studentId` - Get student attendance
- `POST /api/attendance` - Record attendance
- `POST /api/attendance/bulk` - Bulk attendance recording
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

### Training
- `GET /api/training/:studentId` - Get training logs for student
- `GET /api/training/log/:id` - Get single training log
- `GET /api/training/progress/:studentId` - Get student progress
- `POST /api/training` - Create training log
- `PUT /api/training/:id` - Update training log
- `DELETE /api/training/:id` - Delete training log

### Payments
- `GET /api/payments` - List all payments
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/student/:studentId` - Get student payments
- `POST /api/payments/initiate` - Create payment & generate link
- `GET /api/payments/verify` - Verify payment status
- `POST /api/payments/webhook` - Flutterwave webhook

### Documents
- `GET /api/documents/:studentId` - List student documents
- `GET /api/documents/single/:id` - Get document
- `POST /api/documents/upload` - Upload document (multipart)
- `GET /api/documents/signature` - Get Cloudinary signature
- `POST /api/documents/register` - Register client-side upload
- `DELETE /api/documents/:id` - Delete document

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-students` - Get recent students
- `GET /api/dashboard/recent-payments` - Get recent payments
- `GET /api/health` - Health check

## User Roles

1. **Admin** - Full access to all features
2. **Staff** - CRUD operations on students, attendance, training, payments
3. **Viewer** - Student view-only access via student code

## Environment Variables

See `.env.example` for required environment variables.

## Getting Started

1. Copy `.env.example` to `.env` and fill in values
2. Run `npm run db:push` to sync database schema
3. Run `npm run dev` to start development server
4. Access API at `http://localhost:5000/api`

## Database Commands

- `npm run db:push` - Push schema changes to database

## Security Features

- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting (100 req/15min general, 10 req/15min auth)
- CORS configuration
- Helmet security headers
- Input validation with Zod
- Role-based access control

## Deployment

The application is configured for Render hosting:
- Set all environment variables
- Build command: `npm run build`
- Start command: `npm run start`
