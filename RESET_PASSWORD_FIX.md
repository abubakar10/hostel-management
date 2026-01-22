# Reset Password Link Not Working - Fix Guide

## Problem
You received the email but when clicking the reset link, you get "ERR_CONNECTION_REFUSED" or "This site can't be reached".

## Solution

### Issue 1: Frontend Server Not Running

The reset link points to your frontend URL, but the frontend server must be running.

**Fix:**
1. Open a new terminal/command prompt
2. Navigate to the client folder:
   ```bash
   cd hostel-management/client
   ```
3. Start the frontend server:
   ```bash
   npm run dev
   ```
4. The frontend should start on `http://localhost:3000`
5. Now try clicking the reset link again

### Issue 2: Wrong Frontend URL in Email

The email link might be pointing to the wrong port.

**Fix:**
1. Check your `server/.env` file
2. Make sure you have:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```
   (Note: Port 3000 is the default from vite.config.js)

3. If your frontend runs on a different port, update `FRONTEND_URL` accordingly
4. Restart your backend server after changing `.env`

### Issue 3: Using the Reset Link

**Option A: Copy the link from email**
1. Copy the entire reset link from the email
2. Make sure your frontend server is running (`npm run dev` in client folder)
3. Paste the link in your browser
4. It should work now

**Option B: Manual reset using token**
1. Copy the token from the email (the long string after `token=`)
2. Go to: `http://localhost:3000/reset-password?token=YOUR_TOKEN&type=student` (or `admin`)
3. Replace `YOUR_TOKEN` with the actual token from the email

### Quick Checklist

- [ ] Frontend server is running (`npm run dev` in client folder)
- [ ] Frontend is accessible at `http://localhost:3000`
- [ ] `FRONTEND_URL=http://localhost:3000` is set in `server/.env`
- [ ] Backend server restarted after `.env` changes
- [ ] Try the reset link again

### Testing the Reset Link

1. **Start Frontend:**
   ```bash
   cd hostel-management/client
   npm run dev
   ```

2. **Start Backend:**
   ```bash
   cd hostel-management/server
   npm run dev
   ```

3. **Test Forgot Password:**
   - Go to `http://localhost:3000/forgot-password`
   - Enter your email
   - Check email for reset link
   - Click the link (frontend must be running!)

### If Frontend is on Different Port

If your frontend runs on a different port (check the terminal output when you run `npm run dev`), update your `.env`:

```env
FRONTEND_URL=http://localhost:YOUR_PORT
```

For example, if it's running on port 5173:
```env
FRONTEND_URL=http://localhost:5173
```

### Production Deployment

If you're deploying to production (Netlify, Vercel, etc.), set:

```env
FRONTEND_URL=https://your-domain.com
```

Make sure to update this before sending reset emails in production!

---

**Remember:** The frontend server MUST be running for the reset link to work!

