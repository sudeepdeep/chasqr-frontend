# Developer Guide - Chasqr Visual Builder

## Quick Start

### Installation
```bash
npm install
npm start
```

### Running the Project
- **Development:** `npm start` → Opens at `http://localhost:3000`
- **Build:** `npm run build` → Creates production bundle
- **Test:** `npm test` → Runs test suite

---

## Key Directories

```
src/
├── pages/
│   ├── Build.tsx              # Site creation page
│   ├── Builder.tsx            # Full-screen visual editor wrapper
│   ├── SiteAdmin.tsx          # Site management dashboard
│   ├── Dashboard.tsx          # Sites list + new site modal
│   ├── Upload.tsx             # File upload deployment
│   ├── SeoChecker.tsx         # SEO analysis
│   └── ...
├── components/
│   ├── LayoutBuilder.tsx      # Main visual editor (5000+ lines)
│   ├── SiteCard.tsx           # Site preview card
│   ├── NewSiteModal.tsx       # Site creation options
│   ├── SEOEditor.tsx          # SEO metadata editor
│   ├── ColorEditor.tsx        # Color scheme editor
│   ├── Submissions.tsx        # Form submissions view
│   └── ...
├── api/
│   ├── site.api.ts            # Site API endpoints
│   ├── payment.api.ts         # Payment/billing
│   └── support.api.ts         # Support tickets
├── store/
│   └── auth.ts                # Auth state (Pullstate)
└── lib/
    ├── socket.ts              # WebSocket for real-time updates
    └── siteUrl.ts             # URL utilities
```

---

## Component Structure

### 1. Build Page (`/build`)
**Purpose:** Create new blank sites

**State:**
```typescript
const [siteName, setSiteName] = useState('');
const [slug, setSlug] = useState('');
const [creating, setCreating] = useState(false);
```

**Key Functions:**
- `handleSlugChange()` - Validates and sanitizes URL slug
- `handleCreate()` - Creates blank site via API, then navigates to builder

**Dependencies:**
- `createBlankSiteAPI()` from `site.api.ts`
- `useNavigate()` from `react-router-dom`

---

### 2. Builder Page (`/sites/:siteId/builder`)
**Purpose:** Full-screen visual editor wrapper

**State:**
```typescript
const { siteId } = useParams();
const [site, setSite] = useState(null);
const [loading, setLoading] = useState(true);
```

**Key Functions:**
- Fetches site data with `getSiteAPI(siteId)`
- Extracts page from URL param or uses first page
- Passes to LayoutBuilder with full-screen mode

**Props to LayoutBuilder:**
```typescript
<LayoutBuilder
  siteId={siteId}
  page={pageName}
  initialLayout={page.layout}
  initialLayoutStyle={page.layoutStyle}
  initialNav={page.nav}
  initialFooter={page.footer}
  fullscreen={true}
  previewUrl={publicSiteUrl(site.slug)}
  onExit={() => navigate(`/sites/${siteId}?tab=layout`)}
  onSaved={(updatedSite) => setSite(updatedSite)}
/>
```

---

### 3. LayoutBuilder Component
**Purpose:** Main visual drag-and-drop editor

**Key Features:**
- Element palette (left sidebar)
- Canvas (center)
- Properties panel (right sidebar)
- Toolbar with save/undo/redo

**State Management:**
```typescript
const [layout, setLayout] = useState(initialLayout);
const [selectedElementId, setSelectedElementId] = useState(null);
const [isDragging, setIsDragging] = useState(false);
const [history, setHistory] = useState([]); // For undo/redo
```

**Element Types:**
```typescript
type Element = 
  | { type: 'h1'|'h2'|'h3'|'h4'|'h5'|'h6'; content: string }
  | { type: 'p'; content: string }
  | { type: 'button'; label: string; onClick: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'section'; backgroundColor: string; children: Element[] }
  | { type: 'column'; width: string; children: Element[] }
  | // ... more types
```

**API Calls:**
```typescript
// Save layout
updateElementsAPI(siteId, page, layout)

// Save navbar
updateNavAPI(siteId, page, nav)

// Save footer
updateFooterAPI(siteId, page, footer)
```

---

### 4. SiteAdmin Page
**Purpose:** Multi-tab site management dashboard

**Tabs:**
```typescript
type Section = 
  | "url" | "domain" | "files" 
  | "editor" | "layout" | "colors" | "seo" | "analytics" | "submissions" 
  | "support"
```

**Key Features per Tab:**

| Tab | Component | Purpose |
|-----|-----------|---------|
| url | URLManager | Update site slug |
| domain | DomainManager | Add custom domain |
| files | FileUpload | Re-deploy files |
| editor | ContentEditor | Edit page text/images |
| layout | LayoutBuilder | Visual editor (full-screen) |
| colors | ColorEditor | Configure color scheme |
| seo | SEOEditor | Set meta tags & description |
| analytics | AnalyticsChart | View traffic stats |
| submissions | Submissions | View form data |
| support | SupportSection | Request help |

**Navigation:**
- URL params control active tab: `/sites/123?tab=layout`
- "seo-check" redirects to "seo" for backwards compatibility

