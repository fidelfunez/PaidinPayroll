# Admin Console Setup Guide

## Overview

The admin console provides visibility and control over all users on the PaidIn platform. This includes:
- Email notifications when new users sign up
- Admin dashboard to view all users
- Ability to block/unblock users
- Ability to delete users
- Platform statistics

## Features Implemented

### 1. Email Notifications ✅
- **When**: Every time a new user signs up
- **Who receives**: Email address set in `ADMIN_EMAIL` environment variable
- **What's included**:
  - User's name, username, email
  - Company name
  - Plan selected
  - Signup date
  - Link to admin console

### 2. Admin API Endpoints ✅
All endpoints require admin authentication:

- `GET /api/admin/users` - List all users (with search, pagination)
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users/:id/block` - Block a user
- `POST /api/admin/users/:id/unblock` - Unblock a user
- `DELETE /api/admin/users/:id` - Delete a user
- `GET /api/admin/stats` - Get platform statistics

### 3. Admin Dashboard ✅
- **Route**: `/admin`
- **Access**: Only users with `admin` or `platform_admin` role
- **Features**:
  - Platform statistics (total users, active users, verified users, companies, recent signups)
  - User list with search
  - Block/unblock users
  - Delete users (with confirmation)
  - View user details

## Setup Instructions

### 1. Set Admin Email

Set the `ADMIN_EMAIL` environment variable to receive notifications:

**Local Development (.env):**
```env
ADMIN_EMAIL=your-email@example.com
```

**Production (Fly.io):**
```bash
fly secrets set ADMIN_EMAIL="your-email@example.com" --app paidin-app
```

### 2. Access Admin Console

1. Log in as an admin user (any user with `role: 'admin'`)
2. Navigate to `/admin` or click "Admin Console" in the sidebar
3. You'll see:
   - Platform statistics
   - User list with search
   - Actions to block/delete users

### 3. Admin Access Control

Currently, any user with `role: 'admin'` can access the admin console. This includes:
- Company admins (users who signed up and created a company)
- Platform admins (if you create a platform_admin user)

**Future Enhancement**: You may want to restrict admin console access to only `platform_admin` role users. To do this, update the `requireAdminAccess` middleware in `server/modules/admin/routes.ts`.

## Usage

### Viewing Users

1. Go to `/admin`
2. Use the search bar to find users by:
   - Username
   - Email
   - Name
   - Company name
3. View user details in the table

### Blocking a User

1. Find the user in the list
2. Click the block icon (UserX icon)
3. User's `isActive` status will be set to `false`
4. Blocked users cannot log in

### Unblocking a User

1. Find the blocked user (they'll show as "Blocked" status)
2. Click the unblock icon (UserCheck icon)
3. User's `isActive` status will be set to `true`
4. User can log in again

### Deleting a User

1. Find the user in the list
2. Click the delete icon (Trash icon)
3. Confirm deletion in the dialog
4. User and all associated data will be permanently deleted

**Warning**: Deletion is permanent and cannot be undone!

## Security Considerations

1. **Access Control**: Admin routes are protected by `requireAdminAccess` middleware
2. **Self-Protection**: You cannot block or delete your own account
3. **Audit Logging**: All admin actions are logged to the console
4. **Email Notifications**: You'll be notified of every new signup

## Future Enhancements

Consider adding:
- Activity logs (track user actions)
- Suspicious activity detection
- User export (CSV/JSON)
- Bulk actions (block/delete multiple users)
- User detail view with full activity history
- Email notifications for suspicious activity
- Two-factor authentication for admin accounts

## Troubleshooting

### Not receiving email notifications?
- Check `ADMIN_EMAIL` is set correctly
- Check `RESEND_API_KEY` is configured
- Check spam folder
- Check server logs for email errors

### Can't access admin console?
- Verify your user has `role: 'admin'`
- Check you're logged in
- Check browser console for errors

### Users not showing up?
- Check database connection
- Check user has `role: 'admin'` to access
- Check server logs for errors

## API Examples

### List Users
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://paidin-app.fly.dev/api/admin/users
```

### Block User
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://paidin-app.fly.dev/api/admin/users/123/block
```

### Get Stats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://paidin-app.fly.dev/api/admin/stats
```
