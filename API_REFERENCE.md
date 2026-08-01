# API Reference - Chasqr Frontend

Complete reference for all API endpoints used by the Chasqr frontend.

---

## Base URL

```
Development: http://localhost:5000
Production: https://api.chasqr.io
```

All requests include authentication token in headers:
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## Site API (`src/api/site.api.ts`)

### Create Blank Site

**Endpoint:** `POST /api/sites/blank`

**Request:**
```typescript
{
  siteName: string;
  slug?: string;  // Optional custom URL slug
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    site: {
      siteId: string;
      siteName: string;
      slug: string;
      status: "published" | "archived";
      createdAt: string;
      pages: Page[];
    }
  }
}
```

**Usage:**
```typescript
const res = await createBlankSiteAPI("My Site", "my-site");
const { site } = res.data.data;
```

---

### Get Site Details

**Endpoint:** `GET /api/sites/:siteId`

**Response:**
```typescript
{
  success: true;
  data: {
    site: {
      siteId: string;
      siteName: string;
      slug: string;
      customDomain?: string;
      status: "published" | "archived";
      pages: {
        filename: string;
        title: string;
        layout: Element[];
        layoutStyle: CSSProperties;
        nav: NavConfig;
        footer: FooterConfig;
      }[];
      colors: {
        primary: string;
        secondary: string;
        accent: string;
      };
      createdAt: string;
      updatedAt: string;
    }
  }
}
```

**Usage:**
```typescript
const res = await getSiteAPI("site-id-123");
const site = res.data.data.site;
```

---

### Get User's Sites

**Endpoint:** `GET /api/sites`

**Query Parameters:**
```
?status=published|archived|all   // Default: published
?limit=20                         // Results per page
?offset=0                         // Pagination offset
?search=query                     // Search by name
```

**Response:**
```typescript
{
  success: true;
  data: {
    sites: Site[];
    total: number;
    limit: number;
    offset: number;
  }
}
```

**Usage:**
```typescript
const res = await getMySitesAPI();
const sites = res.data.data.sites;
```

---

### Update Site Elements/Layout

**Endpoint:** `PUT /api/sites/:siteId/pages/:page/layout`

**Request:**
```typescript
{
  layout: Element[];          // Array of elements
  layoutStyle?: CSSProperties; // Page-level styles
}
```

**Response:**
```typescript
{
  success: true;
  data: { site: SiteObject }
}
```

**Usage:**
```typescript
await updateElementsAPI(
  "site-id-123",
  "index.html",
  layoutData
);
```

---

### Update Navbar

**Endpoint:** `PUT /api/sites/:siteId/pages/:page/nav`

**Request:**
```typescript
{
  logo?: {
    src: string;
    alt: string;
  };
  links: {
    label: string;
    href: string;
  }[];
  backgroundColor?: string;
  textColor?: string;
}
```

**Response:**
```typescript
{
  success: true;
  data: { site: SiteObject }
}
```

---

### Update Footer

**Endpoint:** `PUT /api/sites/:siteId/pages/:page/footer`

**Request:**
```typescript
{
  content: string;
  links?: {
    label: string;
    href: string;
  }[];
  socialLinks?: {
    platform: string;  // "facebook", "twitter", etc.
    url: string;
  }[];
  backgroundColor?: string;
  textColor?: string;
}
```

---

### Update Site Content

**Endpoint:** `PUT /api/sites/:siteId/pages/:page/content`

**Request:**
```typescript
{
  contentMap: {
    key: string;
    value: string;
  }[];
}
```

**Usage:**
```typescript
// Update specific text/image on page
await updateContentAPI("site-id", "index.html", {
  contentMap: [
    { key: "hero-title", value: "New Title" },
    { key: "hero-image", value: "https://..." }
  ]
});
```

---

### Update Site URL Slug

**Endpoint:** `PATCH /api/sites/:siteId/slug`

**Request:**
```typescript
{
  slug: string;  // New subdomain slug
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    site: SiteObject;
    newUrl: string;  // "https://newslug.chasqr.io"
  }
}
```

**Validation:**
- 3-50 characters
- Lowercase letters, numbers, hyphens only
- Must be unique

---

### Set Custom Domain

**Endpoint:** `POST /api/sites/:siteId/custom-domain`

**Request:**
```typescript
{
  domain: string;  // "example.com"
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    site: SiteObject;
    nameservers: string[];  // Cloudflare nameservers to use
    dnsRecords?: object;    // DNS records to configure
  }
}
```

