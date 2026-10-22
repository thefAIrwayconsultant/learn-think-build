---
name: Responsive Clerk styling
description: Why authentication sizing uses app-owned appearance classes rather than internal Clerk selectors.
---

Use Clerk's public `appearance.elements` API to attach app-owned classes for responsive authentication sizing and colors. Avoid structural CSS selectors targeting `.cl-*` internals.

**Why:** Clerk's hosted UI can update independently of the app. Targeting its internal structure produced a browser warning that those overrides could break on a future UI update. App-owned appearance classes allow phone-width fixes without adding a separate pinned UI package.

**How to apply:** Keep the existing canonical Clerk proxy and host-aware key setup. For layout fixes, attach classes through appearance and constrain those classes to the available container width; verify 320px and 390px rather than hiding horizontal overflow.
