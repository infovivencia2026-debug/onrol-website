# WhatsApp Utility Template — AI Startup Webinar (confirmation)

Register this in Meta WhatsApp Manager → Message Templates (or your CRM's template UI).
It is a **registration confirmation**, so it qualifies as **UTILITY** (transactional).

---

## Template settings
- **Name:** `ai_startup_webinar_confirm`
- **Category:** UTILITY
- **Language:** English (`en`)

## Header
Type: **Text**
```
You're registered 🎉
```

## Body
*(Body variable `{{1}}` = registrant's first name.)*
```
Hi {{1}}, your seat for *Build a Mini AI Startup in 60 Minutes* is confirmed.

🗓️ This Sunday · 3:00 PM IST
⏱️ 60 minutes · Live · Online

Watch one idea become a working AI website, a chatbot, and an automation — built live. No coding needed.

Tap the button below to join the session.
```

## Footer
```
ONROL — India's AI Execution School
```

## Button
Type: **Call To Action → Visit Website**
- Button text: `Join the Webinar`
- URL type: **Static**
- URL: `https://onrol.in/webinar/build-mini-ai-startup/`  ← *(replace later in CRM with the live meeting/Zoom/YouTube link)*

> If you prefer a per-send dynamic link, set URL type = **Dynamic** with suffix `{{1}}` and pass the join link as the button variable from the CRM.

---

## Sample example values (for template approval)
- Body `{{1}}`: `Priya`
- Button URL (static): `https://onrol.in/webinar/build-mini-ai-startup/`

---

## (Optional) Reminder template — `ai_startup_webinar_reminder`
Same settings; Body:
```
Hi {{1}}, your ONROL webinar *Build a Mini AI Startup in 60 Minutes* starts in 1 hour.

🗓️ Today · 3:00 PM IST · Live

Tap below to join — keep a notebook ready, we build live.
```
Button: `Join Now` → same link.