**Steps After Request:**
1. Get returned nameservers
2. Update domain nameservers at registrar
3. Wait 24-48 hours for propagation
4. We auto-provision SSL certificate

---

### Remove Custom Domain

**Endpoint:** `DELETE /api/sites/:siteId/custom-domain`

**Response:**
```typescript
{
  success: true;
  data: { site: SiteObject }
}
```

---

### Deploy Files (ZIP)

**Endpoint:** `POST /api/sites/:siteId/deploy/zip`

**Content-Type:** `multipart/form-data`

**Request:**
```typescript
FormData {
  file: File;          // ZIP file
  extractTo?: string;  // Extract path
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    site: SiteObject;
    deployId: string;
    status: "queued" | "building" | "deployed";
    url: string;  // Live URL
  }
}
```

---

### Deploy Individual Files

**Endpoint:** `POST /api/sites/:siteId/deploy/files`

**Content-Type:** `multipart/form-data`

**Request:**
```typescript
FormData {
  files: File[];  // Multiple files
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    site: SiteObject;
    deployId: string;
    filesUploaded: number;
    url: string;
  }
}
```

---

### Redeploy Latest Version

**Endpoint:** `POST /api/sites/:siteId/redeploy`

**Request:** (empty body)

**Response:**
```typescript
{
  success: true;
  data: {
    deployId: string;
    status: "building";
  }
}
```

---

### Toggle Site Status

**Endpoint:** `PATCH /api/sites/:siteId/status`

**Request:**
```typescript
{
  status: "published" | "archived"
}
```

**Response:**
```typescript
{
  success: true;
  data: { site: SiteObject }
}
```

---

### Delete Site

**Endpoint:** `DELETE /api/sites/:siteId`

**Query Parameters:**
```
?confirm=true  // Require confirmation
```

**Response:**
```typescript
{
  success: true;
  message: "Site deleted successfully"
}
```

⚠️ **Warning:** This is permanent and cannot be undone.

---

## Analytics API

### Get Site Analytics

**Endpoint:** `GET /api/sites/:siteId/analytics`

**Query Parameters:**
```
?period=day|week|month|year
?startDate=2026-08-01
?endDate=2026-08-31
```

**Response:**
```typescript
{
  success: true;
  data: {
    analytics: {
      totalPageviews: number;
      totalVisitors: number;
      avgSessionDuration: number;
      bounceRate: number;
      pages: {
        pathname: string;
        pageviews: number;
        avgTime: number;
      }[];
      devices: {
        type: "mobile" | "tablet" | "desktop";
        percentage: number;
        count: number;
      }[];
      geography: {
        country: string;
        visitors: number;
        percentage: number;
      }[];
      timeline: {
        date: string;
        pageviews: number;
        visitors: number;
      }[];
    }
  }
}
```

**Usage:**
```typescript
const res = await getAnalyticsAPI("site-id", {
  period: "month"
});
```

---

## Submissions API

### Get Form Submissions

**Endpoint:** `GET /api/sites/:siteId/submissions`

**Query Parameters:**
```
?formKey=contact-form
?limit=50
?offset=0
?sortBy=date|name
?sortOrder=asc|desc
```

**Response:**
```typescript
{
  success: true;
  data: {
    submissions: {
      submissionId: string;
      formKey: string;
      formName: string;
      data: Record<string, any>;
      userEmail?: string;
      userPhone?: string;
      submittedAt: string;
      ipAddress?: string;
    }[];
    total: number;
  }
}
```

---

### Delete Submission

**Endpoint:** `DELETE /api/sites/:siteId/submissions/:submissionId`

**Response:**
```typescript
{
  success: true;
  message: "Submission deleted"
}
```

---

## SEO API

### Get SEO Report

**Endpoint:** `GET /api/sites/:siteId/pages/:page/seo`

**Response:**
```typescript
{
  success: true;
  data: {
    seoReport: {
      score: number;              // 0-100
      title: string;
      metaDescription: string;
      h1Present: boolean;
      imagesWithAlt: number;
      totalImages: number;
      readabilityScore: number;
      recommendations: {
        priority: "high" | "medium" | "low";
        issue: string;
        suggestion: string;
      }[];
    }
  }
}
```

---

### Update SEO Metadata

**Endpoint:** `PUT /api/sites/:siteId/pages/:page/seo`

**Request:**
```typescript
{
  title: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  keywords?: string[];
  structuredData?: object;
}
```

**Response:**
```typescript
{
  success: true;
  data: { site: SiteObject }
}
```

---

## Payment API

### Get Payment Info

