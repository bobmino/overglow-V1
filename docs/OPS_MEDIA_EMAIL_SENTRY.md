# Ops — Media, Email & Monitoring

## Cloudinary
Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` on the backend.
Uploads go through `backend/middleware/uploadMiddleware.js` → `cloudinaryService.js`.
Frontend resolves image URLs via `frontend/src/utils/formatImage.js` (`VITE_API_URL` for `/uploads/*`).

## Email (Resend)
Set `RESEND_API_KEY` and `RESEND_FROM`.
On payment confirmation (`bookingPaymentService.validateAndConfirmBookingPayment`), `NotificationHub` dispatches `BOOKING_SUCCESS` → Resend premium template.

Optional SMTP fallback: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_ENABLED`.

## Sentry
- Backend: `SENTRY_DSN`
- Frontend: `VITE_SENTRY_DSN`

Both init at startup; missing DSN is a no-op (no crash).

## Stripe webhooks
Endpoint: `POST /api/payments/webhook/stripe`
Env: `STRIPE_WEBHOOK_SECRET`
Configure in Stripe Dashboard → Webhooks → `payment_intent.succeeded`, `payment_intent.payment_failed`.

## PayPal webhooks
Endpoint: `POST /api/payments/webhook/paypal`
Env: `PAYPAL_WEBHOOK_ID` (optional verification headers)
Also: `POST /api/payments/capture-paypal-order` after client approval.
