# 🎯 Easy Database Setup Using pgAdmin (GUI Method)

The easiest way to set up the database is using **pgAdmin** - the graphical interface that comes with PostgreSQL.

## Step 1: Open pgAdmin

1. Search for **"pgAdmin 4"** in Windows Start Menu
2. Open it
3. It will open in your web browser

## Step 2: Connect to PostgreSQL

1. In the left sidebar, expand **"Servers"**
2. Click on **"PostgreSQL 16"** (or whatever version you have)
3. Enter your password when prompted (probably: **admin** or **postgres**)

## Step 3: Create Database

1. Right-click on **"Databases"**
2. Click **"Create" → "Database..."**
3. In the dialog:
   - **Database name:** `dpdc_ami_dev`
   - **Owner:** `postgres`
4. Click **"Save"**

## Step 4: Create User

1. In the left sidebar, expand **"Login/Group Roles"**
2. Right-click and select **"Create" → "Login/Group Role..."**
3. In the **"General"** tab:
   - **Name:** `dev_user`
4. Click on the **"Definition"** tab:
   - **Password:** `admin`
5. Click on the **"Privileges"** tab:
   - Check: **Can login?** ✓
   - Check: **Create databases?** ✓
6. Click **"Save"**

## Step 5: Grant Permissions

1. Click on **"Databases"** in the left sidebar
2. Find and click **"dpdc_ami_dev"**
3. Click **Tools** menu → **Query Tool**
4. Copy and paste this SQL:

```sql
-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE dpdc_ami_dev TO dev_user;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO dev_user;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dev_user;
```

5. Click the **Play** button (▶️) or press **F5**
6. You should see: **"Query returned successfully"**

## Step 6: Verify Setup

In the Query Tool, run:

```sql
-- Check if database exists
SELECT datname FROM pg_database WHERE datname = 'dpdc_ami_dev';

-- Check if user exists
SELECT usename FROM pg_user WHERE usename = 'dev_user';
```

You should see both `dpdc_ami_dev` and `dev_user` in the results!

## ✅ Done!

Your database is now set up with:
- **Database:** dpdc_ami_dev
- **User:** dev_user
- **Password:** admin
- **Host:** localhost
- **Port:** 5432

## 🎯 Next Steps

Now proceed with backend setup:

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Create Environment File

```bash
copy .env.example .env.development
```

The file already has the correct database settings:
- Database: `dpdc_ami_dev`
- User: `dev_user`
- Password: `admin`

### 3. Update Oracle Credentials

Edit `backend\.env.development` and update:

```env
DB_USER=your_oracle_username
DB_PASSWORD="your_oracle_password"
DB_HOST=your_oracle_host
DB_PORT=1521
DB_SERVICE_NAME=service_name
DB_CONNECT_STRING=your_oracle_host:1521/service_name
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Seed Initial Data

```bash
npm run seed
```

### 6. Start Backend

```bash
npm run dev
```

You should see:
```
✅ PostgreSQL connected successfully [development]
🚀 Server running on port 3000
```

### 7. Setup Frontend (New Terminal)

```bash
cd frontend
npm install
copy .env.example .env.development
npm run dev
```

### 8. Open Application

Browser: **http://localhost:5173**

Login:
- Username: `admin`
- Password: `Admin@123`

🎉 **You're done!**
