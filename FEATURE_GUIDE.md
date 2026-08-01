# Chasqr Feature Guide - User Manual

## Welcome to Chasqr

Chasqr is a simple, fast way to get your website online. Build a site visually without coding, or deploy your existing code in minutes.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your First Site](#creating-your-first-site)
3. [Visual Builder Overview](#visual-builder-overview)
4. [Managing Your Site](#managing-your-site)
5. [Deploying Existing Code](#deploying-existing-code)
6. [Customizing Your Site](#customizing-your-site)
7. [Analytics & Forms](#analytics--forms)
8. [Domains & URLs](#domains--urls)
9. [Support & Help](#support--help)

---

## Getting Started

### Sign Up / Login
1. Visit **chasqr.io**
2. Click **Sign Up** to create an account
3. Or click **Login** if you already have one
4. Use Google OAuth for quick signup
5. Verify your email address

### Dashboard
Once logged in, you'll see your **Dashboard** with:
- **List of your sites** - All sites you've created
- **+ New Site button** - Start creating
- **Quick actions** - Edit, delete, view site
- **Site status** - Published or archived

---

## Creating Your First Site

### Option 1: Build from Scratch (Visual Builder)

#### Step 1: Start Creation
1. Click **+ New Site** on Dashboard
2. Choose **"Build from Scratch"** (marked as "New")
3. Click the card to proceed

#### Step 2: Site Details
Fill out:
- **Site Name** (required) - e.g., "My Portfolio"
- **Custom URL** (optional) - e.g., "my-portfolio"
  - If you leave it blank, we auto-generate one
  - Only use lowercase letters, numbers, and hyphens
  - Minimum 3 characters, maximum 50

#### Step 3: Create & Start Designing
- Click **"Create Site"**
- You'll automatically open the full-screen **Visual Builder**
- Start dragging elements onto your site!

---

## Visual Builder Overview

### Three-Part Interface

```
┌─────────────────────────────────────────────────┐
│         Toolbar (Save, Undo, Redo, Exit)        │
├──────────────────┬───────────────┬──────────────┤
│                  │               │              │
│  Element Palette │   Canvas      │  Properties  │
│  (Left)          │   (Center)    │  Panel       │
│                  │               │  (Right)     │
│  - Headings      │  [Drag & Drop │ - Text       │
│  - Text          │   Elements    │ - Colors     │
│  - Images        │   Here]       │ - Size       │
│  - Buttons       │               │ - Position   │
│  - Layouts       │               │ - Style      │
│  - Navbar/Footer │               │              │
│                  │               │              │
└──────────────────┴───────────────┴──────────────┘
```

### Left Sidebar: Element Palette

**Text Elements:**
- Heading 1-6 (`<h1>` through `<h6>`)
- Paragraph
- Subheading

**Media:**
- Image
- Video embed

**Interactive:**
- Button
- Link

**Layout:**
- Section (full-width container)
- Column (left/right splits)
- Grid (multi-column layout)
- Divider (horizontal line)

**Navigation:**
- Navbar (top navigation bar)
- Footer (bottom footer)

### Center: Canvas
- **Your site's visual appearance**
- **Click elements** to select and edit
- **Drag elements** to reposition
- **Hover to see options** - copy, delete, duplicate
- **Drag from palette** to add new elements

### Right Sidebar: Properties Panel

#### Text Properties
- **Content** - Edit the text itself
- **Font** - Choose font family
- **Size** - 12px to 72px
- **Weight** - Light, regular, bold
- **Color** - Text color picker
- **Alignment** - Left, center, right, justify

#### Box Properties
- **Background** - Color or image
- **Padding** - Space inside element
- **Margin** - Space outside element
- **Border** - Color, width, radius
- **Shadow** - Drop shadow effect
- **Width/Height** - Element dimensions

#### Advanced
- **Opacity** - Transparency (0-100%)
- **Effects** - Hover states, transitions

### Top Toolbar

| Icon | Function | Shortcut |
|------|----------|----------|
| ↩️ | Undo last change | Ctrl+Z |
| ↪️ | Redo | Ctrl+Y |
| 👁️ | Preview mode | - |
| ⬅️ / ➡️ | Align left/right | - |
| ⬇️ | Save changes | Ctrl+S |
| ✕ | Exit builder | Esc |

---

## Managing Your Site

### Dashboard Site Cards

Each site shows:
- **Site name & thumbnail**
- **Site URL** - Click to visit live
- **Quick actions:**
  - **Edit** - Open in visual builder
  - **Manage** - Go to site admin
  - **View** - Open in new tab
  - **Archive** - Hide from list
  - **Delete** - Remove permanently

### Site Admin Dashboard

Access from Dashboard → Click **Manage** or **Site Name**

#### Tabs Available:

**Settings Group:**
1. **Site URL**
   - Change your subdomain slug
   - Example: `https://yoursite.chasqr.io`

2. **Custom Domain**
   - Connect your own domain
   - Example: `https://yoursite.com`
   - We handle SSL certificates automatically

3. **Update Files**
   - Re-upload changed files
   - Deploy new versions
   - Update code and assets

**Content Group:**

4. **Editor**
   - Edit text/image content on your live pages
   - No design changes, just content
   - Live preview as you edit

5. **Layout** ⭐ Main Feature
   - Open full-screen visual builder
   - Drag-and-drop interface
   - Edit navbars and footers
   - Create multi-page sites

6. **Colors**
   - Set primary color
   - Set secondary color
   - Set accent color
   - All elements update automatically

7. **SEO**
   - Set page title for Google
   - Write meta description
   - Add Open Graph tags (for social sharing)
   - View SEO audit score

8. **Analytics**
   - View total page views
   - See traffic over time
   - Device breakdown (mobile/desktop)
   - Geographic data
   - Popular pages

9. **Submissions**
   - View form submissions
   - Filter by form name
   - Download as CSV
   - See submission dates

**Help Group:**

10. **Expert Help**
    - Request expert assistance
    - Real-time chat support
    - View support history
    - Track support requests

---

## Deploying Existing Code

### Option 2: Upload Your Code

#### Step 1: Start Upload
1. Click **+ New Site** on Dashboard
2. Choose **"Deploy Existing Code"**
3. Click the card

#### Step 2: Upload Options
- **ZIP File** - Upload entire site as .zip
- **HTML Files** - Upload individual files
- **Built App** - Deploy a React/Vue/Angular build folder

#### Step 3: Configure
- Add site name
- Choose subdomain (optional)
- Set deployment settings

#### Step 4: Deploy
- Click **Deploy**
- Site goes live in seconds
- Get your public URL

---

## Customizing Your Site

### Change Colors

1. Go to **Site Admin** → **Colors tab**
2. Click color pickers for:
   - **Primary Color** - Main brand color
   - **Secondary Color** - Alternate color
   - **Accent Color** - Highlights
3. See preview update in real-time
4. Click **Save**

### Edit Navbar

In **Visual Builder**:
1. Click the navbar at top
2. Edit logo image
3. Add/remove menu links
4. Change text and colors
5. Click **Save**

### Edit Footer

In **Visual Builder**:
1. Scroll to bottom
2. Click footer
3. Edit text content
4. Add links
5. Update social media links
6. Click **Save**

### Add New Pages

1. In **Site Admin** → **Layout**
2. Click **+ Add Page**
3. Choose page type:
   - Blank page
   - Copy from existing page
4. Name the page
5. Click **Create**
6. Design in visual builder

---

## Analytics & Forms

### View Traffic Analytics

1. Go to **Site Admin** → **Analytics tab**
2. See:
   - **Total pageviews** this month
   - **Traffic chart** (last 30 days)
   - **Device breakdown** (% mobile vs desktop)
   - **Top pages** most visited
   - **Geographic data** where visitors are from

### Manage Form Submissions

1. Go to **Site Admin** → **Submissions tab**
2. See all form submissions to your site:
   - **Form name** which form was submitted
   - **Data** what was submitted
   - **Date** when it was submitted
   - **Email** if captured

#### Actions:
- **View Details** - See full submission
- **Filter** - Show specific form only
- **Download CSV** - Export all submissions
- **Delete** - Remove old submissions

---

## Domains & URLs

### Default URL

Every site gets a free Chasqr subdomain:
```
https://my-site.chasqr.io
```

Change the `my-site` part anytime from:
**Site Admin** → **Site URL tab**

### Add Custom Domain

#### Prerequisites:
- Own a domain (buy from GoDaddy, Namecheap, etc.)
- Domain must have Cloudflare nameservers

#### Steps:
1. Go to **Site Admin** → **Custom Domain tab**
2. Click **Add Domain**
3. Enter your domain: `example.com`
4. Follow our setup guide:
   - Change nameservers to Cloudflare
   - Wait 24-48 hours for propagation
5. We auto-provision SSL certificate
6. Your site is at `https://example.com` 🎉

#### What We Handle:
- ✅ SSL certificates (HTTPS)
- ✅ DNS management
- ✅ Auto-renewal
- ✅ CDN caching
- ✅ DDoS protection

---

## SEO Optimization

### Improve Search Rankings

1. Go to **Site Admin** → **SEO tab**
2. Set for each page:
   - **Page Title** (appears in Google, browser tab)
   - **Meta Description** (shown under link in search results)
   - **URL Slug** (the `/page-name` part)

3. Optional:
   - **Open Graph Tags** - Control how site looks when shared
   - **Structured Data** - Help search engines understand content

4. View **SEO Audit**:
   - Score out of 100
   - Recommendations
   - Issues to fix

### Tips for Better SEO:
- Use keywords in title
- Keep description under 160 characters
- Use descriptive URLs (not `/page-123`)
- Add alt text to images
- Use headings (h1, h2, h3) properly
- Keep site loading fast
- Get backlinks from other sites

---

## Support & Help

### Get Expert Help

1. Go to **Site Admin** → **Expert Help tab**
2. Describe what you need:
   - Design a section
   - Set up custom domain
   - Improve SEO
   - Integrate payment
   - etc.

3. Our experts will:
   - Review your request
   - Chat with you in real-time
   - Make changes directly (with permission)
   - Provide guidance

### Pricing:
- Basic support - Free with account
- Expert help - $20-50 per request
- Emergency support - Available for pro plans

### Resources:
- **Docs** - Full documentation at chasqr.io/docs
- **FAQ** - Frequently asked questions
- **Video Tutorials** - Learn by watching
- **Blog** - Tips and best practices

---

## FAQ

### Q: Can I edit code directly?
**A:** For Pro/Expert plans, yes. You can inject custom CSS and JavaScript. Basic plans use the visual builder only.

### Q: Can multiple people edit one site?
**A:** Not yet. Coming soon! Currently, only the site owner can edit.

### Q: Can I use my own domain?
**A:** Yes! Go to **Custom Domain** tab. We support unlimited custom domains.

### Q: How fast is my site?
**A:** Very fast! We use CDN caching and edge servers worldwide. Most sites load in <1 second.

### Q: Do you have backups?
**A:** Yes! We automatically backup your site every day. You can restore anytime from **Site Admin → Backups**.

### Q: Can I migrate from other platforms?
**A:** Yes! Contact us and we'll help migrate your site from Wix, Squarespace, etc.

### Q: What if I need help?
**A:** Use **Expert Help** tab. Our team is available 24/7 for chat support.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Save |
| `Esc` | Exit editor |
| `Delete` | Remove element |
| `Ctrl+C` | Copy element |
| `Ctrl+V` | Paste element |
| `Ctrl+D` | Duplicate element |

---

## Best Practices

### Design:
- ✅ Keep design clean and simple
- ✅ Use consistent colors throughout
- ✅ Make text readable (good contrast)
- ✅ Optimize images before uploading
- ✅ Mobile-first design (test on phones)

### Content:
- ✅ Clear, concise copy
- ✅ Proofread carefully
- ✅ Use headings for hierarchy
- ✅ Add images to break up text
- ✅ Include call-to-action buttons

### Performance:
- ✅ Compress images
- ✅ Don't use too many fonts
- ✅ Keep page load time <3 seconds
- ✅ Test on slow connections
- ✅ Optimize CSS/JS

### Security:
- ✅ Keep password strong
- ✅ Enable 2-factor authentication
- ✅ Don't share login credentials
- ✅ Use HTTPS (we enforce this)
- ✅ Keep plugins updated

---

## Troubleshooting

### Site Not Loading?
1. Check your internet connection
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try a different browser
4. Check site status on Dashboard

### Changes Not Saving?
1. Click the **Save** button (or Ctrl+S)
2. Wait for green success message
3. Check browser console for errors (F12)
4. Try refreshing the page

### Can't Access Visual Builder?
1. Make sure you're logged in
2. Verify you own the site
3. Clear cache and refresh
4. Try disabling browser extensions

### Forms Not Receiving Submissions?
1. Check that form is configured
2. Verify email notification settings
3. Check Submissions tab for received data
4. Try submitting test form

### Slow Site Performance?
1. Check page load time in Analytics
2. Compress large images
3. Remove unused elements
4. Contact support for optimization

---

## What's Coming Next?

🔄 **Planned Features:**
- Collaborative editing (team editing)
- Template gallery (pre-designed sites)
- E-commerce integration (sell products)
- Blog system (publish articles)
- CMS integration (manage content externally)
- API access (for developers)
- Custom code editor (Pro feature)
- Site versioning (rollback changes)

---

## Contact Us

- **Support Email:** support@chasqr.io
- **Chat:** Available in app (Expert Help)
- **Phone:** +1 (800) CHASQR-1
- **Twitter:** @chasqr
- **Facebook:** @chasqrofficial

---

**Last Updated:** August 1, 2026
**Version:** 1.0.0
**Status:** Live & Production Ready

Happy building! 🚀
