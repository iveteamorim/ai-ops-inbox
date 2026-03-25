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
