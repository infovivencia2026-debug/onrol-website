# Email — AI Startup Webinar (confirmation)

On-brand (orange/white/black), inline-styled so it renders in all clients.
Replace `{{NAME}}` and `{{WEBINAR_LINK}}` from your CRM/ESP.

**Subject:** You're in 🎉 — Build a Mini AI Startup in 60 Minutes (this Sunday, 3 PM)

**Preheader:** One idea → an AI website, a chatbot, and an automation. Built live.

---

## HTML

```html
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f5f2;font-family:Inter,Arial,Helvetica,sans-serif;color:#0A0A0A;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f2;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#ffffff;border:1px solid rgba(10,10,10,0.10);">
          <!-- Header -->
          <tr><td style="padding:24px 32px;border-bottom:1px solid rgba(10,10,10,0.10);">
            <span style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f46718;">ONROL · Free Live Webinar</span>
          </td></tr>
          <!-- Hero -->
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:30px;line-height:1.1;font-weight:900;color:#0A0A0A;">
              You're registered, {{NAME}} 🎉
            </h1>
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0A0A0A;">
              Build a Mini <span style="color:#f46718;">AI Startup</span> in 60 Minutes
            </p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(10,10,10,0.7);">
              One idea. One AI website. One chatbot. One automation. Built live — no coding required.
            </p>

            <!-- When -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid rgba(10,10,10,0.15);margin:0 0 24px;">
              <tr><td style="padding:12px 16px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#0A0A0A;">
                🗓️ This Sunday · 3:00 PM IST · 60 min · Online
              </td></tr>
            </table>

            <!-- CTA -->
            <a href="{{WEBINAR_LINK}}" style="display:inline-block;background:#f46718;color:#0A0A0A;text-decoration:none;font-weight:800;text-transform:uppercase;letter-spacing:1px;font-size:14px;padding:14px 28px;">
              Join the Webinar &rarr;
            </a>

            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(10,10,10,0.6);">
              <strong style="color:#0A0A0A;">What you'll see built live:</strong><br/>
              + One idea turned into a clear business offer<br/>
              + AI-powered landing page built live<br/>
              + Chatbot added for visitor interaction<br/>
              + Lead-capture form + automation workflow<br/>
              + Launch content ideas + a one-person-as-a-team bonus
            </p>
          </td></tr>
          <!-- Footer -->
          <tr><td style="padding:20px 32px;border-top:1px solid rgba(10,10,10,0.10);font-size:12px;color:rgba(10,10,10,0.55);">
            ONROL — India's AI Execution School · You received this because you registered for the free webinar.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>
```

## Plain-text fallback
```
You're registered, {{NAME}}!

Build a Mini AI Startup in 60 Minutes — ONROL free live webinar.
This Sunday · 3:00 PM IST · 60 min · online. No coding required.

Join here: {{WEBINAR_LINK}}

What you'll see built live: a business offer, an AI landing page, a chatbot,
a lead-capture + automation workflow, launch content ideas, and a
one-person-as-a-team bonus.

— ONROL, India's AI Execution School
```
