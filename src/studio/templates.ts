import {
  Box,
  StudioElement,
  StudioElementType,
  StudioSection,
  newElement,
  uid,
} from "./types";

/**
 * Prebuilt sections.
 *
 * A template is nothing but a section whose elements already have coordinates.
 * There is no template "type" carried in the data and no locked group — the
 * moment it lands on the canvas it is ordinary elements, so every heading,
 * card and form field can be dragged, resized and deleted independently. That
 * is the whole reason templates are expressed as plain elements rather than as
 * a composite block the way the grid builder does it.
 */

/** Build one element with an explicit box, starting from the type's defaults. */
function E(
  type: StudioElementType,
  box: Box,
  extra: Partial<StudioElement> = {},
): StudioElement {
  const base = newElement(type, "desktop", { x: box.x, y: box.y }, extra);
  return { ...base, boxes: { desktop: box } };
}

const section = (
  height: number,
  elements: StudioElement[],
  extra: Partial<StudioSection> = {},
): StudioSection => ({
  id: uid(),
  heights: { desktop: height },
  bg: "#ffffff",
  elements,
  ...extra,
});

const INK = "#0F172A";
const MUTED = "#475569";
const FAINT = "#94A3B8";
const LINE = "#E2E8F0";
const ACCENT = "#2563EB";

// The palette the supplied navigation designs are drawn in. Kept separate from
// the values above so restyling the stock templates cannot quietly redraw them.
const LU_INK = "#111827";
const LU_MUTED = "#4B5563";
const LU_FAINT = "#8A8F99";
const LU_LINE = "#E9EAEE";
const LU_SURFACE = "#F7F8FA";

// The palette the supplied tab designs are drawn in.
const TAB_SAND = "#F2EFE9";
const TAB_PAPER = "#FBFAF8";
const TAB_LINE = "#E4E0D9";
const TAB_INK = "#16181C";

const photo = (seed: string, w = 900, h = 700) =>
  `https://picsum.photos/seed/cq-${seed}/${w}/${h}`;

/** A white card surface. Sits behind its contents, so it takes the low z. */
const card = (box: Box, extra: Partial<StudioElement> = {}) =>
  E("shape", box, { bg: "#ffffff", radius: 16, shadow: true, border: LINE, z: 1, ...extra });

/** Three equal columns inside the 100…1100 content band. */
const COL_X = [100, 441, 782];
const COL_W = 317;

/** Sample content, identical across the three so the chrome is what differs. */
const TAB_CONTENT = [
  {
    label: "Overview",
    note: "The building at a glance",
    heading: "Marina Bay Tower",
    body: "Eleven floors of curved curtain-wall glass on the eastern quay, delivered shell-and-core with tenant fit-out allowances.",
    image: photo("tab-ov", 900, 700),
  },
  {
    label: "Details",
    note: "Specification and services",
    heading: "Building specification",
    body: "Floor-to-ceiling 2.85 m. Six passenger lifts and one goods. Parking at 1 : 950 sq ft. Certified LEED Gold.",
    image: photo("tab-dt", 900, 700),
  },
  {
    label: "Pricing",
    note: "Rents and availability",
    heading: "Availability",
    body: "Floors 3–4, 36,800 sq ft, available immediately at $52 / sq ft. Floor 8, 18,400 sq ft, from Q1 2027 at $58 / sq ft.",
    image: photo("tab-pr", 900, 700),
  },
];

export interface TemplateDef {
  key: string;
  label: string;
  group: string;
  /** Rough proportions for the panel's preview tile. */
  hint: string;
  build: () => StudioSection;
}

