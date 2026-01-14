# Setup Guide - UI/UX Improvements

## Quick Start

Follow these steps to apply all the UI/UX improvements to your DPDC AMI system.

---

## Step 1: Create Environment File

First, create a `.env` file in the backend directory:

```bash
cd backend
cp .env.development .env
```

This file contains all the database credentials and configuration needed for the application to run. Without it, you'll get database connection errors.

---

## Step 2: Install Backend Dependencies

```bash
cd backend
npm install ua-parser-js
```

This package is needed for parsing user agent strings to extract device, browser, and OS information.

---

## Step 3: Run Database Migrations

Create the new database tables for activity tracking:

```bash
cd backend
npx sequelize-cli db:migrate
```

This will create three new tables:
- `login_history` - Tracks all login attempts
- `user_sessions` - Manages active user sessions
- `user_activities` - Logs all user activities

**Verify migration:**
```bash
npx sequelize-cli db:migrate:status
```

You should see:
```
up 20250117000001-add-activity-tracking-tables.js
```

**Important:** If you encounter an error about missing `query_logs` table, run this fix:

```bash
cd backend
node -e "const s=require('./src/config/database');(async()=>{await s.authenticate();await s.query('CREATE TABLE IF NOT EXISTS query_logs(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,query_text TEXT NOT NULL,execution_time INTEGER,rows_returned INTEGER,status VARCHAR(20) DEFAULT \\'success\\',error_message TEXT,executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);CREATE INDEX IF NOT EXISTS idx_query_logs_user_id ON query_logs(user_id);CREATE INDEX IF NOT EXISTS idx_query_logs_executed_at ON query_logs(executed_at);');console.log('✓ query_logs table created');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});"
```

---

## Step 4: Update Environment Variables (Optional)

If you want to configure session expiration or other activity tracking settings, add these to your `.env` file:

```env
# Session Configuration
SESSION_EXPIRY_HOURS=24
MAX_ACTIVE_SESSIONS_PER_USER=5

# Activity Logging
ENABLE_ACTIVITY_LOGGING=true
ACTIVITY_LOG_RETENTION_DAYS=90
```

---

## Step 5: Restart Backend Server

```bash
cd backend
npm run dev
```

The server should start without errors. Check the console for:
```
✓ Server running on port 3000
✓ Database connected
✓ Models loaded: User, Role, QueryLog, LoginHistory, UserSession, UserActivity
```

---

## Step 6: Test Frontend

No additional installation needed for the frontend - all changes use existing Tailwind CSS.

**Start the frontend:**
```bash
cd frontend
npm run dev
```

**Verify pages load correctly:**
1. Visit http://localhost:5173/login
   - Should see enhanced login page with animations
2. Login and visit each page:
   - `/reports` - Enhanced query interface
   - `/query-history` - Card-based timeline
   - `/admin` - User management cards
   - `/profile` - Enhanced profile with new tabs

---

## Step 7: Test Activity Tracking

### Test Login Tracking

1. Login to the application
2. Check the database:
```sql
SELECT * FROM login_history ORDER BY created_at DESC LIMIT 5;
```

You should see a new record with your login information.

### Test Activity Logging

1. Execute a query from the Reports page
2. Check the database:
```sql
SELECT * FROM user_activities WHERE activity_type = 'query_executed' ORDER BY created_at DESC LIMIT 5;
```

### Test Session Management

1. Visit your Profile page
2. Click on the "Sessions" tab
3. You should see your current session
4. Try the "Revoke" button on a different session

---

## Step 8: Test API Endpoints

Use Postman or curl to test the new API endpoints:

### Get Activities
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/activity/activities?limit=10
```

### Get Login History
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/activity/login-history?limit=10
```

### Get Active Sessions
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/activity/sessions
```

### Get Activity Statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/activity/stats?period=month
```

