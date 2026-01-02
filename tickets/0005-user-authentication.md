# Ticket 0005: User Authentication & Authorization

**Status**: In Progress
**Priority**: High
**Assignee**: Claude
**Created**: 2026-01-02
**Updated**: 2026-01-02

## Overview

Implement a complete user authentication and role-based authorization system for the Domogo Calculator application. This replaces the placeholder login with a real backend-based authentication system using JWT tokens.

## Goals

1. Create database models for users and roles with many-to-many relationship
2. Implement secure password hashing and JWT token-based authentication
3. Create API endpoints for login, register, and user management
4. Follow all CLAUDE.md principles (TimestampMixin, soft deletes, structured logging)
5. Provide seed data for initial admin user and common roles

## Database Schema

### User Table
- `id` (Primary Key)
- `username` (Unique, indexed)
- `email` (Unique, indexed)
- `hashed_password` (bcrypt)
- `full_name`
- `is_active` (boolean, default True)
- `archived` (boolean, default False, indexed) - soft delete
- `created_at` (from TimestampMixin)
- `updated_at` (from TimestampMixin)

### Role Table
- `id` (Primary Key)
- `name` (Unique, indexed) - e.g., "admin", "sales", "user"
- `description`
- `archived` (boolean, default False, indexed) - soft delete
- `created_at` (from TimestampMixin)
- `updated_at` (from TimestampMixin)

### UserRole Association Table
- `user_id` (Foreign Key to users)
- `role_id` (Foreign Key to roles)
- `created_at` (timestamp)

## Authentication Flow

1. **Register**: POST /api/auth/register
   - Create new user with hashed password
   - Assign default "user" role
   - Return success message

2. **Login**: POST /api/auth/login
   - Validate credentials
   - Generate JWT access token (short-lived, e.g., 30 minutes)
   - Generate JWT refresh token (long-lived, e.g., 7 days)
   - Return tokens

3. **Refresh**: POST /api/auth/refresh
   - Validate refresh token
   - Generate new access token
   - Return new access token

4. **Logout**: POST /api/auth/logout
   - Invalidate tokens (client-side removal)

5. **Protected Routes**: Require valid JWT token in Authorization header

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login and get tokens
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout (client-side)
- `GET /me` - Get current user info (requires auth)

### User Management Routes (`/api/users`)
- `GET /` - List users (requires admin role)
- `GET /{id}` - Get user details (requires admin or self)
- `PUT /{id}` - Update user (requires admin or self)
- `DELETE /{id}` - Archive user (requires admin, soft delete)
- `PUT /{id}/roles` - Update user roles (requires admin)

### Role Management Routes (`/api/roles`)
- `GET /` - List roles (requires admin)
- `POST /` - Create role (requires admin)
- `PUT /{id}` - Update role (requires admin)
- `DELETE /{id}` - Archive role (requires admin, soft delete)

## Default Roles

1. **admin** - Full system access
2. **sales** - Access to customers, calculations, offers
3. **user** - Basic access (future use)

## Security Requirements

- Passwords hashed with bcrypt (min 12 rounds)
- JWT tokens signed with secret key (from environment)
- Access tokens expire after 30 minutes
- Refresh tokens expire after 7 days
- Passwords must meet minimum requirements (8+ chars, complexity)
- Rate limiting on login endpoint (future enhancement)

## Technical Implementation

### Models
- `backend/models/user.py` - User model with TimestampMixin
- `backend/models/role.py` - Role model with TimestampMixin
- `backend/models/user_role.py` - Association table

### Authentication Utilities
- `backend/auth/password.py` - Password hashing and verification
- `backend/auth/jwt.py` - JWT token generation and validation
- `backend/auth/dependencies.py` - FastAPI dependencies for route protection

### Routes
- `backend/routes/auth.py` - Authentication endpoints
- `backend/routes/users.py` - User management endpoints
- `backend/routes/roles.py` - Role management endpoints

### Migration
- Alembic migration for users, roles, and user_roles tables

### Seeds
- `backend/seeds/seed_roles.py` - Create default roles
- `backend/seeds/seed_users.py` - Create initial admin user

## Environment Variables

Add to `.env`:
```
JWT_SECRET_KEY=<random-secret-key>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Testing

Manual testing scenarios:
1. Register new user
2. Login with valid credentials
3. Login with invalid credentials (should fail)
4. Access protected route without token (should fail)
5. Access protected route with valid token (should succeed)
6. Access protected route with expired token (should fail)
7. Refresh token to get new access token
8. Admin creates/updates/archives users
9. Admin assigns roles to users
10. User without admin role cannot access admin routes

## Success Criteria

- [ ] Database models created with proper relationships
- [ ] Alembic migration applied successfully
- [ ] Password hashing working (bcrypt)
- [ ] JWT token generation and validation working
- [ ] All API endpoints implemented and tested
- [ ] Seed data creates admin user and default roles
- [ ] Protected routes require valid JWT token
- [ ] Role-based access control working
- [ ] Structured logging on all auth operations
- [ ] Documentation updated in README

## Future Enhancements

- Password reset via email
- Two-factor authentication (2FA)
- Session management (track active sessions)
- Rate limiting on login attempts
- Audit log for authentication events
- OAuth/SSO integration

## Notes

- Follow all CLAUDE.md conventions (TimestampMixin, archived field, structured logging)
- Use Pydantic schemas for request/response validation
- Never log passwords or tokens
- Always use `extra={}` for structured logging context
- Default admin credentials should be changed after first login
