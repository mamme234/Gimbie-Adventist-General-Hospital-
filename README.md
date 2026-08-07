## 💳 Payment Integration

### Supported Ethiopian Banks

| Bank | Short Name | Supported Methods |
|------|------------|-------------------|
| Commercial Bank of Ethiopia | CBE | Card, Mobile, Internet Banking |
| Telebirr | Telebirr | Mobile Money |
| Awash Bank | Awash | Card, Internet Banking |
| Coop Bank | Coop | Card, Internet Banking |

### Payment Flow

1. User selects a bank
2. User is redirected to the bank's payment page
3. User completes payment
4. Webhook updates payment status
5. User receives confirmation

### API Endpoints

```bash
# Get available banks
GET /api/v1/payments/banks

# Initiate payment
POST /api/v1/payments/initiate
{
  "amount": 1000,
  "currency": "ETB",
  "bank": "cbe",
  "paymentMethod": "card",
  "description": "Hospital bill payment"
}

# Check payment status
GET /api/v1/payments/status/:transactionId

# Refund payment
POST /api/v1/payments/refund
{
  "transactionId": "CBE-123456-ABC789",
  "amount": 500
}
