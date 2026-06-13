# Email Configuration Instructions

## Setup Email Notifications

To enable email notifications, you need to configure your email credentials in the `.env` file.

**Note:** If email credentials are not configured, the application will work normally but emails won't be sent. Errors will be logged but won't crash the application.

### Option 1: Gmail (Recommended for Testing)

1. Open `.env` file in the root directory
2. Add the following variables:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

3. **Important**: For Gmail, you need to use an "App Password", not your regular password:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Go to "App passwords"
   - Generate a new app password for "Mail"
   - Use that password in EMAIL_PASS

### Option 2: Other Email Providers

For other providers (Outlook, Yahoo, etc.), update the EMAIL_HOST and EMAIL_PORT accordingly:

**Outlook/Hotmail:**

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

**Yahoo:**

```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

### Testing

After configuration:

1. Restart the backend server
2. Create a new booking
3. Check your email inbox for the confirmation

### Disable Email Service

To completely disable email notifications (useful for development), add to your `.env`:

```env
EMAIL_ENABLED=false
```

### Troubleshooting

**Error: "Username and Password not accepted"**
- For Gmail, you MUST use an App Password, not your regular password
- Make sure 2-Step Verification is enabled
- Generate a new App Password at: https://myaccount.google.com/apppasswords

**Error: "Connection timeout"**
- Check your firewall settings
- Verify EMAIL_HOST and EMAIL_PORT are correct
- Try using port 465 with secure: true for Gmail

### Note

If you don't configure email credentials, the application will still work but emails won't be sent. The application will log a warning but continue normally.
