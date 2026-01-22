# Email Setup Guide for Password Reset

This guide will help you configure email functionality for the password reset feature in both localhost and production environments.

## 📧 Email Configuration

The system uses **Nodemailer** to send password reset emails. You can use any SMTP service provider.

## 🔧 Setup Instructions

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Add to `.env` file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FRONTEND_URL=http://localhost:5173
```

### Option 2: Other SMTP Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FRONTEND_URL=https://your-domain.com
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-ses-username
SMTP_PASS=your-aws-ses-password
FRONTEND_URL=https://your-domain.com
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
FRONTEND_URL=https://your-domain.com
```

## 🌐 Environment Variables

Add these to your `server/.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:5173  # For localhost
# FRONTEND_URL=https://your-domain.com  # For production
```

**Alternative variable names** (also supported):
- `EMAIL_USER` instead of `SMTP_USER`
- `EMAIL_PASSWORD` or `EMAIL_APP_PASSWORD` instead of `SMTP_PASS`
- `CLIENT_URL` instead of `FRONTEND_URL`

## 🚀 Installation

1. **Install nodemailer** (if not already installed):
```bash
cd server
npm install nodemailer
```

2. **Configure your `.env` file** with SMTP credentials

3. **Restart your server**:
```bash
npm run dev
```

## ✅ Testing Email Configuration

1. Start your server
2. Go to the Forgot Password page
3. Enter an email address
4. Check the server console for:
   - ✅ "Email sent successfully" - Email is working!
   - ⚠️ "Email not configured" - Check your SMTP settings
   - ❌ Error message - Check your credentials

## 🔍 Troubleshooting

### Gmail Issues

**Problem**: "Invalid login" or "Authentication failed"
- **Solution**: Use an App Password, not your regular Gmail password
- Make sure 2-Factor Authentication is enabled

**Problem**: "Less secure app access"
- **Solution**: Gmail no longer supports less secure apps. Use App Passwords instead.

### General Issues

**Problem**: Emails not sending
- Check if `SMTP_USER` and `SMTP_PASS` are set correctly
- Verify SMTP host and port
- Check firewall/network settings
- For Gmail, ensure you're using an App Password

**Problem**: "Connection timeout"
- Check if port 587 is blocked by firewall
- Try port 465 with `SMTP_SECURE=true`
- Verify SMTP host is correct

**Problem**: Emails going to spam
- Configure SPF, DKIM, and DMARC records (for production)
- Use a reputable email service (SendGrid, AWS SES, Mailgun)
- Avoid using free email services in production

## 📝 Production Recommendations

For production, use a professional email service:

1. **SendGrid** - Free tier: 100 emails/day
2. **AWS SES** - Very affordable, pay-as-you-go
3. **Mailgun** - Free tier: 5,000 emails/month
4. **Postmark** - Great deliverability

These services provide:
- Better deliverability
- Email analytics
- Higher sending limits
- Professional support

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use App Passwords, not regular passwords
- Rotate passwords regularly
- Use environment-specific credentials
- In production, use a dedicated email service

## 📧 Email Template

The system includes a beautiful HTML email template with:
- Professional design
- Mobile-responsive layout
- Clear call-to-action button
- Security warnings
- Token display (if needed)

You can customize the template in `server/config/email.js`.

## 🎯 Quick Start (Gmail)

1. Enable 2FA on Gmail
2. Generate App Password
3. Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
```
4. Restart server
5. Test forgot password!

---

**Need Help?** Check the server console logs for detailed error messages.

