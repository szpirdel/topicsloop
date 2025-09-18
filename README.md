# TopicsLoop

TopicsLoop is a social knowledge sharing application built with Django REST Framework and React.

## Tech Stack

### Backend
- **Django 4.2+** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL 17** - Database
- **JWT Authentication** - Token-based authentication
- **Djoser** - Authentication endpoints
- **CORS Headers** - Cross-origin resource sharing

### Frontend
- **React 19** - UI framework
- **React Router DOM 7.1.5** - Client-side routing
- **Axios 1.7.9** - HTTP client
- **Create React App** - Build tooling

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **PostgreSQL** - Database service

## Project Structure

```
topicsloop/
├── accounts/          # Custom user authentication
├── api/              # API endpoints
├── blog/             # Blog/posts functionality
├── frontend/         # React frontend application
├── topicsloop/       # Django project settings
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── manage.py
```

## Quick Start

### Prerequisites
- Docker and Docker Compose installed

### Setup
1. Clone the repository
2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Start the application:
   ```bash
   docker-compose up --build
   ```

### Services
- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **Database**: PostgreSQL on port 5432

## API Features
- JWT-based authentication with refresh tokens
- User registration and login
- Blog posts with CRUD operations
- Comments system
- CORS configured for frontend integration

## Authentication
- JWT tokens with 5-minute access token lifetime
- 1-day refresh token lifetime
- Email-based user login
- Custom user model via accounts app