export const TEMPLATES: TemplateDef[] = [
  // ── Hero ────────────────────────────────────────────────────────────────
  {
    key: "hero-split",
    label: "Split hero",
    group: "Hero & content",
    hint: "Copy on the left, image on the right",
    build: () =>
      section(560, [
        E("heading", { x: 100, y: 128, w: 500, h: 132 }, {
          text: "Build something people\nwant to use.",
          fontSize: 52,
          fontWeight: 700,
          color: INK,
        }),
        E("text", { x: 100, y: 276, w: 460, h: 84 }, {
          text: "A short paragraph explaining what you do and who it is for. Two lines is usually enough.",
          fontSize: 18,
          color: MUTED,
        }),
        E("button", { x: 100, y: 392, w: 176, h: 50 }, { text: "Get started" }),
        E("button", { x: 292, y: 392, w: 156, h: 50 }, {
          text: "Learn more",
          bg: "#ffffff",
          color: INK,
          border: "#CBD5E1",
        }),
        E("image", { x: 648, y: 96, w: 452, h: 368 }, { src: photo("hero"), radius: 16 }),
      ]),
  },
  {
    key: "hero-centered",
    label: "Centred hero",
    group: "Hero & content",
    hint: "Headline, subtext and two buttons",
    build: () =>
      section(520, [
        E("heading", { x: 250, y: 120, w: 700, h: 130 }, {
          text: "Everything you need,\nnothing you don't.",
          fontSize: 54,
          fontWeight: 700,
          align: "center",
          color: INK,
        }),
        E("text", { x: 300, y: 268, w: 600, h: 72 }, {
          text: "One clear sentence about the product, aimed at the person who just landed here.",
          fontSize: 18,
          align: "center",
          color: MUTED,
        }),
        E("button", { x: 432, y: 372, w: 160, h: 50 }, { text: "Start free" }),
        E("button", { x: 608, y: 372, w: 160, h: 50 }, {
          text: "Book a demo",
          bg: "#ffffff",
          color: INK,
          border: "#CBD5E1",
        }),
      ], { bg: "#F8FAFC" }),
  },
  {
    key: "hero-image-bg",
    label: "Image hero",
    group: "Hero & content",
    hint: "Full-bleed photo with text over it",
    build: () =>
      section(600, [
        E("heading", { x: 200, y: 200, w: 800, h: 140 }, {
          text: "Made for the way you work",
          fontSize: 56,
          fontWeight: 700,
          align: "center",
          color: "#ffffff",
        }),
        E("text", { x: 300, y: 356, w: 600, h: 72 }, {
          text: "Say the one thing you want remembered, over an image that earns its place.",
          fontSize: 18,
          align: "center",
          color: "#E2E8F0",
        }),
        E("button", { x: 520, y: 456, w: 160, h: 50 }, { text: "Get started" }),
      ], { bgImage: photo("cover", 1600, 900), overlay: 0.5 }),
  },

  // ── Content ─────────────────────────────────────────────────────────────
  {
    key: "features-3",
    label: "Feature cards",
    group: "Hero & content",
    hint: "Icon, title and description cards",
    build: () => {
      const copy = [
        ["Fast by default", "Static output on a global edge, so pages arrive before anyone waits."],
        ["Yours to own", "Bring your own domain, export at any time. Nothing is locked in."],
        ["No maintenance", "Certificates, builds and caching are handled without you thinking about it."],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 300, y: 72, w: 600, h: 52 }, {
          text: "Why teams choose it",
          fontSize: 36,
          fontWeight: 700,
          align: "center",
          color: INK,
        }),
        E("text", { x: 340, y: 134, w: 520, h: 48 }, {
          text: "Three things worth saying, in the order that matters.",
          fontSize: 16,
          align: "center",
          color: MUTED,
        }),
      ];
      COL_X.forEach((x, i) => {
        els.push(card({ x, y: 214, w: COL_W, h: 196 }));
        els.push(E("icon", { x: x + 32, y: 246, w: 40, h: 40 }, { color: ACCENT, z: 2 }));
        els.push(E("heading", { x: x + 32, y: 302, w: 253, h: 28 }, {
          text: copy[i][0], fontSize: 19, fontWeight: 600, color: INK, z: 2,
        }));
        els.push(E("text", { x: x + 32, y: 338, w: 253, h: 54 }, {
          text: copy[i][1], fontSize: 14, color: MUTED, z: 2,
        }));
      });
      return section(470, els);
    },
  },
  {
    key: "image-text",
    label: "Image + text",
    group: "Banners & sections",
    hint: "Picture beside a paragraph",
    build: () =>
      section(520, [
        E("image", { x: 100, y: 88, w: 480, h: 344 }, { src: photo("about"), radius: 16 }),
        E("heading", { x: 628, y: 120, w: 440, h: 100 }, {
          text: "A little about us",
          fontSize: 38,
          fontWeight: 700,
          color: INK,
        }),
        E("text", { x: 628, y: 236, w: 440, h: 120 }, {
          text: "Two or three sentences of background. Who you are, how long you have been doing this, and why someone should care.",
          fontSize: 16,
          color: MUTED,
        }),
        E("button", { x: 628, y: 380, w: 160, h: 48 }, { text: "Read more" }),
      ]),
  },
  {
    key: "stats-band",
    label: "Stats band",
    group: "Hero & content",
    hint: "Four numbers on a dark strip",
    build: () => {
      const stats = [
        ["12k+", "Sites deployed"],
        ["99.9%", "Uptime"],
        ["40ms", "Median response"],
        ["24/7", "Support"],
      ];
      const els: StudioElement[] = [];
      stats.forEach(([n, l], i) => {
        const x = 100 + i * 250;
        els.push(E("heading", { x, y: 96, w: 250, h: 54 }, {
          text: n, fontSize: 40, fontWeight: 700, align: "center", color: "#ffffff",
        }));
        els.push(E("text", { x, y: 156, w: 250, h: 28 }, {
          text: l, fontSize: 14, align: "center", color: FAINT,
        }));
      });
      return section(260, els, { bg: INK });
    },
  },
  {
    key: "logos-strip",
    label: "Logo strip",
    group: "Hero & content",
    hint: "A row of client marks",
    build: () => {
      const els: StudioElement[] = [
        E("text", { x: 400, y: 64, w: 400, h: 28 }, {
          text: "TRUSTED BY TEAMS AT",
          fontSize: 12,
          fontWeight: 600,
          align: "center",
          color: FAINT,
        }),
      ];
      // Empty slots, each ready to take a logo. `contain` because a client
      // mark cropped to fill its box is worse than no mark at all.
      [100, 313, 525, 738, 950].forEach((x) =>
        els.push(E("shape", { x, y: 112, w: 150, h: 48 }, {
          bg: "#E2E8F0", radius: 8, fit: "contain",
        })),
      );
      return section(210, els, { bg: "#F8FAFC" });
    },
  },
  {
    key: "gallery-6",
    label: "Gallery",
    group: "Hero & content",
    hint: "Six images in a grid",
    build: () => {
      const els: StudioElement[] = [
        E("heading", { x: 300, y: 64, w: 600, h: 48 }, {
          text: "Recent work", fontSize: 34, fontWeight: 700, align: "center", color: INK,
        }),
      ];
      [150, 374].forEach((y, r) =>
        COL_X.forEach((x, c) =>
          els.push(E("image", { x, y, w: COL_W, h: 200 }, {
            src: photo(`g${r}${c}`, 700, 500), radius: 12,
          })),
        ),
      );
      return section(620, els);
    },
  },

  // ── Pricing and proof ───────────────────────────────────────────────────
  {
    key: "pricing-3",
    label: "Pricing (3 tiers)",
    group: "Card templates",
    hint: "Tier, price, features, button",
    build: () => {
      const plans = [
        ["Free", "$0", "One site\nChasqr subdomain\nCommunity support"],
        ["Pro", "$12", "Ten sites\nCustom domains\nForm submissions by email"],
        ["Team", "$39", "Unlimited sites\nShared workspace\nPriority support"],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 300, y: 72, w: 600, h: 52 }, {
          text: "Simple pricing", fontSize: 36, fontWeight: 700, align: "center", color: INK,
        }),
      ];
      COL_X.forEach((x, i) => {
        const featured = i === 1;
        els.push(card({ x, y: 190, w: COL_W, h: 340 }, featured ? { border: ACCENT } : {}));
        els.push(E("text", { x: x + 32, y: 222, w: 200, h: 26 }, {
          text: plans[i][0], fontSize: 15, fontWeight: 600, color: MUTED, z: 2,
        }));
        els.push(E("heading", { x: x + 32, y: 254, w: 220, h: 56 }, {
          text: plans[i][1], fontSize: 42, fontWeight: 700, color: INK, z: 2,
        }));
        els.push(E("text", { x: x + 32, y: 324, w: 253, h: 120 }, {
          text: plans[i][2], fontSize: 14, color: MUTED, z: 2,
        }));
        els.push(E("button", { x: x + 32, y: 464, w: 253, h: 46 }, {
          text: featured ? "Start Pro" : "Choose",
          bg: featured ? ACCENT : "#ffffff",
          color: featured ? "#ffffff" : INK,
          border: featured ? undefined : "#CBD5E1",
          z: 2,
        }));
      });
      return section(620, els, { bg: "#F8FAFC" });
    },
  },
  {
    key: "testimonials-3",
    label: "Testimonials",
    group: "Card templates",
    hint: "Three quotes with names",
    build: () => {
      const quotes = [
        ["“Went from nothing to a live site in an afternoon.”", "Priya N."],
        ["“The only builder I have not had to fight with.”", "Marcus L."],
        ["“Our whole team ships pages now, not just me.”", "Dana K."],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 300, y: 72, w: 600, h: 52 }, {
          text: "What people say", fontSize: 36, fontWeight: 700, align: "center", color: INK,
        }),
      ];
      COL_X.forEach((x, i) => {
        els.push(card({ x, y: 190, w: COL_W, h: 220 }));
        els.push(E("text", { x: x + 28, y: 218, w: 261, h: 110 }, {
          text: quotes[i][0], fontSize: 15, color: INK, z: 2,
        }));
        els.push(E("shape", { x: x + 28, y: 344, w: 40, h: 40 }, {
          bg: "#E2E8F0", radius: 20, z: 2,
        }));
        els.push(E("text", { x: x + 80, y: 352, w: 170, h: 24 }, {
          text: quotes[i][1], fontSize: 14, fontWeight: 600, color: MUTED, z: 2,
        }));
      });
      return section(460, els);
    },
  },

  // ── Forms ───────────────────────────────────────────────────────────────
  {
    key: "form-split",
    label: "Split Form (Untitled UI)",
    group: "Forms",
    hint: "Copy on the left, fields on a card",
    build: () =>
      section(640, [
        E("heading", { x: 100, y: 104, w: 440, h: 108 }, {
          text: "Get in touch", fontSize: 40, fontWeight: 700, color: INK,
        }),
        E("text", { x: 100, y: 228, w: 420, h: 96 }, {
          text: "Tell us what you need and we will come back to you within one working day.",
          fontSize: 16,
          color: MUTED,
        }),
        E("text", { x: 100, y: 360, w: 420, h: 100 }, {
          text: "hello@example.com\n+44 20 7946 0000\nLondon, United Kingdom",
          fontSize: 15,
          color: MUTED,
        }),

        card({ x: 600, y: 88, w: 500, h: 476 }),
        E("field", { x: 640, y: 136, w: 210, h: 74 }, {
          label: "Name", name: "name", fieldType: "text", placeholder: "Jane Doe", required: true, z: 2,
        }),
        E("field", { x: 874, y: 136, w: 210, h: 74 }, {
          label: "Email", name: "email", fieldType: "email", placeholder: "jane@company.com", required: true, z: 2,
        }),
        E("field", { x: 640, y: 226, w: 210, h: 74 }, {
          label: "Phone", name: "phone", fieldType: "phone", placeholder: "Optional", z: 2,
        }),
        E("field", { x: 874, y: 226, w: 210, h: 74 }, {
          label: "Subject", name: "subject", fieldType: "select",
          options: ["General enquiry", "Sales", "Support", "Something else"], z: 2,
        }),
        E("field", { x: 640, y: 316, w: 444, h: 150 }, {
          label: "Message", name: "message", fieldType: "textarea",
          placeholder: "How can we help?", required: true, z: 2,
        }),
        E("button", { x: 640, y: 486, w: 180, h: 48 }, {
          text: "Send message", submit: true, z: 2,
        }),
      ], { bg: "#F8FAFC", successMessage: "Thanks — we'll be in touch shortly." }),
  },
  {
    key: "form-simple",
    label: "Short form",
    group: "Forms",
    hint: "Name, email and a message",
    build: () =>
      section(600, [
        E("heading", { x: 350, y: 72, w: 500, h: 50 }, {
          text: "Say hello", fontSize: 34, fontWeight: 700, align: "center", color: INK,
        }),
        E("text", { x: 400, y: 128, w: 400, h: 44 }, {
          text: "We read everything that comes through.",
          fontSize: 16, align: "center", color: MUTED,
        }),
        card({ x: 350, y: 190, w: 500, h: 340 }),
        E("field", { x: 390, y: 226, w: 200, h: 74 }, {
          label: "Name", name: "name", fieldType: "text", required: true, z: 2,
        }),
        E("field", { x: 610, y: 226, w: 200, h: 74 }, {
          label: "Email", name: "email", fieldType: "email", required: true, z: 2,
        }),
        E("field", { x: 390, y: 316, w: 420, h: 130 }, {
          label: "Message", name: "message", fieldType: "textarea", required: true, z: 2,
        }),
        E("button", { x: 390, y: 462, w: 160, h: 46 }, { text: "Send", submit: true, z: 2 }),
      ], { bg: "#F8FAFC", successMessage: "Thanks — message received." }),
  },
  {
    key: "form-survey",
    label: "Survey Step Form",
    group: "Forms",
    hint: "Eight fields for qualifying leads",
    build: () =>
      section(790, [
        E("heading", { x: 100, y: 72, w: 600, h: 48 }, {
          text: "Tell us about your project", fontSize: 32, fontWeight: 700, color: INK,
        }),
        E("text", { x: 100, y: 126, w: 600, h: 40 }, {
          text: "The more we know up front, the more useful our first reply will be.",
          fontSize: 15, color: MUTED,
        }),
        E("field", { x: 100, y: 200, w: 480, h: 74 }, {
          label: "Full name", name: "name", fieldType: "text", required: true,
        }),
        E("field", { x: 620, y: 200, w: 480, h: 74 }, {
          label: "Work email", name: "email", fieldType: "email", required: true,
        }),
        E("field", { x: 100, y: 290, w: 480, h: 74 }, {
          label: "Company", name: "company", fieldType: "text",
        }),
        E("field", { x: 620, y: 290, w: 480, h: 74 }, {
          label: "Your role", name: "role", fieldType: "select",
          options: ["Founder", "Marketing", "Engineering", "Design", "Other"],
        }),
        E("field", { x: 100, y: 380, w: 480, h: 74 }, {
          label: "Team size", name: "team_size", fieldType: "select",
          options: ["Just me", "2–10", "11–50", "51–200", "200+"],
        }),
        E("field", { x: 620, y: 380, w: 480, h: 74 }, {
          label: "Phone", name: "phone", fieldType: "phone", placeholder: "Optional",
        }),
        E("field", { x: 100, y: 470, w: 1000, h: 150 }, {
          label: "What are you looking to build?", name: "details", fieldType: "textarea",
        }),
        E("field", { x: 100, y: 640, w: 500, h: 40 }, {
          label: "Send me occasional product updates", name: "opt_in", fieldType: "checkbox",
        }),
        E("button", { x: 100, y: 700, w: 200, h: 48 }, { text: "Submit", submit: true }),
      ], { successMessage: "Thanks — we'll review this and reply soon." }),
  },

  // ── Calls to action, nav and footers ────────────────────────────────────
  {
    key: "cta-band",
    label: "Call to action",
    group: "Card templates",
    hint: "One line and one button",
    build: () =>
      section(300, [
        E("heading", { x: 250, y: 88, w: 700, h: 60 }, {
          text: "Ready to put it live?", fontSize: 36, fontWeight: 700,
          align: "center", color: "#ffffff",
        }),
        E("text", { x: 350, y: 156, w: 500, h: 40 }, {
          text: "No card needed. Deploy in under a minute.",
          fontSize: 16, align: "center", color: "#DBEAFE",
        }),
        E("button", { x: 520, y: 216, w: 160, h: 48 }, {
          text: "Get started", bg: "#ffffff", color: ACCENT,
        }),
      ], { bg: ACCENT }),
  },
  {
    key: "nav-simple",
    label: "Navbar",
    group: "Banners & sections",
    hint: "Logo, menu and a button",
    build: () =>
      section(88, [
        E("navbar", { x: 100, y: 26, w: 840, h: 36 }, {
          text: "Brand",
          color: LU_INK,
          fontSize: 15,
          links: [
            { label: "Home", href: "#" },
            {
              label: "Services",
              href: "#",
              children: [
                { label: "Design", href: "#" },
                { label: "Development", href: "#" },
                { label: "Support", href: "#" },
              ],
            },
            { label: "About", href: "#" },
            { label: "Contact", href: "#" },
          ],
        }),
        E("button", { x: 980, y: 22, w: 120, h: 44 }, { text: "Sign up" }),
      ]),
  },
  {
    key: "footer-columns",
    label: "Footer (4 columns)",
    group: "Banners & sections",
    hint: "Brand, link columns and legal line",
    build: () => {
      const cols = [
        ["Product", "Features\nPricing\nChangelog"],
        ["Company", "About\nBlog\nCareers"],
        ["Legal", "Privacy\nTerms\nCookies"],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 100, y: 64, w: 200, h: 32 }, {
          text: "Brand", fontSize: 20, fontWeight: 700, color: "#ffffff",
        }),
        E("text", { x: 100, y: 108, w: 260, h: 72 }, {
          text: "One sentence about what you do, for the people who scrolled this far.",
          fontSize: 14, color: FAINT,
        }),
        E("social", { x: 100, y: 200, w: 160, h: 36 }, { color: "#ffffff" }),
      ];
      cols.forEach(([title, links], i) => {
        const x = 560 + i * 200;
        els.push(E("text", { x, y: 64, w: 180, h: 26 }, {
          text: title, fontSize: 14, fontWeight: 600, color: "#ffffff",
        }));
        els.push(E("text", { x, y: 100, w: 180, h: 120 }, {
          text: links, fontSize: 14, color: FAINT,
        }));
      });
      els.push(E("divider", { x: 100, y: 288, w: 1000, h: 1 }, { bg: "#1E293B" }));
      els.push(E("text", { x: 100, y: 310, w: 400, h: 24 }, {
        text: "© 2026 Brand. All rights reserved.", fontSize: 13, color: "#64748B",
      }));
      return section(360, els, { bg: INK });
    },
  },
  {
    key: "footer-simple",
    label: "Footer (simple)",
    group: "Banners & sections",
    hint: "One line and social icons",
    build: () =>
      section(160, [
        E("text", { x: 100, y: 64, w: 400, h: 24 }, {
          text: "© 2026 Brand. All rights reserved.", fontSize: 14, color: MUTED,
        }),
        E("social", { x: 940, y: 56, w: 160, h: 36 }, { color: MUTED }),
      ], { bg: "#F8FAFC" }),
  },

  // -- Ported from the grid builder ---------------------------------------
  {
    key: "image-banner",
    label: "Image banner",
    group: "Banners & sections",
    hint: "Short photo band with a title over it",
    build: () =>
      section(440, [
        E("tags", { x: 520, y: 120, w: 160, h: 32 }, {
          options: ["New"], bg: "#ffffff", color: INK, fontSize: 12,
        }),
        E("heading", { x: 200, y: 170, w: 800, h: 80 }, {
          text: "A line worth stopping for",
          fontSize: 46, fontWeight: 700, align: "center", color: "#ffffff",
        }),
        E("text", { x: 300, y: 262, w: 600, h: 48 }, {
          text: "One supporting sentence, no more.",
          fontSize: 17, align: "center", color: "#E2E8F0",
        }),
        E("button", { x: 520, y: 340, w: 160, h: 48 }, { text: "See more" }),
      ], { bgImage: photo("banner", 1600, 700), overlay: 0.45 }),
  },
  {
    key: "text-over-image",
    label: "Text over image",
    group: "Banners & sections",
    hint: "Photo with a floating copy panel",
    build: () =>
      section(560, [
        E("image", { x: 0, y: 0, w: 1200, h: 560 }, { src: photo("overlay", 1600, 800), radius: 0 }),
        card({ x: 100, y: 140, w: 520, h: 300 }, { z: 2 }),
        E("heading", { x: 140, y: 180, w: 440, h: 90 }, {
          text: "Where the story starts", fontSize: 34, fontWeight: 700, color: INK, z: 3,
        }),
        E("text", { x: 140, y: 286, w: 440, h: 80 }, {
          text: "A paragraph that sits over the photograph rather than beside it.",
          fontSize: 16, color: MUTED, z: 3,
        }),
        E("button", { x: 140, y: 378, w: 160, h: 46 }, { text: "Read on", z: 3 }),
      ]),
  },
  {
    key: "carousel",
    label: "Carousel slider",
    group: "Banners & sections",
    hint: "Heading over a sliding gallery",
    build: () =>
      section(620, [
        E("heading", { x: 300, y: 64, w: 600, h: 48 }, {
          text: "Have a look around", fontSize: 34, fontWeight: 700, align: "center", color: INK,
        }),
        E("carousel", { x: 100, y: 140, w: 1000, h: 420 }, {
          images: [photo("c1", 1400, 700), photo("c2", 1400, 700), photo("c3", 1400, 700)],
        }),
      ]),
  },
  {
    key: "cards-image-3",
    label: "Image-top cards",
    group: "Card templates",
    hint: "Three cards led by a photo",
    build: () => {
      const copy = [
        ["Discovery", "We work out what the thing actually needs to do."],
        ["Design", "Then what it should look like while doing it."],
        ["Delivery", "And we ship it, with the boring parts handled."],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 300, y: 64, w: 600, h: 48 }, {
          text: "How it works", fontSize: 34, fontWeight: 700, align: "center", color: INK,
        }),
      ];
      COL_X.forEach((x, i) => {
        els.push(card({ x, y: 150, w: COL_W, h: 340 }));
        els.push(E("image", { x: x + 16, y: 166, w: 285, h: 160 }, {
          src: photo(`ic${i}`, 700, 400), radius: 10, z: 2,
        }));
        els.push(E("heading", { x: x + 16, y: 344, w: 269, h: 28 }, {
          text: copy[i][0], fontSize: 19, fontWeight: 600, color: INK, z: 2,
        }));
        els.push(E("text", { x: x + 16, y: 380, w: 269, h: 64 }, {
          text: copy[i][1], fontSize: 14, color: MUTED, z: 2,
        }));
      });
      return section(560, els);
    },
  },
  {
    key: "overlay-cards",
    label: "Image overlay cards",
    group: "Card templates",
    hint: "Three photos with text laid over them",
    build: () => {
      const copy = [
        ["Studios", "Twelve rooms across two floors."],
        ["Workshops", "Small groups, long afternoons."],
        ["Residencies", "Three months, no deliverables."],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 300, y: 64, w: 600, h: 48 }, {
          text: "What is here", fontSize: 34, fontWeight: 700, align: "center", color: INK,
        }),
      ];
      COL_X.forEach((x, i) => {
        // The scrim is the card surface here: it holds the photo and the words,
        // so the group survives the move to a phone intact.
        els.push(E("shape", { x, y: 150, w: COL_W, h: 300 }, {
          bg: INK, radius: 16, opacity: 0.55, z: 2,
        }));
        els.push(E("image", { x, y: 150, w: COL_W, h: 300 }, {
          src: photo(`oc${i}`, 700, 700), radius: 16, z: 1,
        }));
        els.push(E("heading", { x: x + 20, y: 372, w: 277, h: 30 }, {
          text: copy[i][0], fontSize: 20, fontWeight: 700, color: "#ffffff", z: 3,
        }));
        els.push(E("text", { x: x + 20, y: 406, w: 277, h: 40 }, {
          text: copy[i][1], fontSize: 13, color: "#E2E8F0", z: 3,
        }));
      });
      return section(520, els);
    },
  },
  {
    key: "profile-cards",
    label: "Profile cards",
    group: "Card templates",
    hint: "Portrait, name, role and links",
    build: () => {
      const people = [
        ["Ada Okafor", "Founder"],
        ["Ben Halloran", "Design"],
        ["Chen Wei", "Engineering"],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 300, y: 64, w: 600, h: 48 }, {
          text: "The people", fontSize: 34, fontWeight: 700, align: "center", color: INK,
        }),
      ];
      COL_X.forEach((x, i) => {
        els.push(card({ x, y: 150, w: COL_W, h: 300 }));
        els.push(E("image", { x: x + 110, y: 182, w: 96, h: 96 }, {
          src: photo(`p${i}`, 400, 400), radius: 48, z: 2,
        }));
        els.push(E("heading", { x: x + 24, y: 300, w: 269, h: 28 }, {
          text: people[i][0], fontSize: 18, fontWeight: 600, align: "center", color: INK, z: 2,
        }));
        els.push(E("text", { x: x + 24, y: 334, w: 269, h: 24 }, {
          text: people[i][1], fontSize: 14, align: "center", color: MUTED, z: 2,
        }));
        els.push(E("social", { x: x + 98, y: 376, w: 120, h: 36 }, { color: MUTED, z: 2 }));
      });
      return section(520, els);
    },
  },
  {
    key: "showcase-card",
    label: "Showcase card",
    group: "Card templates",
    hint: "One wide card, image beside copy",
    build: () =>
      section(560, [
        card({ x: 100, y: 88, w: 1000, h: 384 }),
        E("image", { x: 124, y: 112, w: 440, h: 336 }, { src: photo("show"), radius: 12, z: 2 }),
        E("tags", { x: 600, y: 136, w: 300, h: 32 }, {
          options: ["Featured", "Limited"], z: 2,
        }),
        E("heading", { x: 600, y: 184, w: 460, h: 60 }, {
          text: "The one we are proud of", fontSize: 30, fontWeight: 700, color: INK, z: 2,
        }),
        E("text", { x: 600, y: 254, w: 460, h: 90 }, {
          text: "Enough room to explain why this one matters without writing an essay about it.",
          fontSize: 15, color: MUTED, z: 2,
        }),
        E("rating", { x: 600, y: 356, w: 140, h: 26 }, { value: 5, z: 2 }),
        E("button", { x: 600, y: 396, w: 160, h: 46 }, { text: "Take a look", z: 2 }),
      ], { bg: "#F8FAFC" }),
  },
  {
    key: "product-carousel",
    label: "Product-card carousel",
    group: "Card templates",
    hint: "Image, rating and price",
    build: () => {
      const items = [
        ["Field Notebook", "$18"],
        ["Canvas Tote", "$32"],
        ["Enamel Mug", "$14"],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 100, y: 64, w: 600, h: 44 }, {
          text: "In the shop", fontSize: 32, fontWeight: 700, color: INK,
        }),
      ];
      COL_X.forEach((x, i) => {
        els.push(card({ x, y: 150, w: COL_W, h: 380 }));
        els.push(E("image", { x: x + 16, y: 166, w: 285, h: 200 }, {
          src: photo(`pr${i}`, 600, 600), radius: 10, z: 2,
        }));
        els.push(E("heading", { x: x + 16, y: 382, w: 269, h: 26 }, {
          text: items[i][0], fontSize: 17, fontWeight: 600, color: INK, z: 2,
        }));
        els.push(E("rating", { x: x + 16, y: 414, w: 120, h: 22 }, { value: 4, z: 2 }));
        els.push(E("price", { x: x + 16, y: 444, w: 160, h: 56 }, {
          text: items[i][1], caption: "incl. tax", fontSize: 28, z: 2,
        }));
      });
      return section(600, els, { bg: "#F8FAFC" });
    },
  },
  {
    key: "form-split-agency",
    label: "Agency Form (Orfactor)",
    group: "Forms",
    hint: "Form on a dark background",
    build: () =>
      section(640, [
        E("heading", { x: 100, y: 104, w: 440, h: 108 }, {
          text: "Start a project", fontSize: 40, fontWeight: 700, color: "#ffffff",
        }),
        E("text", { x: 100, y: 228, w: 420, h: 96 }, {
          text: "Give us the shape of it and we will tell you honestly whether we are the right people.",
          fontSize: 16, color: FAINT,
        }),
        E("social", { x: 100, y: 380, w: 160, h: 36 }, { color: "#ffffff" }),

        E("shape", { x: 600, y: 88, w: 500, h: 476 }, {
          bg: "#1E293B", border: "#334155", radius: 16, z: 1,
        }),
        E("field", { x: 640, y: 136, w: 210, h: 74 }, {
          label: "Name", name: "name", fieldType: "text", required: true,
          color: "#ffffff", bg: "#0F172A", border: "#334155", z: 2,
        }),
        E("field", { x: 874, y: 136, w: 210, h: 74 }, {
          label: "Email", name: "email", fieldType: "email", required: true,
          color: "#ffffff", bg: "#0F172A", border: "#334155", z: 2,
        }),
        E("field", { x: 640, y: 226, w: 444, h: 74 }, {
          label: "Budget", name: "budget", fieldType: "select",
          options: ["Under 5k", "5k-20k", "20k-50k", "More than 50k"],
          color: "#ffffff", bg: "#0F172A", border: "#334155", z: 2,
        }),
        E("field", { x: 640, y: 316, w: 444, h: 150 }, {
          label: "The project", name: "message", fieldType: "textarea", required: true,
          color: "#ffffff", bg: "#0F172A", border: "#334155", z: 2,
        }),
        E("button", { x: 640, y: 486, w: 200, h: 48 }, {
          text: "Send it over", submit: true, z: 2,
        }),
      ], { bg: INK, successMessage: "Got it. We will read this properly and reply." }),
  },
  {
    key: "nav-search",
    label: "Navbar + search",
    group: "Banners & sections",
    hint: "Logo, search field and a button",
    build: () =>
      section(88, [
        E("navbar", { x: 100, y: 26, w: 840, h: 36 }, {
          text: "Brand",
          color: LU_INK,
          fontSize: 15,
          links: [
            {
              label: "Docs",
              href: "#",
              children: [
                { label: "Getting started", href: "#" },
                { label: "API reference", href: "#" },
              ],
            },
            { label: "Blog", href: "#" },
          ],
        }),
        E("search", { x: 400, y: 20, w: 300, h: 48 }, { placeholder: "Search the site…" }),
        E("button", { x: 980, y: 22, w: 120, h: 44 }, { text: "Sign up" }),
      ]),
  },
  {
    key: "shader-banner",
    label: "Animated banner",
    group: "Banners & sections",
    hint: "Moving gradient behind a headline",
    build: () =>
      section(520, [
        E("shader", { x: 0, y: 0, w: 1200, h: 520 }, { radius: 0 }),
        E("heading", { x: 200, y: 180, w: 800, h: 90 }, {
          text: "Something worth looking at",
          fontSize: 50, fontWeight: 700, align: "center", color: "#ffffff", z: 2,
        }),
        E("text", { x: 300, y: 292, w: 600, h: 56 }, {
          text: "The motion is the point. Keep the words short.",
          fontSize: 17, align: "center", color: "#E2E8F0", z: 2,
        }),
        E("button", { x: 520, y: 376, w: 160, h: 50 }, {
          text: "Get started", bg: "#ffffff", color: INK, z: 2,
        }),
      ]),
  },
  {
    key: "reveal-cards",
    label: "Hover reveal cards",
    group: "Card templates",
    hint: "Photos that show their text on hover",
    build: () => {
      const copy = [
        ["Atelier", "Open Thursdays, by appointment the rest of the week."],
        ["Archive", "Everything we have made since 2014, catalogued."],
        ["Apprenticeship", "One place a year. Applications open in March."],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 300, y: 64, w: 600, h: 48 }, {
          text: "Hover to read", fontSize: 34, fontWeight: 700, align: "center", color: INK,
        }),
      ];
      COL_X.forEach((x, i) => {
        els.push(E("image", { x, y: 150, w: COL_W, h: 300 }, {
          src: photo(`rc${i}`, 700, 700), radius: 16, z: 1,
        }));
        els.push(E("shape", { x, y: 150, w: COL_W, h: 300 }, {
          bg: INK, radius: 16, opacity: 0.72, z: 2, revealOnHover: true,
        }));
        els.push(E("heading", { x: x + 24, y: 240, w: 269, h: 32 }, {
          text: copy[i][0], fontSize: 22, fontWeight: 700, align: "center",
          color: "#ffffff", z: 3, revealOnHover: true,
        }));
        els.push(E("text", { x: x + 24, y: 282, w: 269, h: 72 }, {
          text: copy[i][1], fontSize: 14, align: "center", color: "#E2E8F0",
          z: 3, revealOnHover: true,
        }));
      });
      return section(520, els);
    },
  },
  {
    key: "multi-carousel",
    label: "Multi-image carousel",
    group: "Card templates",
    hint: "Three slides visible at a time",
    build: () =>
      section(560, [
        E("heading", { x: 100, y: 64, w: 600, h: 44 }, {
          text: "From the archive", fontSize: 32, fontWeight: 700, color: INK,
        }),
        E("carousel", { x: 100, y: 140, w: 1000, h: 360 }, {
          perView: 3,
          images: [
            photo("mc1", 700, 700), photo("mc2", 700, 700), photo("mc3", 700, 700),
            photo("mc4", 700, 700), photo("mc5", 700, 700),
          ],
        }),
      ]),
  },
  {
    key: "cards-text-3",
    label: "Text cards",
    group: "Card templates",
    hint: "Three cards, words only",
    build: () => {
      const copy = [
        ["Clear scope", "We agree what is in and what is out before anyone opens an editor."],
        ["Fixed rhythm", "A demo every Friday, whether or not the week went to plan."],
        ["Honest handover", "You get the source, the docs and an hour to ask anything."],
      ];
      const els: StudioElement[] = [
        E("heading", { x: 300, y: 72, w: 600, h: 52 }, {
          text: "How we work", fontSize: 36, fontWeight: 700, align: "center", color: INK,
        }),
      ];
      COL_X.forEach((x, i) => {
        els.push(card({ x, y: 190, w: COL_W, h: 200 }));
        els.push(E("heading", { x: x + 28, y: 222, w: 261, h: 28 }, {
          text: copy[i][0], fontSize: 19, fontWeight: 600, color: INK, z: 2,
        }));
        els.push(E("text", { x: x + 28, y: 258, w: 261, h: 100 }, {
          text: copy[i][1], fontSize: 14, color: MUTED, z: 2,
        }));
      });
      return section(440, els, { bg: "#F8FAFC" });
    },
  },

  // -- Navigation treatments from the supplied design ---------------------
  {
    key: "nav-glass",
    label: "Glass navbar over hero",
    group: "Banners & sections",
    hint: "Frosted bar floating on a moving backdrop",
    build: () =>
      section(420, [
        // The bar only reads as glass when something is actually moving under
        // it, which is what the animated backdrop is doing here.
        E("shader", { x: 0, y: 0, w: 1200, h: 420 }, {
          colors: ["#1B2233", "#2F3B57", "#5A4A6B"],
          radius: 0,
          speed: 1.4,
        }),

        E("shape", { x: 40, y: 24, w: 1120, h: 64 }, {
          bg: "#FFFFFF",
          opacity: 0.12,
          border: "#FFFFFF",
          radius: 14,
          blur: true,
          z: 2,
        }),
        E("shape", { x: 64, y: 45, w: 22, h: 22 }, { bg: "#FFFFFF", radius: 6, z: 3 }),
        E("navbar", { x: 96, y: 40, w: 620, h: 32 }, {
          text: "Lumiere",
          color: "#FFFFFF",
          fontSize: 14,
          z: 3,
          links: [
            {
              label: "Platform",
              href: "#",
              children: [
                { label: "Storefront kit", href: "#" },
                { label: "GraphQL API", href: "#" },
                { label: "Content branches", href: "#" },
              ],
            },
            { label: "Services", href: "#" },
            { label: "Customers", href: "#" },
            { label: "Pricing", href: "#" },
          ],
        }),
        E("text", { x: 916, y: 47, w: 70, h: 20 }, {
          text: "Sign in", fontSize: 14, color: "#E5E7EB", href: "#", z: 3,
        }),
        E("button", { x: 1000, y: 36, w: 136, h: 40 }, {
          text: "Book a demo", bg: "#FFFFFF", color: LU_INK, radius: 9, fontSize: 14, z: 3,
        }),

        E("heading", { x: 64, y: 208, w: 520, h: 120 }, {
          text: "Commerce infrastructure,\nwithout the seams",
          fontSize: 36, fontWeight: 700, color: "#FFFFFF", z: 2,
        }),
        E("text", { x: 64, y: 336, w: 520, h: 48 }, {
          text: "The bar reads as glass because there is real imagery moving under it.",
          fontSize: 15, color: "#CBD5E1", z: 2,
        }),
      ], { bg: "#1B2233" }),
  },
  {
    key: "nav-pill",
    label: "Floating pill navbar",
    group: "Banners & sections",
    hint: "Detached capsule with the page scrolling beneath",
    build: () =>
      section(380, [
        // The capsule is its own surface so the menu and the button can sit on
        // it as separate, individually editable pieces.
        E("shape", { x: 250, y: 28, w: 700, h: 56 }, {
          bg: "#FFFFFF",
          opacity: 0.86,
          border: LU_LINE,
          radius: 100,
          shadow: true,
          blur: true,
          z: 1,
        }),
        E("shape", { x: 270, y: 46, w: 20, h: 20 }, { bg: LU_INK, radius: 6, z: 2 }),
        E("navbar", { x: 298, y: 40, w: 490, h: 32 }, {
          text: "Lumiere",
          color: LU_MUTED,
          fontSize: 14,
          z: 2,
          links: [
            {
              label: "Platform",
              href: "#",
              children: [
                { label: "Checkout", href: "#" },
                { label: "Payments & tax", href: "#" },
                { label: "Subscriptions", href: "#" },
              ],
            },
            { label: "Services", href: "#" },
            { label: "Customers", href: "#" },
            { label: "Pricing", href: "#" },
          ],
        }),
        E("button", { x: 800, y: 36, w: 136, h: 40 }, {
          text: "Book a demo", bg: LU_INK, color: "#FFFFFF", radius: 100, fontSize: 14, z: 2,
        }),

        E("heading", { x: 290, y: 148, w: 620, h: 88 }, {
          text: "One system behind every part of the sale",
          fontSize: 36, fontWeight: 700, align: "center", color: LU_INK,
        }),
        E("text", { x: 380, y: 248, w: 440, h: 48 }, {
          text: "Content scrolls beneath the capsule; the page keeps its own margins.",
          fontSize: 15, align: "center", color: LU_MUTED,
        }),
      ], { bg: LU_SURFACE }),
  },
  {
    key: "nav-rail",
    label: "Rail navbar + mega menu",
    group: "Banners & sections",
    hint: "Utility strip, flush bar and an open panel",
    build: () => {
      const cols: [string, string, number][] = [
        ["BUILD", "Storefront kit\nGraphQL API\nContent branches", 48],
        ["SELL", "Checkout\nPayments & tax\nSubscriptions", 340],
        ["OPERATE", "Inventory ledger\nFulfilment\nReturns", 632],
      ];
      const els: StudioElement[] = [
        E("shape", { x: 0, y: 0, w: 1200, h: 36 }, { bg: LU_INK, radius: 0, z: 1 }),
        E("text", { x: 24, y: 10, w: 560, h: 18 }, {
          text: "Migrating from a legacy platform? We do it in 14 days.",
          fontSize: 12, color: "#B9BEC8", z: 2,
        }),
        E("text", { x: 1010, y: 10, w: 60, h: 18 }, {
          text: "Status", fontSize: 12, color: "#B9BEC8", href: "#", z: 2,
        }),
        E("text", { x: 1076, y: 10, w: 50, h: 18 }, {
          text: "Docs", fontSize: 12, color: "#B9BEC8", href: "#", z: 2,
        }),
        E("text", { x: 1132, y: 10, w: 40, h: 18 }, {
          text: "EN", fontSize: 12, color: "#B9BEC8", href: "#", z: 2,
        }),

        E("shape", { x: 24, y: 52, w: 22, h: 22 }, { bg: LU_INK, radius: 6, z: 2 }),
        E("navbar", { x: 56, y: 48, w: 760, h: 32 }, {
          text: "Lumiere",
          color: LU_MUTED,
          fontSize: 14,
          z: 2,
          links: [
            {
              label: "Platform",
              href: "#",
              children: [
                { label: "Storefront kit", href: "#" },
                { label: "GraphQL API", href: "#" },
                { label: "Content branches", href: "#" },
              ],
            },
            { label: "Solutions", href: "#" },
            { label: "Customers", href: "#" },
            { label: "Pricing", href: "#" },
            { label: "Resources", href: "#" },
          ],
        }),
        E("text", { x: 972, y: 56, w: 60, h: 20 }, {
          text: "Sign in", fontSize: 14, color: LU_MUTED, href: "#", z: 2,
        }),
        E("button", { x: 1042, y: 46, w: 134, h: 38 }, {
          text: "Book a demo", bg: LU_INK, color: "#FFFFFF", radius: 8, fontSize: 14, z: 2,
        }),
        E("divider", { x: 0, y: 96, w: 1200, h: 1 }, { bg: LU_LINE, z: 2 }),

        // The panel is drawn open, as in the design. It is ordinary elements,
        // so it can be deleted outright and the Platform dropdown still works.
        E("shape", { x: 0, y: 97, w: 1200, h: 208 }, {
          bg: "#FFFFFF", border: LU_LINE, radius: 0, shadow: true, z: 1,
        }),
      ];

      cols.forEach(([title, items, x]) => {
        els.push(E("text", { x, y: 126, w: 220, h: 18 }, {
          text: title, fontSize: 12, fontWeight: 600, color: LU_FAINT, z: 2,
        }));
        els.push(E("text", { x, y: 154, w: 240, h: 84 }, {
          text: items, fontSize: 14, fontWeight: 500, color: LU_INK, z: 2,
        }));
      });

      els.push(E("shape", { x: 924, y: 122, w: 240, h: 158 }, {
        bg: LU_SURFACE, border: LU_LINE, radius: 10, z: 2,
      }));
      els.push(E("text", { x: 944, y: 140, w: 200, h: 16 }, {
        text: "NEW", fontSize: 12, fontWeight: 600, color: LU_FAINT, z: 3,
      }));
      els.push(E("heading", { x: 944, y: 162, w: 200, h: 24 }, {
        text: "Headless checkout 3.0", fontSize: 15, fontWeight: 600, color: LU_INK, z: 3,
      }));
      els.push(E("text", { x: 944, y: 194, w: 200, h: 48 }, {
        text: "Edge-resolved duties in 60 markets.",
        fontSize: 13, color: LU_MUTED, z: 3,
      }));

      return section(340, els);
    },
  },

  // -- Multi-tab sections -------------------------------------------------
  // The three treatments differ in where the tab list sits, so each one lays
  // its panel out around it. Content is the same shape in all three: a label,
  // a note, a title, a paragraph and a picture per tab — all editable.
  {
    key: "tabs-editorial",
    label: "Editorial tabs",
    group: "Tabs",
    hint: "Underlined labels, quiet chrome, content leads",
    build: () =>
      section(520, [
        E("shape", { x: 100, y: 60, w: 1000, h: 400 }, {
          bg: TAB_PAPER, border: TAB_LINE, radius: 4, z: 1,
        }),
        E("tabs", { x: 148, y: 104, w: 904, h: 312 }, {
          tabVariant: "underline",
          tabImageSide: "left",
          tabTransition: "fade",
          color: TAB_INK,
          fontSize: 16,
          z: 2,
          tabs: TAB_CONTENT,
        }),
      ], { bg: TAB_SAND }),
  },
  {
    key: "tabs-index",
    label: "Numbered index tabs",
    group: "Tabs",
    hint: "Dark panel, tabs read as a table of contents",
    build: () =>
      section(560, [
        E("shape", { x: 100, y: 60, w: 1000, h: 440 }, {
          bg: TAB_INK, radius: 4, z: 1,
        }),
        E("tabs", { x: 148, y: 104, w: 904, h: 352 }, {
          tabVariant: "index",
          tabImageSide: "top",
          tabTransition: "fade",
          color: TAB_PAPER,
          fontSize: 16,
          z: 2,
          tabs: TAB_CONTENT,
        }),
      ], { bg: TAB_SAND }),
  },
  {
    key: "tabs-stepper",
    label: "Stepper tabs",
    group: "Tabs",
    hint: "Numbered steps with a progress line",
    build: () =>
      section(560, [
        E("shape", { x: 100, y: 60, w: 1000, h: 440 }, {
          bg: TAB_PAPER, border: TAB_LINE, radius: 4, z: 1,
        }),
        E("tabs", { x: 148, y: 104, w: 904, h: 352 }, {
          tabVariant: "stepper",
          tabImageSide: "right",
          tabTransition: "slide",
          color: TAB_INK,
          fontSize: 16,
          z: 2,
          tabs: TAB_CONTENT,
        }),
      ], { bg: TAB_SAND }),
  },
];

/** The old palette's section order, kept so nothing has to be hunted for. */
export const TEMPLATE_GROUPS = [
  "Banners & sections",
  "Forms",
  "Card templates",
  "Tabs",
  "Hero & content",
];