### Revoke Session (replace SESSION_ID)
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/activity/sessions/SESSION_ID
```

---

## Troubleshooting

### Migration Fails

**Error:** `Table already exists`
```bash
# Rollback and try again
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate
```

**Error:** `Cannot find module 'ua-parser-js'`
```bash
# Install the missing package
npm install ua-parser-js
```

### Frontend Issues

**Problem:** Pages don't display correctly
- Clear browser cache: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check browser console for errors
- Verify Tailwind CSS is compiling: `npm run dev` should show no errors

**Problem:** Animations are laggy
- Reduce animation complexity by removing some `animate-*` classes
- Check browser performance in DevTools

### Backend Issues

**Problem:** Activity logging not working
- Check that models are loaded: Look for console logs on server start
- Verify middleware is applied: Check route files
- Enable debug logging: Set `DEBUG=*` in `.env`

**Problem:** Cannot fetch activities
- Verify JWT token is valid
- Check user authentication middleware
- Look at server console for errors

---

## Integration with Existing Code

### Logging Activities in Your Controllers

Add activity logging to any controller action:

```javascript
const { logActivity } = require('../utils/activityLogger');

// In your controller
exports.someAction = async (req, res) => {
  try {
    // Your existing code...

    // Log the activity
    await logActivity(req.user.id, 'activity_type', {
      description: 'User performed some action',
      req,
      metadata: { /* additional data */ }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Using Activity Middleware

Apply activity logging middleware to routes:

```javascript
const { activityMiddleware } = require('../utils/activityLogger');

router.post(
  '/some-action',
  authenticate,
  activityMiddleware('activity_type', (req) => `Performed action on ${req.params.id}`),
  controller.someAction
);
```

---

## Database Cleanup (Optional)

If you want to clean up old activity logs periodically:

```sql
-- Delete login history older than 90 days
DELETE FROM login_history WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Delete user activities older than 90 days
DELETE FROM user_activities WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Delete expired sessions
DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = 0;
```

You can set up a cron job to run this periodically.

---

## Performance Optimization

### Database Indexes

The migration already creates indexes on frequently queried columns. If you notice slow queries, check the explain plan:

```sql
EXPLAIN SELECT * FROM user_activities WHERE user_id = 1 ORDER BY created_at DESC LIMIT 50;
```

### Activity Logging Performance

Activity logging is designed to be non-blocking:
- Uses async/await without blocking main request
- Catches errors to prevent breaking main functionality
- Logs to console if database write fails

---

## Next Steps

After successful setup:

1. **Monitor Performance**: Check database size and query performance
2. **Configure Retention**: Set up automated cleanup of old logs
3. **Add More Tracking**: Identify other user actions to track
4. **Build Analytics**: Create dashboards using the activity data
5. **Set Up Alerts**: Configure notifications for suspicious activities

---

## Rollback Instructions

If you need to rollback the changes:

### 1. Rollback Database
```bash
cd backend
npx sequelize-cli db:migrate:undo
```

### 2. Restore Frontend Files
```bash
cd frontend
git checkout -- src/views/LoginView.vue
git checkout -- src/views/ReportView.vue
git checkout -- src/views/QueryHistoryView.vue
git checkout -- src/views/AdminView.vue
git checkout -- src/views/ProfileView.vue
```

### 3. Remove Backend Files
```bash
cd backend
rm src/models/LoginHistory.js
rm src/models/UserSession.js
rm src/models/UserActivity.js
rm src/controllers/activity.controller.js
rm src/routes/activity.routes.js
rm src/utils/activityLogger.js
rm database/migrations/20250117000001-add-activity-tracking-tables.js
```

### 4. Restore Modified Files
```bash
git checkout -- src/models/index.js
git checkout -- src/routes/index.js
```

---

## Support & Documentation

- **Full Documentation**: See `UI_UX_IMPROVEMENTS.md`
- **Migration File**: `backend/database/migrations/20250117000001-add-activity-tracking-tables.js`
- **Activity Logger**: `backend/src/utils/activityLogger.js`

---

**Setup Time:** ~10-15 minutes
**Difficulty:** Easy to Intermediate
**Requirements:** Node.js, npm, MySQL/MariaDB

Good luck with your improved DPDC AMI system! 🚀
