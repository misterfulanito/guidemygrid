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

> **2026-07-08 update — how this section changed:** This section originally described
> wiring Gumroad's "Redirect to a URL after purchase" option so the listing would hand
> customers straight to `github.com/.../releases/latest` and never host the plugin file
> itself. Live in Gumroad's current product editor, the Content tab is now a single
> unified block editor with no visible toggle to turn off that newer editor and no
> "Redirect to a URL after purchase" option in sight — Gumroad appears to have redesigned
> or relocated this since it was documented. Rather than keep hunting for a relocated
> setting, the decision made was to **upload the `.ccx` file directly to the Gumroad
> listing instead.** That is what the steps below now describe. See this plan's
> `04-03-SUMMARY.md` for the full tradeoff this introduces (Gumroad now hosts its own
> copy of the binary, which needs a manual re-upload on every future release so it
> doesn't drift out of sync with GitHub).

These steps assume you don't have a Gumroad account yet. If you already have one, skip to step 2.

1. **Create a Gumroad account.**
   Go to gumroad.com and sign up (email + password, or a social login). This is free — Gumroad doesn't require any payment info to create an account or list a free product.

2. **Create a new product, priced at $0 (free).**
   From your Gumroad dashboard, choose "New product." When Gumroad asks for a price, set it to **$0 / Free**. You will not need any of Gumroad's paid-product features (license keys, payment processing) for this listing.

3. **Paste the Section A copy.**
   Copy the product title, tagline, and description from Section A above into the matching fields in Gumroad's product editor.

4. **Upload the `.ccx` file directly, with the checksum and install steps as its description.**
   On the product's **Content** tab in Gumroad, add the current release file (e.g. `releases/GuideMyGrid-v0.1.0.ccx`) as the downloadable file block. Directly below the file block, paste text along these lines (adjust the version/checksum for whatever you're currently releasing):

   ```
   Thanks for downloading GuideMyGrid!

   Your file: GuideMyGrid-v0.1.0.ccx (attached above)
   Checksum (SHA-256): fa7d5ee6dc01bd8597edc6155bf36042ce8c6dc086d35fe18153b8a8ad139454

   How to install:
   1. Double-click the downloaded .ccx file — Adobe Creative Cloud Desktop will
      open and prompt you to install it into Photoshop.
   2. If Creative Cloud Desktop doesn't open automatically, open it manually,
      go to Plugins, and install the file from there.
   3. Open Photoshop and look for "GuideMyGrid" in the Plugins panel.

   You may see a one-time permission prompt during install — that's expected
   and normal. Full install walkthrough coming soon.

   Questions or issues? [add your support link/email here]
   ```

   The checksum lets anyone verify the file they downloaded from Gumroad matches the official release exactly (copy the correct value for the version you're uploading from `releases/SHA256SUMS.txt` in the repo).

   **Important — this is now a second copy of the file.** Unlike the original redirect-based plan, the plugin binary now genuinely lives in two places: GitHub Releases (still the canonical source, and what the in-app update checker calls) and this Gumroad listing. **Every time you cut a new release, you must manually come back here and re-upload the new `.ccx` file plus updated checksum/version text** — Gumroad will not do this automatically. Skipping this step means the Gumroad copy silently goes stale relative to GitHub.

5. **Publish the listing.**
   Once the copy and the file/description are in place, publish the product so it's live and publicly reachable.

6. **Verify the live download (do this every time, right after publishing or re-uploading).**
   Open the live product page in a normal browser window (not the Gumroad editor preview) and download the file as a real customer would. Run a checksum check on the downloaded file (macOS/Linux: `shasum -a 256 <downloaded file>`) and confirm it **exactly matches** the checksum published in `releases/SHA256SUMS.txt` for that version. If it doesn't match, re-check what you uploaded — don't leave a mismatched file live.

That's it — once this is done and verified, you have a working free distribution page. Unlike the original plan, this one needs a short manual step (re-upload + re-verify) on every future release to stay in sync with GitHub — see the deviation note in `04-03-SUMMARY.md` for why, and a suggestion to fold that step into the release checklist so it isn't forgotten.

**Live listing:** https://666551126816.gumroad.com/l/guidemygrid-psd
