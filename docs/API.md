# API Documentation - DPDC AMI by OTBL

Base URL: `/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### POST /auth/login

Login with username and password.

**Request:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@dpdc-ami.local",
      "role": {
        "id": 1,
        "name": "admin",
        "permissions": {...}
      }
    },
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### POST /auth/refresh

Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_access_token"
  }
}
```

### GET /auth/profile

Get current user profile (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@dpdc-ami.local",
    "role": {
      "name": "admin",
      "permissions": {...}
    }
  }
}
```

### POST /auth/change-password

Change user password (requires authentication).

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## User Management

### GET /users

Get all users (Admin only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search by username or email
- `role` (optional): Filter by role ID
- `isActive` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": {
        "id": 1,
        "name": "admin"
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### POST /users

Create new user (Admin only).

**Request:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "Password@123",
  "role_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "user@example.com",
    "role": {...}
  }
}
```

### GET /users/:id

Get user by ID (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "user",
    "email": "user@example.com",
    "role": {...}
  }
}
```

### PUT /users/:id

Update user (Admin only).

**Request:**
```json
{
  "email": "newemail@example.com",
  "role_id": 3,
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {...}
}
```

### DELETE /users/:id

Deactivate user (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### GET /users/roles

Get all available roles.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "admin",
      "description": "Full system access",
      "permissions": {
        "can_manage_users": true,
        "can_execute_any_query": true,
        ...
      }
    }
  ]
}
```

## Query Execution

### POST /queries/execute

Execute Oracle SQL query.

**Request:**
```json
{
  "query": "SELECT * FROM employees WHERE department = 'IT'",
  "maxRows": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ID": 1,
      "NAME": "John Doe",
      "DEPARTMENT": "IT"
    }
  ],
  "metadata": {
    "rowCount": 1,
    "executionTime": 245,
    "columns": [
      {"name": "ID"},
      {"name": "NAME"},
      {"name": "DEPARTMENT"}
    ]
  }
}
```

### POST /queries/execute-export

Execute query and export results.

**Request:**
```json
{
  "query": "SELECT * FROM employees",
  "format": "xlsx",
  "maxRows": 10000
}
```

**Response:**
Binary file download (Excel, CSV, or PDF)

**Supported formats:**
- `csv` - Comma-separated values
- `xlsx` / `excel` - Microsoft Excel
- `pdf` - PDF document

### POST /queries/export

Export existing data to file.

**Request:**
```json
{
  "data": [
    {"id": 1, "name": "John"},
    {"id": 2, "name": "Jane"}
  ],
  "format": "xlsx",
  "title": "User Report"
}
```

**Response:**
Binary file download

### GET /queries/history

Get query execution history.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `userId` (optional): Filter by user ID
- `status` (optional): Filter by status (success/error)
- `startDate` (optional): Filter by date range
- `endDate` (optional): Filter by date range

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "query_text": "SELECT * FROM...",
      "execution_time": 245,
      "rows_returned": 100,
      "status": "success",
      "executed_at": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

### GET /queries/statistics

Get query execution statistics (Admin only).

**Query Parameters:**
- `userId` (optional): Get stats for specific user

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_queries": 1234,
      "avg_execution_time": 305,
      "max_execution_time": 5000,
      "total_rows_returned": 50000
    },
    "byStatus": [
      {"status": "success", "count": 1200},
      {"status": "error", "count": 34}
    ]
  }
}
```

### GET /queries/test-connection

Test Oracle database connection (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Oracle connection successful"
}
```

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 login attempts per 15 minutes
- **Query Execution**: 10 queries per minute

When rate limit is exceeded:
```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later"
}
```

## Permissions

### Role Permissions

**Admin:**
- `can_manage_users`: Create, update, delete users
- `can_execute_any_query`: Execute any SELECT query
- `can_export_reports`: Export query results
- `can_view_audit_logs`: View all query history
- `can_manage_roles`: Manage user roles

**Power User:**
- `can_execute_custom_query`: Write and execute custom queries
- `can_execute_predefined_query`: Execute saved queries
- `can_export_reports`: Export results

**User:**
- `can_execute_predefined_query`: Execute predefined queries only
- `can_export_reports`: Export results

**Viewer:**
- `can_view_reports`: View query results only
- No export or execution rights

## Security Notes

1. **SQL Injection Protection**: Only SELECT queries are allowed. All INSERT, UPDATE, DELETE, DROP, etc. are blocked.

2. **Authentication**: JWT tokens expire after 1 hour. Use refresh tokens to get new access tokens.

3. **HTTPS**: Always use HTTPS in production.

4. **CORS**: API only accepts requests from configured origins.

5. **Query Validation**: All queries are validated before execution to prevent dangerous operations.

## Examples

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

**Execute Query:**
```bash
TOKEN="your_jwt_token"
curl -X POST http://localhost:3000/api/queries/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "SELECT * FROM employees",
    "maxRows": 100
  }'
```

**Export to Excel:**
```bash
curl -X POST http://localhost:3000/api/queries/execute-export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "SELECT * FROM employees",
    "format": "xlsx"
  }' \
  --output report.xlsx
```

### JavaScript/Axios Examples

```javascript
import axios from 'axios';

// Login
const login = async () => {
  const response = await axios.post('/api/auth/login', {
    username: 'admin',
    password: 'Admin@123'
  });
  return response.data.data.token;
};

// Execute query
const executeQuery = async (token) => {
  const response = await axios.post('/api/queries/execute',
    {
      query: 'SELECT * FROM employees',
      maxRows: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};
```

## Webhooks / Real-time

Currently not implemented. All communication is synchronous REST API.

## Versioning

Current API version: **v1**

API is accessed via `/api` prefix. Future versions may use `/api/v2`, etc.

## Support

For API issues or questions, contact the development team or refer to the main documentation.
