# PayPal Webhook Setup Guide

## Overview
This guide will help you set up PayPal webhooks to automatically send payment confirmation emails when customers complete their purchases.

## What Webhooks Do
- **Automatic Email Notifications**: When a payment is completed, both you and the customer receive confirmation emails
- **Order Status Updates**: Orders are automatically marked as "completed" in your database
- **Real-time Processing**: No manual intervention needed for payment confirmations

## Step 1: Get Your Webhook URL

Your webhook URL will be:
```
https://your-domain.com/api/paypal/webhook
```

For local testing:
```
http://localhost:3000/api/paypal/webhook
```

## Step 2: Configure Webhook in PayPal Dashboard

1. **Go to PayPal Developer Dashboard**
   - Visit: https://developer.paypal.com/
   - Log in with your PayPal account

2. **Navigate to Your App**
   - Click on "Apps & Credentials"
   - Select your "PlwgsCreativeApparel" app

3. **Add Webhook**
   - Scroll down to "Sandbox Webhooks" section
   - Click "Add Webhook" button

4. **Configure Webhook Settings**
   - **Webhook URL**: Enter your webhook URL (see Step 1)
   - **Event Types**: Select these events:
     - `PAYMENT.CAPTURE.COMPLETED` (when payment succeeds)
     - `PAYMENT.CAPTURE.DENIED` (when payment fails)
     - `PAYMENT.CAPTURE.REFUNDED` (when payment is refunded)

5. **Save Webhook**
   - Click "Save" to create the webhook
   - Copy the **Webhook ID** (you'll need this for your .env file)

## Step 3: Update Your .env File

Add these new environment variables to your `.env` file:

```env
# PayPal Configuration (existing)
PAYPAL_CLIENT_ID=AUohJ1eTQUiUwAUVOJTMFhPYxeY0h4p356VCXmaFIx0D-PVoj3S-z1P03XoqPjE40DXKrSotB0N7ggNF
PAYPAL_CLIENT_SECRET=EDegbRdgkyMgsIC7zjpSuQuAh_S68hLbs5tX87nNTvWi7udirnqWzQY7mXYuHg6qzGGJhiEXLPTU2EiF
PAYPAL_ENVIRONMENT=sandbox

# PayPal Webhook Configuration (new)
PAYPAL_WEBHOOK_ID=your_webhook_id_from_paypal_dashboard

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## Step 4: Test the Webhook

### Local Testing with ngrok (Recommended)

1. **Install ngrok** (if not already installed):
   ```bash
   npm install -g ngrok
   ```

2. **Start your server**:
   ```bash
   npm start
   ```

3. **In a new terminal, expose your local server**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Update webhook URL in PayPal**:
   - Use: `https://abc123.ngrok.io/api/paypal/webhook`

### Test Payment Flow

1. **Add items to cart** on your website
2. **Proceed to checkout** and complete PayPal payment
3. **Check your email** - you should receive:
   - Customer confirmation email
   - Admin notification email
4. **Check your database** - order status should be "completed"

## Step 5: Production Setup

When you deploy to production:

1. **Update webhook URL** in PayPal dashboard to your production domain
2. **Update .env variables**:
   ```env
   PAYPAL_ENVIRONMENT=live
   FRONTEND_URL=https://your-domain.com
   ```
3. **Use live PayPal credentials** (not sandbox)

## Webhook Events Handled

| Event | Description | Action Taken |
|-------|-------------|--------------|
| `PAYMENT.CAPTURE.COMPLETED` | Payment successful | Send confirmation emails, update order status |
| `PAYMENT.CAPTURE.DENIED` | Payment failed | Update order status to "denied" |
| `PAYMENT.CAPTURE.REFUNDED` | Payment refunded | Update order status to "refunded" |

## Email Templates

### Customer Confirmation Email
- Order details and items
- Payment confirmation
- Shipping information
- Link to order success page

### Admin Notification Email
- New payment received alert
- Complete order information
- Customer details
- Link to admin dashboard

## Troubleshooting

### Webhook Not Working?
1. **Check webhook URL** - must be publicly accessible
2. **Verify event types** - ensure correct events are selected
3. **Check server logs** - look for webhook processing errors
4. **Test with ngrok** - ensures local development works

### Emails Not Sending?
1. **Check SMTP settings** in your .env file
2. **Verify email addresses** are correct
3. **Check spam folder** - emails might be filtered
4. **Review server logs** for email errors

### Order Not Updating?
1. **Check database connection**
2. **Verify order ID mapping** in webhook data
3. **Review webhook processing logs**

## Security Notes

- Webhooks should verify PayPal signatures in production
- Use HTTPS for webhook URLs
- Keep webhook IDs and secrets secure
- Monitor webhook logs for suspicious activity

## Support

If you need help:
1. Check PayPal Developer Documentation
2. Review server logs for errors
3. Test with PayPal's webhook simulator
4. Contact PayPal Developer Support

---

**Next Steps**: After setting up webhooks, test the complete payment flow to ensure emails are sent automatically when customers complete purchases.