---

## API Integration

### Site API (`src/api/site.api.ts`)

**Create Blank Site:**
```typescript
createBlankSiteAPI(siteName: string, slug?: string)
// Returns: { data: { data: { site: SiteObject } } }
```

**Fetch Site:**
```typescript
getSiteAPI(siteId: string)
// Returns site with all pages and layout data
```

**Update Layout:**
```typescript
updateElementsAPI(siteId: string, page: string, layout: any[])
// Saves visual builder changes
```

**Manage Domain:**
```typescript
setCustomDomainAPI(siteId: string, domain: string)
removeCustomDomainAPI(siteId: string)
```

**File Deployment:**
```typescript
redeployZipAPI(siteId: string, formData)
redeployFilesAPI(siteId: string, formData)
```

---

## State Management

### Auth Store (Pullstate)
```typescript
import { AuthStore } from '../store/auth';

const { user, token } = AuthStore.useState();
AuthStore.update(s => s.user = newUser);
```

### Local Component State
Most components use React hooks for local state:
```typescript
const [value, setValue] = useState(initialValue);
const [loading, setLoading] = useState(false);
```

---

## Styling

### Tailwind CSS
- **Config:** `tailwind.config.js`
- **Classes:** All styles use Tailwind utility classes
- **Custom Colors:** Primary color defined in config

**Common Patterns:**
```typescript
// Container
className="max-w-2xl mx-auto px-6"

// Buttons
className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"

// Forms
className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"

// Animations
className="animate-spin" // Built-in spinners
```

### Framer Motion
Used for smooth animations:
```typescript
import { motion, AnimatePresence } from 'framer-motion';

<motion.div 
  initial={{ opacity: 0, y: 20 }} 
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
>
  Content
</motion.div>
```

---

## Routing

### Main Routes (App.tsx)
```typescript
/                     → Landing page
/login               → Login form
/register            → Registration form
/docs                → Documentation
/seo-checker         → SEO analysis tool
/dashboard           → Sites list
/build               → Create new site
/sites/:siteId/builder    → Full-screen editor
/sites/:siteId            → Site admin dashboard
/upload              → Upload files
/profile             → User profile
/transactions        → Payment history
/expert              → Expert panel (protected)
/admin               → Admin panel (protected)
```

---

## Environment Variables

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_SITE_DOMAIN=chasqr.io
```

Production (`.env.production`):
```
REACT_APP_API_URL=https://api.chasqr.io
REACT_APP_GOOGLE_CLIENT_ID=production-google-client-id
REACT_APP_SITE_DOMAIN=chasqr.io
```

---

## Common Tasks

### Add a New Tab to SiteAdmin

1. **Add to Section type:**
```typescript
type Section = "url" | "domain" | ... | "myNewTab"
```

2. **Add to NAV_GROUPS:**
```typescript
{ id: "myNewTab", label: "My Tab", icon: MyIcon }
```

3. **Add case in render:**
```typescript
case "myNewTab":
  return <MyNewTabComponent />
```

### Add a New Element Type to Builder

1. **Define element structure:**
```typescript
{
  id: "elem-123",
  type: "myElement",
  content: "...",
  style: { /* ... */ }
}
```

2. **Add render logic:**
```typescript
case "myElement":
  return <MyElementRenderer element={element} />
```

3. **Add to palette:**
```typescript
{ 
  type: "myElement", 
  icon: MyIcon, 
  label: "My Element" 
}
```

### Deploy Changes

1. **Local testing:**
```bash
npm start
# Test the feature locally
```

2. **Build:**
```bash
npm run build
```

3. **Deploy to Vercel:**
```bash
git push origin main
# Vercel auto-deploys on push
```

---

## Debugging

### Enable Debug Logging
Add to any component:
```typescript
console.log('Debug:', variable);
// Check browser console (F12)
```

### React DevTools
Install extension for Chrome/Firefox to inspect component state and props.

### Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. Check request/response

### Local API
Set `REACT_APP_API_URL` to `http://localhost:5000` in `.env`

---

## Performance Tips

1. **Use React.memo** for expensive components
2. **Lazy load routes** with `React.lazy()`
3. **Optimize images** before upload
4. **Debounce input handlers** for text fields
5. **Use CSS classes** instead of inline styles
6. **Profile with DevTools** React tab

---

## Common Errors & Solutions

### "Site not found" Error
- Check that site exists in database
- Verify siteId in URL is correct
- Check API response in Network tab

### Blank Canvas in Builder
- Ensure page has layout data
- Check if page.layout is array
- Verify API returns correct structure

### Styles Not Applying
- Clear browser cache
- Check Tailwind CSS build
- Verify class names match config
- Check specificity in DevTools

---

## Resources

- **Tailwind CSS:** https://tailwindcss.com/docs
- **Framer Motion:** https://www.framer.com/motion/
- **React Router:** https://reactrouter.com/
- **React Hooks:** https://react.dev/reference/react/hooks
- **TypeScript:** https://www.typescriptlang.org/docs/

---

**Last Updated:** August 1, 2026
**Version:** 1.0.0
