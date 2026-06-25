# Messaging Integration (Ready-to-connect)

## 1) Database
Run `db/schema.sql` in Supabase SQL editor.

Minimum setup after schema:
- create one `companies` row
- create one `channels` row for WhatsApp:
  - `type = 'whatsapp'`
  - `external_account_id = <meta_phone_number_id>`
  - `company_id = <your_company_id>`
  - `is_active = true`

## 2) Environment
Use `.env.example` as template.

Required for API routes:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN`

Optional for customer self-service setup:
- `NEXT_PUBLIC_ENABLE_WHATSAPP_EMBEDDED_SIGNUP=true`
- `NEXT_PUBLIC_META_APP_ID`
- `NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID`
- `NEXT_PUBLIC_META_API_VERSION` (defaults to `v23.0`)

When enabled, owners/admins see the Meta Embedded Signup action in `/settings#whatsapp-setup`.
The fallback manual setup request stays visible so onboarding can continue if Meta blocks or cancels the embedded flow.

For paid self-service, configure the Stripe plan Payment Links to redirect back to
`/settings#whatsapp-setup` after successful payment. That makes the customer flow:
signup -> choose plan -> pay -> connect WhatsApp.

## 3) Endpoints
### Verify webhook
`GET /api/webhooks/whatsapp`
- validates `hub.verify_token`
- returns `hub.challenge` on success

### Receive inbound WhatsApp messages
`POST /api/webhooks/whatsapp`
- validates `X-Hub-Signature-256` against `WHATSAPP_APP_SECRET`
- parses Meta payload
- maps `phone_number_id` -> `channels.external_account_id`
- upserts contact/conversation
- inserts inbound message
- deduplicates by `external_message_id`

### Messages API
`GET /api/messages?conversation_id=<id>`
- returns ordered messages

`POST /api/messages`
```json
{
  "conversation_id": "<uuid>",
  "text": "Hello Maria"
}
```
- stores outbound message (company inferred from authorized conversation)
- updates conversation timestamps

## Notes
- If Supabase is not configured, `POST /api/webhooks/whatsapp` can return `202 supabase_not_configured` (safe no-op).
- `GET/POST /api/messages` return `503 supabase_not_configured` to avoid insecure fallback behavior.
