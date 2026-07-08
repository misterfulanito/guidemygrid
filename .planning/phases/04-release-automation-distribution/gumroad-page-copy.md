# GuideMyGrid — Gumroad Listing: Page Copy & Setup Guide

This document has two parts:

- **Section A** is ready-to-paste copy for your Gumroad product page.
- **Section B** is a numbered, plain-language walkthrough for creating the listing and wiring up the "always current" download link.

Creating the actual Gumroad account and publishing the listing is something only you can do (Claude can't sign up for services on your behalf) — but everything you need to paste and every setting you need to click is spelled out below.

---

## Section A — Page copy (paste this into Gumroad)

### Product title

```
GuideMyGrid — Column & Row Grid Generator for Photoshop
```

### Tagline (short, one-line)

```
Precise column, row, and guide layouts for Photoshop — free, no Marketplace required.
```

### Description (paste into the product description field)

```
GuideMyGrid is a free Photoshop plugin that generates precise column and row
grids and guide lines directly on your document — no more eyeballing margins
or manually dragging guides one at a time.

Set your number of columns, rows, gutters, and margins, and GuideMyGrid draws
exact guide lines in your active Photoshop document instantly. It also gives
you one-click buttons for common individual guides — left, right, top,
bottom, and centered — so quick layout tweaks don't require the full grid
form.

What it does:
- Generates column and row grids with configurable gutters and margins
- Adds individual edge and center guides with a single click
- Works directly inside Photoshop's guide system (no flattening, no extra
  layers)
- Free to use, no license key, no account required inside Photoshop

How to install:
Download the plugin file below, then install it through Adobe Creative
Cloud Desktop (the same app Photoshop already uses to manage your other
plugins). A full step-by-step install guide — including what to expect
during install — is included with the download and on the project's GitHub
page.

Note: GuideMyGrid is distributed independently (not through the Adobe
Marketplace), so Creative Cloud Desktop may show a "couldn't verify
developer" style notice during install. This is expected for independently
distributed plugins and doesn't mean anything is wrong — a fuller explanation
of exactly why that notice appears, and how to confirm the file you
downloaded hasn't been tampered with, is coming with the plugin's full
install documentation.
```

### Feature bullet list (if Gumroad's editor has a separate bullet-list field)

```
- Column & row grid generation with custom gutters and margins
- One-click individual edge/center guides
- Works natively with Photoshop's built-in guide system
- Free — no license key, no payment, no account needed in-app
- Installed via Adobe Creative Cloud Desktop
```

### Price

```
$0 (Free)
```

---

## Section B — Step-by-step Gumroad setup (do this in your Gumroad account)

These steps assume you don't have a Gumroad account yet. If you already have one, skip to step 2.

1. **Create a Gumroad account.**
   Go to gumroad.com and sign up (email + password, or a social login). This is free — Gumroad doesn't require any payment info to create an account or list a free product.

2. **Create a new product, priced at $0 (free).**
   From your Gumroad dashboard, choose "New product." When Gumroad asks for a price, set it to **$0 / Free**. You will not need any of Gumroad's paid-product features (license keys, payment processing) for this listing.

3. **Paste the Section A copy.**
   Copy the product title, tagline, and description from Section A above into the matching fields in Gumroad's product editor.

4. **Set up the "always current" download link — this is the important part.**
   On the product's **Content** tab in Gumroad:
   - Toggle **OFF** the beta content editor (Gumroad's newer built-in file/content builder) if it's on. You want the older, simpler content options for this step.
   - Choose **"Redirect to a URL after purchase."**
   - Paste this exact URL into that field:
     ```
     https://github.com/misterfulanito/guidemygrid/releases/latest
     ```

   Here's why this matters: that GitHub link always points at whatever the newest released version of the plugin is — automatically, forever. Once you set this once, you never have to come back and update this link again, even when you release version 2.0, 3.0, and so on. GitHub handles "which file is current" for you.

   **The plugin file itself is never uploaded to Gumroad.** GitHub Releases is the only place the actual plugin file lives. Gumroad's job is purely to be the storefront/download page — it just hands the customer off to GitHub at the moment of "purchase." This means there's no second copy of the file anywhere that could quietly fall out of date or get mixed up with an older version.

5. **Publish the listing.**
   Once the copy and the redirect link are in place, publish the product so it's live and publicly reachable.

6. **Verify the live link (do this every time, right after publishing).**
   Open the live product page in a normal browser window (not the Gumroad editor preview) and go through the free "purchase"/download flow as a real customer would. Confirm that your browser ends up on the **current GitHub Release page** for GuideMyGrid — not a file hosted directly on Gumroad, and not an old/stale version. If it lands anywhere else, double-check the URL you pasted in step 4 for typos.

That's it — once this is done and verified, you have a working free distribution page whose download link will always point at whatever you release next, with zero further Gumroad maintenance required.
