# PayPal Integration Environment Variables Setup

## Required Environment Variables

Add these variables to your `.env` file for PayPal payment integration:

```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_ENVIRONMENT=sandbox

# PayPal Webhook Configuration (for automatic emails)
PAYPAL_WEBHOOK_ID=your_webhook_id_from_paypal_dashboard

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## PayPal Setup Instructions

### 1. Create PayPal Developer Account
1. Go to [PayPal Developer Portal](https://developer.paypal.com/)
2. Sign in with your PayPal account or create a new one
3. Navigate to "My Apps & Credentials"

### 2. Create a New App
1. Click "Create App"
2. Choose "Default Application" or "Custom App"
3. Select "Sandbox" for testing or "Live" for production
4. Note down your Client ID and Client Secret

### 3. Configure Your App
1. **App Name**: PlwgsCreativeApparel
2. **Merchant Account**: Your business PayPal account
3. **Features**: Enable "Accept payments" and "Future payments"

### 4. Environment Variables

#### For Development (Sandbox)
```bash
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_ENVIRONMENT=sandbox
```

#### For Production (Live)
```bash
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_ENVIRONMENT=live
```

### 5. Update Checkout Page
In `pages/checkout.html`, replace `YOUR_PAYPAL_CLIENT_ID` with your actual Client ID:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_ACTUAL_CLIENT_ID&currency=USD&intent=capture&enable-funding=venmo,card&disable-funding=paylater,paypalcredit"></script>
```

## Payment Methods Supported

The integration supports:
- ✅ PayPal payments
- ✅ Credit cards (Visa, Mastercard, American Express, Discover)
- ✅ Debit cards
- ✅ Venmo (if enabled)

## Testing

### Sandbox Testing
1. Use PayPal sandbox accounts for testing
2. Create test buyer and seller accounts in PayPal Developer Portal
3. Test with sandbox credit card numbers provided by PayPal

### Test Credit Card Numbers (Sandbox)
- **Visa**: 4032031234567890
- **Mastercard**: 5555555555554444
- **American Express**: 378282246310005
- **Discover**: 6011111111111117

## Security Notes

1. **Never commit** your Client Secret to version control
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** in production
4. **Validate payments** on the server side
5. **Store payment details** securely in your database

## Webhook Configuration (Required for Email Notifications)

**IMPORTANT**: Webhooks are required for automatic email notifications when payments are completed.

### Quick Setup
1. In PayPal Developer Portal, go to your app
2. Scroll to "Sandbox Webhooks" section
3. Click "Add Webhook"
4. Set webhook URL: `https://yourdomain.com/api/paypal/webhook`
5. Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`
6. Save and copy the Webhook ID to your .env file

### Detailed Setup
See `PAYPAL_WEBHOOK_SETUP.md` for complete webhook configuration instructions including local testing with ngrok.

## Troubleshooting

### Common Issues
1. **"PayPal not configured"**: Check your environment variables
2. **"Invalid client ID"**: Verify your Client ID is correct
3. **"Payment failed"**: Check your Client Secret and environment setting
4. **CORS errors**: Ensure your domain is added to PayPal app settings

### Debug Mode
Set `LOG_LEVEL=debug` in your environment to see detailed PayPal logs.

## Production Checklist

Before going live:
- [ ] Switch to live environment (`PAYPAL_ENVIRONMENT=live`)
- [ ] Use live Client ID and Secret
- [ ] Test with real PayPal accounts
- [ ] Enable HTTPS
- [ ] Set up webhooks for order tracking and email notifications
- [ ] Test all payment methods
- [ ] Verify order fulfillment process
- [ ] Test webhook email notifications
- [ ] Update FRONTEND_URL to production domain