**Endpoint:** `GET /api/payments/me`

**Response:**
```typescript
{
  success: true;
  data: {
    payment: {
      userId: string;
      plan: "free" | "pro" | "expert";
      status: "active" | "cancelled" | "expired";
      renewalDate?: string;
      paymentMethod?: {
        type: "credit_card" | "paypal";
        last4?: string;
      };
    }
  }
}
```

---

### Create Payment Intent

**Endpoint:** `POST /api/payments/intent`

**Request:**
```typescript
{
  plan: "pro" | "expert";
  billingCycle: "monthly" | "yearly";
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    clientSecret: string;
    amount: number;
    currency: string;
  }
}
```

---

## Support API

### Get Support Requests

**Endpoint:** `GET /api/support/requests`

**Query Parameters:**
```
?status=open|closed|all
?limit=20
?offset=0
```

**Response:**
```typescript
{
  success: true;
  data: {
    requests: {
      requestId: string;
      siteId: string;
      title: string;
      description: string;
      status: "open" | "in_progress" | "closed";
      priority: "low" | "medium" | "high";
      createdAt: string;
      updatedAt: string;
      messages: {
        authorId: string;
        authorName: string;
        message: string;
        timestamp: string;
      }[];
    }[];
    total: number;
  }
}
```

---

### Create Support Request

**Endpoint:** `POST /api/support/requests`

**Request:**
```typescript
{
  siteId: string;
  title: string;
  description: string;
  category?: "design" | "technical" | "domain" | "general";
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    request: RequestObject;
    estimatedResponse: string;  // "within 1 hour"
  }
}
```

---

### Send Message in Support Ticket

**Endpoint:** `POST /api/support/requests/:requestId/messages`

**Request:**
```typescript
{
  message: string;
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    message: {
      messageId: string;
      authorId: string;
      message: string;
      timestamp: string;
    }
  }
}
```

---

## Error Handling

### Error Response Format

```typescript
{
  success: false;
  error: {
    code: string;  // "INVALID_SLUG" | "SITE_NOT_FOUND" | etc.
    message: string;
    statusCode: number;
    details?: any;
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_SLUG` | 400 | Slug format invalid or taken |
| `SITE_NOT_FOUND` | 404 | Site doesn't exist |
| `UNAUTHORIZED` | 401 | Authentication failed |
| `FORBIDDEN` | 403 | Not authorized for this site |
| `RATE_LIMIT` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `SERVER_ERROR` | 500 | Internal server error |

### Error Handling Example

```typescript
try {
  const res = await createBlankSiteAPI("Site", "slug");
} catch (err: any) {
  const errorCode = err.response?.data?.error?.code;
  const errorMsg = err.response?.data?.error?.message;
  
  if (errorCode === "INVALID_SLUG") {
    toast.error("That URL is taken. Try another!");
  } else {
    toast.error(errorMsg || "Something went wrong");
  }
}
```

---

## Rate Limiting

- **Free Plan:** 100 requests/hour
- **Pro Plan:** 1000 requests/hour
- **Expert Plan:** Unlimited

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1627651200
```

---

## Pagination

For list endpoints, use query parameters:

```typescript
// Get page 2 with 20 items per page
GET /api/sites?limit=20&offset=20

// Response includes:
{
  data: {
    items: [...],
    total: 150,
    limit: 20,
    offset: 20,
    hasMore: true
  }
}
```

---

## WebSocket Events

Real-time updates via Socket.io:

```typescript
// Connect
const socket = getSocket();

// Listen for site updates
socket.on(`site:${siteId}:updated`, (site) => {
  setSite(site);
});

// Listen for deployment status
socket.on(`site:${siteId}:deploy:status`, (status) => {
  console.log("Deploy:", status);
});

// Listen for submission
socket.on(`site:${siteId}:submission`, (submission) => {
  console.log("New submission:", submission);
});
```

---

## Authentication

### Get Auth Token

After login, token is stored in localStorage:
```typescript
const token = localStorage.getItem('auth_token');
```

### Using Token in Requests

```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

fetch('/api/sites', { headers })
```

All axios instances in the codebase auto-include token via interceptor.

---

## Rate Limit Best Practices

- ✅ Batch requests when possible
- ✅ Cache responses with React Query
- ✅ Debounce input handlers
- ✅ Use WebSocket for real-time updates
- ❌ Don't poll continuously
- ❌ Don't make duplicate requests

---

**Last Updated:** August 1, 2026
**Version:** 1.0.0
**Status:** Production Ready
