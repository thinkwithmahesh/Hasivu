# Runbook: WhatsApp Webhook Or Signature Failure

**Use when:** WhatsApp webhook verification fails, provider callbacks return `401`, or message statuses stop updating.

## Immediate Response

1. Set `WHATSAPP_MODE=disabled`.
2. Confirm user-facing flows still fall back to email or in-app notification.
3. Do not retry production WhatsApp sends until signature validation is fixed.

## Diagnose

- Confirm `WHATSAPP_APP_SECRET` matches the Meta app secret.
- Confirm the webhook receives the raw request body before JSON mutation.
- Confirm `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches Meta dashboard configuration.
- Check provider dashboard for template rejection, phone-number status, or business verification issues.

## Re-Enable Path

1. Re-enable only `WHATSAPP_MODE=sandbox`.
2. Send a test template event.
3. Verify message log status transitions from `pending` to provider status.
4. Move to production only after Meta business, display name, phone, and templates are approved.
