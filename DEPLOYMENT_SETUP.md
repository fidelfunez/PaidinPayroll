# 🚀 Deployment Setup for Fidel User

## Important: Database Setup on Deployment

The database file (`paidin.db`) is **NOT** included in git (it's in `.gitignore`). This means when you deploy, you need to create the Fidel user on the production server.

## ✅ Files to Push

The following files should be committed and pushed:

### 1. Scripts (New)
- `server/scripts/create-fidel-user.ts` - Creates/fixes Fidel user
- `server/scripts/test-fidel-login.ts` - Tests login at database level
- `server/scripts/verify-fidel-setup.ts` - Comprehensive verification
- `server/scripts/test-login-api.ts` - Tests API endpoint

### 2. Documentation (New)
- `FIDEL_USER_SETUP.md` - Setup and troubleshooting guide
- `DEPLOYMENT_SETUP.md` - This file

### 3. Configuration Updates
- `.gitignore` - Added database files to ignore list

## 📋 Deployment Steps

### For Local Development
Already done! The Fidel user exists in your local database.

### For Production/Deployment

1. **Deploy your code** (scripts and documentation)

2. **Run the setup script on production server:**
   ```bash
   npx tsx server/scripts/create-fidel-user.ts
   ```

3. **Verify the user was created:**
   ```bash
   npx tsx server/scripts/verify-fidel-setup.ts
   ```

4. **Test the login:**
   - Use credentials: `fidel` / `password123`
   - Should work immediately after running the script

## 🔧 Automated Setup (Recommended)

### Option 1: Add to Deployment Script

Add this to your deployment script (`deploy.sh` or similar):

```bash
# After deploying code
echo "Setting up Fidel user..."
npx tsx server/scripts/create-fidel-user.ts
```

### Option 2: Add to Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "setup:fidel": "tsx server/scripts/create-fidel-user.ts",
    "postinstall": "npm run setup:fidel"
  }
}
```

### Option 3: Manual Setup

After deployment, SSH into your server and run:
```bash
npx tsx server/scripts/create-fidel-user.ts
```

## 🎯 Y Combinator Demo Credentials

After running the setup script on production:

- **Username**: `fidel`
- **Email**: `fidel@paidin.com`
- **Password**: `password123`
- **Role**: `super_admin` (full access)

## ✅ Verification

After deployment, verify everything works:

```bash
# 1. Verify user exists and is configured correctly
npx tsx server/scripts/verify-fidel-setup.ts

# 2. Test database-level authentication
npx tsx server/scripts/test-fidel-login.ts

# 3. Test API endpoint (requires server to be running)
npx tsx server/scripts/test-login-api.ts
```

## 🔍 Troubleshooting

### If user doesn't exist after deployment:
1. Check if script ran successfully
2. Check database file permissions
3. Verify database path is correct
4. Run verification script to see what's wrong

### If login fails:
1. Run verification script: `npx tsx server/scripts/verify-fidel-setup.ts`
2. Check server logs for authentication errors
3. Verify JWT_SECRET is set (defaults to SESSION_SECRET)
4. Ensure company exists (script creates it if missing)

## 📝 Notes

- The database file is **NOT** in git (it's in `.gitignore`)
- Each environment needs to run the setup script
- The script is idempotent (safe to run multiple times)
- The script will create the user if it doesn't exist, or update it if it does

## 🎉 Ready for Deployment

Once you've:
1. ✅ Committed the scripts and documentation
2. ✅ Added deployment setup step to run the script
3. ✅ Tested on production server

You're ready for Y Combinator demo!

