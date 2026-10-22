---
name: Stripe connector access
description: Use the connected Stripe proxy when raw API credentials are not exposed to the workspace.
---

Use Replit Connectors proxy requests for Stripe API calls instead of retrieving or storing raw API keys. In this workspace, the Stripe connection was ready for proxy calls, but direct credential lookup returned no API key. Product, price, and billing-portal configuration requests succeeded through the proxy.

**Why:** The connected integration keeps credentials server-managed, so code that assumes it can read a Stripe secret key fails even while the connection is usable.

**How to apply:** For future Stripe billing work, use `@replit/connectors-sdk` in app code and the connected proxy for one-off operations. Query Stripe directly for current subscription state; do not assume webhook-sync credentials are available.
