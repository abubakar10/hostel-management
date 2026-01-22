# Forgot Password Troubleshooting Guide

## Common Issues and Solutions

### 1. Server Won't Start - "Cannot find package 'nodemailer'"

**Solution:** Install nodemailer
```bash
cd server
npm install nodemailer
```

### 2. Email Not Sending - Check Your .env Configuration

Make sure your `.env` file in the `server` folder has these variables:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FRONTEND_URL=http://localhost:5173
```

**Important:**
- `SMTP_USER` should be your Gmail address
- `SMTP_PASS` should be your 16-character App Password (NOT your regular Gmail password)
- Remove spaces from App Password if it has them: `xxxx xxxx xxxx xxxx` → `xxxxxxxxxxxxxxxx`

### 3. Authentication Failed (EAUTH Error)

**Possible causes:**
- Using regular Gmail password instead of App Password
- App Password is incorrect
- 2-Step Verification not enabled

**Solution:**
1. Go to: https://myaccount.google.com/apppasswords
2. Generate a new App Password
3. Copy the 16-character password (without spaces)
4. Update `SMTP_PASS` in `.env` file
5. Restart the server

### 4. Connection Failed (ECONNECTION Error)

**Possible causes:**
- Wrong SMTP host or port
- Firewall blocking port 587
- Network issues

**Solution:**
- For Gmail: Use `smtp.gmail.com` and port `587`
- Check if port 587 is blocked by firewall
- Try port 465 with `SMTP_SECURE=true`

### 5. Email Sent But Not Received

**Check:**
1. Spam/Junk folder
2. Email address is correct
3. Server console shows "✅ Email sent successfully"
4. Check Gmail "Sent" folder to verify

### 6. Testing Email Configuration

1. **Check server console logs:**
   - ✅ "nodemailer loaded successfully" - nodemailer is installed
   - ✅ "SMTP connection verified successfully" - Connection works
   - ✅ "Email sent successfully" - Email was sent
   - ❌ Any error messages - Check the error details

2. **Test the forgot password flow:**
   - Go to `/forgot-password` page
   - Enter a valid email
   - Check server console for detailed logs
   - Check email inbox (and spam folder)

### 7. Environment Variables Not Loading

**Make sure:**
- `.env` file is in the `server` folder (not root)
- File is named exactly `.env` (not `.env.txt`)
- No quotes around values in `.env` file
- Restart server after changing `.env`

**Example .env format:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=myemail@gmail.com
SMTP_PASS=abcdefghijklmnop
FRONTEND_URL=http://localhost:5173
```

### 8. Server Console Logs to Watch For

**Success indicators:**
```
✅ nodemailer loaded successfully
📧 Attempting to send email...
   To: user@example.com
   SMTP Host: smtp.gmail.com
   SMTP User: your-email@gmail.com
🔍 Verifying SMTP connection...
✅ SMTP connection verified successfully
📤 Sending email...
✅ Email sent successfully!
   Message ID: <...>
```

**Error indicators:**
```
⚠️  nodemailer not installed
❌ Error sending email: Authentication failed
❌ Error sending email: Connection failed
```

### 9. Quick Checklist

- [ ] nodemailer installed (`npm install nodemailer`)
- [ ] `.env` file exists in `server` folder
- [ ] `SMTP_USER` set in `.env`
- [ ] `SMTP_PASS` set in `.env` (App Password, not regular password)
- [ ] 2-Step Verification enabled on Gmail
- [ ] App Password generated from Google
- [ ] Server restarted after `.env` changes
- [ ] Check server console for error messages

### 10. Alternative Email Providers

If Gmail doesn't work, try these:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Need More Help?

1. Check server console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test SMTP connection using online tools
4. Make sure you're using App Password for Gmail, not regular password

