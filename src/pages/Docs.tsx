import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FileCode, FolderArchive, CheckCircle2, Rocket,
  Globe, Lock, Clock, Layers, Headset, Mail, Paintbrush,
  LayoutTemplate, BarChart3, Settings, Eye, ChevronRight,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "https://api.chasqr.com";

const SUPPORTED = [
  {
    name: "Plain HTML / CSS / JS",
    detail: "Any static website — no build step needed.",
    requirement: "index.html at the root of your ZIP",
  },
  {
    name: "React",
    detail: "Create React App or Vite projects.",
    requirement: "Run npm run build, zip the contents of the build/ or dist/ folder",
  },
  {
    name: "Vue",
    detail: "Vue 3 / Vite projects.",
    requirement: "Run npm run build, zip the contents of the dist/ folder",
  },
  {
    name: "Angular",
    detail: "Angular CLI projects.",
    requirement: "Run ng build, zip the contents of dist/<project-name>/",
  },
  {
    name: "Svelte / SvelteKit (static)",
    detail: "Static-adapter builds.",
    requirement: "Run npm run build, zip the contents of the build/ or dist/ folder",
  },
];

const UPCOMING = [
  "PHP / WordPress",
  "Node.js / Express backends",
  "Python (Django, Flask)",
  "Ruby on Rails",
];

const SECTIONS = [
  { id: "getting-started", label: "Getting Started", icon: Rocket },
  { id: "visual-builder", label: "Visual Builder Setup", icon: Paintbrush },
  { id: "builder-detailed", label: "Using the Visual Editor", icon: LayoutTemplate },
  { id: "editor-sections", label: "Building Sections", icon: Settings },
  { id: "manage-site", label: "Managing Your Site", icon: Settings },
  { id: "custom-domains", label: "Custom Domains", icon: Globe },
  { id: "analytics-forms", label: "Analytics & Forms", icon: BarChart3 },
  { id: "seo", label: "SEO Optimization", icon: Eye },
  { id: "how-to-deploy", label: "Deploy Existing Code", icon: Rocket },
  { id: "supported-types", label: "Supported Project Types", icon: Layers },
  { id: "file-requirements", label: "File Requirements", icon: FileCode },
  { id: "contact-forms", label: "Connect a Contact Form", icon: Mail },
  { id: "roadmap", label: "Roadmap", icon: Clock },
  { id: "get-help", label: "Get Help", icon: Headset },
];

export default function Docs() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );

    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && sectionRefs.current[hash]) {
      setTimeout(() => sectionRefs.current[hash]?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-bebas text-5xl text-slate-900 mb-3">Documentation</h1>
        <p className="text-slate-500 mb-10 leading-relaxed">
          Complete guide to using Chasqr. Learn how to build websites visually without code, or deploy your existing projects in minutes.
        </p>

        <div className="flex gap-10 items-start">
          {/* Sidebar */}
          <nav className="w-56 shrink-0 sticky top-28 hidden md:block">
            <div className="space-y-0.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = activeId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      active ? "bg-primary-light text-primary" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={15} className={active ? "text-primary" : "text-slate-400"} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Mobile section selector */}
          <div className="md:hidden w-full mb-2">
            <select
              value={activeId}
              onChange={(e) => scrollTo(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium bg-white"
            >
              {SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-w-0 max-w-3xl"
          >
            {/* Getting Started */}
            <section
              id="getting-started"
              ref={(el) => { sectionRefs.current["getting-started"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">Getting Started with Chasqr</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Welcome to Chasqr! Whether you want to build a website visually without coding, or deploy existing code, you're in the right place. Here's what you need to know:
              </p>

              <div className="space-y-4 mb-8">
                <div className="p-5 border-l-4 border-primary bg-primary-light/30 rounded-r-lg">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">Two Ways to Build</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <span className="font-medium">Option 1 - Visual Builder:</span> Create websites by dragging elements (text, images, buttons, sections) onto a canvas. No coding required. Perfect for portfolios, landing pages, and business sites.
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed mt-2">
                    <span className="font-medium">Option 2 - Deploy Code:</span> Have existing HTML, React, Vue, or Angular code? Upload it as a ZIP file and go live instantly. Full control over your code.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Getting Started:</span> Go to your Dashboard and click the "+ New Site" button. You'll see both options and can choose which path works for you.
                </p>
              </div>
            </section>

            {/* Visual Builder Setup */}
            <section
              id="visual-builder"
              ref={(el) => { sectionRefs.current["visual-builder"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">Creating Your First Site with Visual Builder</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Follow these step-by-step instructions to create and launch your first website using the visual builder:
              </p>

              {/* Step 1 */}
              <div className="mb-6 p-5 border border-slate-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">1</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-sm mb-2">Click "+ New Site" on Dashboard</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Log in to your Chasqr account and navigate to your Dashboard. Click the blue "+ New Site" button in the top right or center of the page.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
                      [SCREENSHOT AREA: Dashboard with "+ New Site" button highlighted]
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="mb-6 p-5 border border-slate-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">2</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-sm mb-2">Choose "Build from Scratch"</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      A modal dialog will appear with two options: "Deploy existing code" and "Build from scratch". Click on the "Build from scratch" card. This will take you to the site creation form.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
                      [SCREENSHOT AREA: Modal dialog showing two options]
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="mb-6 p-5 border border-slate-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">3</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-sm mb-2">Enter Site Name (Required)</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      You'll see a form with a "Site Name" field. Enter any name you like. This is just for your reference in the dashboard. Examples: "My Portfolio", "Coffee Shop", "Photography", etc. You can change this later if needed.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
                      [SCREENSHOT AREA: Site creation form with Site Name input field]
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="mb-6 p-5 border border-slate-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">4</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-sm mb-2">Set Custom URL (Optional)</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Below the site name, there's a "Custom URL" field marked as optional. This becomes your website's subdomain. For example, if you enter "my-portfolio", your site will be at <span className="font-mono text-xs bg-slate-100 px-1 rounded">https://my-portfolio.chasqr.io</span>.
                    </p>
                    <p className="text-sm text-slate-600 mb-3">
                      <strong>Rules:</strong> Use only lowercase letters, numbers, and hyphens. Minimum 3 characters, maximum 50. If you leave this blank, we'll auto-generate one for you. You can always change it later.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
                      [SCREENSHOT AREA: URL input field showing example "https://my-portfolio.chasqr.io"]
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="mb-6 p-5 border border-slate-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold text-sm">5</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-sm mb-2">Click "Create Site"</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Once you've entered your site name, click the blue "Create Site" button at the bottom of the form. The system will create your blank site and automatically open the Visual Editor.
                    </p>
                    <p className="text-sm text-slate-600">
                      You'll see a loading spinner briefly as the site is created, then the full-screen visual editor will open. This is where the magic happens!
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Using the Visual Editor */}
            <section
              id="builder-detailed"
              ref={(el) => { sectionRefs.current["builder-detailed"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">Using the Visual Editor - Complete Guide</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                The visual editor is where you design your website. It's organized into three main areas. Let's explore each one:
              </p>

              {/* The Three Areas */}
              <h3 className="font-semibold text-slate-900 text-base mb-4">The Three Main Areas</h3>

              <div className="mb-8 p-5 border border-slate-200 rounded-xl bg-gradient-to-br from-blue-50 to-transparent">
                <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs text-slate-600 mb-4">
                  [FULL PAGE SCREENSHOT: Visual Editor showing all three areas labeled]
                </div>
              </div>

              {/* Left Sidebar */}
              <div className="mb-8 p-5 border-l-4 border-primary bg-primary-light/20 rounded-r-lg">
                <h4 className="font-semibold text-slate-900 text-sm mb-3">Left Sidebar: Element Palette</h4>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  This is where all the building blocks are. You'll see a categorized list of elements you can add to your site. Here's what's available:
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">Text Elements</p>
                    <p className="text-xs text-slate-600">Heading (h1-h6), Paragraph, Small Text</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">Media</p>
                    <p className="text-xs text-slate-600">Image, Video embed</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">Interactive Elements</p>
                    <p className="text-xs text-slate-600">Button, Link, Form</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">Layout</p>
                    <p className="text-xs text-slate-600">Section, Column, Grid, Divider</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">Site Navigation</p>
                    <p className="text-xs text-slate-600">Navbar (top menu), Footer (bottom menu)</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  To add any element, scroll through this list and click on it. Then drag it onto the canvas in the center to place it on your site.
                </p>
              </div>

              {/* Center Canvas */}
              <div className="mb-8 p-5 border-l-4 border-green-500 bg-green-50/20 rounded-r-lg">
                <h4 className="font-semibold text-slate-900 text-sm mb-3">Center: Canvas (Your Website)</h4>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  This is a live preview of your website as you build it. It shows exactly how your site will look to visitors.
                </p>

                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">📍 Dragging Elements</p>
                    <p className="text-xs text-slate-600">Click and drag elements from the left palette onto the canvas to add them to your site. Position them wherever you like.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">🖱️ Selecting Elements</p>
                    <p className="text-xs text-slate-600">Click on any element in the canvas to select it. You'll see it highlighted with a blue border. Once selected, you can edit it in the right panel.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">⏱️ Right-Click Options</p>
                    <p className="text-xs text-slate-600">Right-click on any element to see options: Copy, Duplicate, Delete, or Move. These are quick shortcuts to modify elements.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">🎯 Live Preview</p>
                    <p className="text-xs text-slate-600">Everything updates in real-time. As you make changes, you immediately see how they look on your site.</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
                  [SCREENSHOT AREA: Canvas showing website with elements, right-click menu visible]
                </div>
              </div>

              {/* Right Panel */}
              <div className="mb-8 p-5 border-l-4 border-orange-500 bg-orange-50/20 rounded-r-lg">
                <h4 className="font-semibold text-slate-900 text-sm mb-3">Right Sidebar: Properties Panel</h4>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  When you select an element on the canvas, its properties appear on the right. This is where you edit everything about that element:
                </p>

                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">✏️ Content/Text</p>
                    <p className="text-xs text-slate-600">Edit the actual text. Type or paste whatever you want. For images, upload or paste image URLs.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">🎨 Colors</p>
                    <p className="text-xs text-slate-600">Change text color, background color, border color using color pickers. Click any color to open a color wheel.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">🔤 Typography</p>
                    <p className="text-xs text-slate-600">Adjust font family (Arial, Helvetica, etc.), font size (12px-72px), and weight (light, regular, bold).</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">📐 Spacing</p>
                    <p className="text-xs text-slate-600">Control padding (space inside), margin (space outside), alignment (left/center/right), and positioning.</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="font-medium text-slate-800 text-sm mb-1">✨ Effects & Styling</p>
                    <p className="text-xs text-slate-600">Add shadows, borders, opacity (transparency), rounded corners, and animations (hover effects).</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
                  [SCREENSHOT AREA: Properties panel showing all editing options for selected element]
                </div>
              </div>
            </section>

            {/* Building Sections */}
            <section
              id="editor-sections"
              ref={(el) => { sectionRefs.current["editor-sections"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">Building Sections: Step-by-Step</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Sections are the main building blocks of your site. Each section can contain multiple columns and elements. Here's how to build and structure your site:
              </p>

              {/* Understanding Sections */}
              <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-900 text-sm mb-3">What is a Section?</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Think of a section as a horizontal "band" across your website. It can span the full width and contain text, images, buttons, or multiple columns of content. Each section can have its own background color or image, padding, and styling.
                </p>
              </div>

              {/* Creating a Section */}
              <div className="mb-6 p-5 border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-900 text-sm mb-4">How to Create a Section</h4>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                  Look for the "+ Add Section" button in the left palette or below your existing content on the canvas. Click it to add a new blank section to your site.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
                  [SCREENSHOT AREA: "+ Add Section" button highlighted]
                </div>
              </div>

              {/* Styling a Section */}
              <div className="mb-6 p-5 border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-900 text-sm mb-4">Styling Your Section</h4>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                  Click on a section to select it, then use the right panel to:
                </p>
                <ul className="space-y-2">
                  <li className="text-sm text-slate-600">
                    <span className="font-medium">Background:</span> Set a solid color or upload a background image
                  </li>
                  <li className="text-sm text-slate-600">
                    <span className="font-medium">Padding:</span> Control space inside the section (how much margin around content)
                  </li>
                  <li className="text-sm text-slate-600">
                    <span className="font-medium">Height:</span> Make sections taller or shorter
                  </li>
                  <li className="text-sm text-slate-600">
                    <span className="font-medium">Alignment:</span> Center or align content left/right
                  </li>
                </ul>
              </div>

              {/* Adding Content to Sections */}
              <div className="mb-6 p-5 border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-900 text-sm mb-4">Adding Content Inside Sections</h4>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Once you create a section, you can add elements inside it. Here's the typical workflow:
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="text-sm"><span className="font-mono bg-slate-100 px-1 rounded text-xs">1.</span> Select the section by clicking on it</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="text-sm"><span className="font-mono bg-slate-100 px-1 rounded text-xs">2.</span> Drag elements from the left palette into the section</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="text-sm"><span className="font-mono bg-slate-100 px-1 rounded text-xs">3.</span> Edit each element's content and styling in the right panel</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="text-sm"><span className="font-mono bg-slate-100 px-1 rounded text-xs">4.</span> Arrange elements by dragging them around</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="text-sm"><span className="font-mono bg-slate-100 px-1 rounded text-xs">5.</span> Click "Save & Deploy" when you're happy with it</p>
                  </div>
                </div>
              </div>

              {/* Multi-Column Layouts */}
              <div className="mb-6 p-5 border-l-4 border-purple-500 bg-purple-50/20 rounded-r-lg">
                <h4 className="font-semibold text-slate-900 text-sm mb-3">Creating Two-Column or Multi-Column Layouts</h4>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                  Want a section with content side-by-side? Use the "Column" element:
                </p>
                <ol className="space-y-2 ml-4 list-decimal">
                  <li className="text-sm text-slate-600">Drag a "Column" element from the palette into your section</li>
                  <li className="text-sm text-slate-600">Drag another "Column" element to create a second column</li>
                  <li className="text-sm text-slate-600">Adjust column widths using the properties panel (e.g., 50/50 split, 30/70 split)</li>
                  <li className="text-sm text-slate-600">Add content (text, images, buttons) inside each column</li>
                </ol>
                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 mt-3">
                  [SCREENSHOT AREA: Two-column section example with content in each column]
                </div>
              </div>
            </section>

            {/* Managing Your Site */}
            <section
              id="manage-site"
              ref={(el) => { sectionRefs.current["manage-site"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">Managing Your Site After Creation</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Once you've created your site, go back to your dashboard and click "Manage" next to your site to access the admin panel. Here's what each section does:
              </p>

              <div className="space-y-4">
                <div className="p-5 border border-slate-200 rounded-xl bg-blue-50/30">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">📝 Editor Tab</h4>
                  <p className="text-sm text-slate-600">Edit the text and image content on your live pages without redesigning the layout. Quick edits for copywriting changes.</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl bg-blue-50/30">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">🎨 Layout Tab</h4>
                  <p className="text-sm text-slate-600">Opens the full-screen visual builder again. Use this when you want to redesign sections, add new content, or restructure your site.</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl bg-blue-50/30">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">🌈 Colors Tab</h4>
                  <p className="text-sm text-slate-600">Set your site's primary, secondary, and accent colors. All elements automatically update to use these colors.</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl bg-blue-50/30">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">🔍 SEO Tab</h4>
                  <p className="text-sm text-slate-600">Configure meta titles, descriptions, and Open Graph tags for better search engine rankings and social media sharing.</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl bg-blue-50/30">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">📊 Analytics Tab</h4>
                  <p className="text-sm text-slate-600">View traffic statistics including pageviews, visitors, popular pages, device types, and geographic data.</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl bg-blue-50/30">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">📮 Submissions Tab</h4>
                  <p className="text-sm text-slate-600">View all form submissions from your contact forms. Filter by form type and download data as CSV.</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl bg-blue-50/30">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">🔗 Site URL Tab</h4>
                  <p className="text-sm text-slate-600">Change your subdomain slug (e.g., from my-site to my-new-site). Changes take effect immediately.</p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl bg-blue-50/30">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">🌐 Custom Domain Tab</h4>
                  <p className="text-sm text-slate-600">Connect your own domain (e.g., example.com). We handle DNS and SSL certificates automatically.</p>
                </div>
              </div>
            </section>

            {/* Custom Domains */}
            <section
              id="custom-domains"
              ref={(el) => { sectionRefs.current["custom-domains"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">Setting Up a Custom Domain</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Your site comes with a free Chasqr subdomain (e.g., https://mysite.chasqr.io). Want your own domain? Here's how:
              </p>

              <div className="space-y-4 mb-6">
                <div className="p-5 border border-slate-200 rounded-xl">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">Step 1: Own Your Domain</h4>
                  <p className="text-sm text-slate-600">
                    Buy a domain from a registrar like GoDaddy, Namecheap, Domain.com, or Google Domains. Your domain will cost $10-15/year depending on your choice.
                  </p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">Step 2: Go to Custom Domain Settings</h4>
                  <p className="text-sm text-slate-600 mb-2">
                    In your site admin, click the "Custom Domain" tab. Click "Add Domain" and enter your domain (e.g., example.com).
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
                    [SCREENSHOT AREA: Custom Domain tab with form]
                  </div>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">Step 3: Update Nameservers at Your Registrar</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    We'll show you Cloudflare nameservers. Go to your domain registrar's settings and replace the existing nameservers with the ones we provide. This tells the internet to point your domain to our servers.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
                    [SCREENSHOT AREA: Nameservers to use]
                  </div>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">Step 4: Wait for Propagation</h4>
                  <p className="text-sm text-slate-600">
                    DNS changes can take 24-48 hours to propagate globally. During this time, your site might be inaccessible via the custom domain. This is normal. Sit tight and check back in a few hours.
                  </p>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl bg-green-50/30">
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">✅ You're Done!</h4>
                  <p className="text-sm text-slate-600">
                    Once propagation is complete, your site is live at your custom domain. We automatically provision a free SSL certificate so your site runs on HTTPS (secure).
                  </p>
                </div>
              </div>
            </section>

            {/* Analytics & Forms */}
            <section
              id="analytics-forms"
              ref={(el) => { sectionRefs.current["analytics-forms"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">Tracking Traffic & Form Submissions</h2>

              <div className="mb-8">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">📊 Analytics Tab: Understanding Your Traffic</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Go to Site Admin → Analytics to see how many people visit your site:
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm">
                    <span className="font-medium text-slate-800">Total Pageviews:</span> How many times people visited any page on your site
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm">
                    <span className="font-medium text-slate-800">Unique Visitors:</span> How many different people visited (one person visiting multiple times = 1 visitor)
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm">
                    <span className="font-medium text-slate-800">Traffic Over Time:</span> A graph showing visitors per day/week/month
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm">
                    <span className="font-medium text-slate-800">Device Breakdown:</span> What % of visitors use mobile vs desktop vs tablet
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm">
                    <span className="font-medium text-slate-800">Top Pages:</span> Which pages get the most traffic
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm">
                    <span className="font-medium text-slate-800">Geographic Data:</span> Which countries/cities your visitors come from
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 mt-4">
                  [SCREENSHOT AREA: Analytics dashboard with charts and stats]
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-4">📮 Submissions Tab: Collecting Form Data</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  Go to Site Admin → Submissions to see all form submissions from your site:
                </p>

                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="text-sm"><span className="font-medium text-slate-800">View Submissions:</span> See all forms submitted with dates and data</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="text-sm"><span className="font-medium text-slate-800">Filter by Form:</span> Show only submissions from a specific form</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="text-sm"><span className="font-medium text-slate-800">Download as CSV:</span> Export data to Excel for analysis</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <p className="text-sm"><span className="font-medium text-slate-800">Email Notifications:</span> Get an email when someone submits a form</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 mb-4">
                  [SCREENSHOT AREA: Submissions list showing form entries]
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Any contact form on your site automatically routes submissions here. No setup required — just add a form element to your site and we handle the rest.
                </p>
              </div>
            </section>

            {/* SEO Optimization */}
            <section
              id="seo"
              ref={(el) => { sectionRefs.current["seo"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">SEO: Making Your Site Discoverable</h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                SEO (Search Engine Optimization) helps your site rank higher on Google and appear nicely when shared on social media. Here's how to optimize:
              </p>

              <div className="mb-6 p-5 border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-900 text-sm mb-4">Go to Site Admin → SEO Tab</h4>
                <p className="text-sm text-slate-600 mb-4">Set these for each page of your site:</p>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-slate-900 text-sm mb-2">Page Title</p>
                    <p className="text-sm text-slate-600 mb-3">The title shown in browser tabs and Google search results. Keep it under 60 characters. Include keywords naturally. Example: "Professional Web Designer - Your City"</p>
                    <div className="bg-white border border-slate-200 rounded p-2 text-xs text-slate-500 font-mono">
                      [Example of how it appears in Google search]
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-semibold text-slate-900 text-sm mb-2">Meta Description</p>
                    <p className="text-sm text-slate-600 mb-3">The preview text shown under your link in Google results. Keep it under 160 characters. Make it compelling so people click. Example: "Award-winning web designer specializing in e-commerce sites. Over 10 years experience."</p>
                    <div className="bg-white border border-slate-200 rounded p-2 text-xs text-slate-500 font-mono">
                      [Example of how it appears in Google search]
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="font-semibold text-slate-900 text-sm mb-2">URL Slug</p>
                    <p className="text-sm text-slate-600">The URL for this page (e.g., /services, /about, /portfolio). Use keywords and hyphens. Avoid numbers and special characters.</p>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="font-semibold text-slate-900 text-sm mb-2">Open Graph Tags (Optional)</p>
                    <p className="text-sm text-slate-600 mb-2">Control how your site looks when shared on Facebook, Twitter, LinkedIn:</p>
                    <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                      <li>OG Title: What appears when someone shares your link</li>
                      <li>OG Description: Description shown in share preview</li>
                      <li>OG Image: The thumbnail image shown when shared</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-5 border-l-4 border-primary bg-primary-light/20 rounded-r-lg">
                <h4 className="font-semibold text-slate-900 text-sm mb-3">💡 SEO Audit Score</h4>
                <p className="text-sm text-slate-600 mb-3">We provide a score (0-100) for each page with recommendations to improve search rankings. Common tips:</p>
                <ul className="text-sm text-slate-600 space-y-1 ml-4 list-disc">
                  <li>Use keywords naturally in titles and descriptions</li>
                  <li>Write unique, original content (not copied from elsewhere)</li>
                  <li>Add alt text to images (describe what the image shows)</li>
                  <li>Use proper heading hierarchy (h1 for main title, h2 for subtitles)</li>
                  <li>Keep page load time under 3 seconds (optimize images)</li>
                  <li>Get backlinks (other websites linking to you)</li>
                </ul>
              </div>
            </section>

            {/* How to deploy */}
            <section
              id="how-to-deploy"
              ref={(el) => { sectionRefs.current["how-to-deploy"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">How to Deploy Existing Code</h2>
              <div className="space-y-4">
                {[
                  {
                    icon: <FolderArchive size={18} />,
                    title: "1. Prepare your files",
                    desc: "Make sure your project has an index.html file at the root level (see Supported Project Types below for framework-specific steps).",
                  },
                  {
                    icon: <Rocket size={18} />,
                    title: "2. Upload",
                    desc: "Go to Deploy, name your site, and upload either a ZIP file or select your project folder directly.",
                  },
                  {
                    icon: <Globe size={18} />,
                    title: "3. Go live instantly",
                    desc: "You'll get a shareable URL immediately. Connect your own custom domain anytime from the site's settings — free SSL included.",
                  },
                ].map((step) => (
                  <div key={step.title} className="flex gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-9 h-9 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-primary">
                      {step.icon}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{step.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Supported project types */}
            <section
              id="supported-types"
              ref={(el) => { sectionRefs.current["supported-types"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-2">Supported Project Types</h2>
              <p className="text-sm text-slate-500 mb-5">
                Chasqr hosts static files — plain sites, or the compiled output of frontend frameworks.
              </p>
              <div className="space-y-3">
                {SUPPORTED.map((s) => (
                  <div key={s.name} className="p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                      <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                    </div>
                    <p className="text-xs text-slate-500 ml-[1.65rem] mb-1">{s.detail}</p>
                    <p className="text-xs text-slate-600 ml-[1.65rem] font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1 inline-block">
                      {s.requirement}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* File requirements */}
            <section
              id="file-requirements"
              ref={(el) => { sectionRefs.current["file-requirements"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-5">File Requirements</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileCode size={15} className="text-primary" />
                    <p className="font-medium text-slate-800 text-sm">index.html is mandatory</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    It must sit at the root of your ZIP — not inside a subfolder. If your build tool
                    outputs a nested folder, zip the folder's contents, not the folder itself.
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lock size={15} className="text-amber-500" />
                    <p className="font-medium text-slate-800 text-sm">Size limits</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Uploads up to 5 MB are free. Larger uploads require a one-time payment per
                    site — after that, the site can be redeployed at any size, forever.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact forms */}
            <section
              id="contact-forms"
              ref={(el) => { sectionRefs.current["contact-forms"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-2">Connect a Contact Form</h2>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                Chasqr captures submissions from any contact form on your site — every field lands in
                your <span className="font-medium text-slate-700">Submissions</span> tab and is emailed to you.
              </p>

              <div className="p-4 bg-primary-light border border-primary/20 rounded-xl mb-6">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="font-semibold">Easiest way — no code:</span> if your uploaded HTML already has a
                  form, open your site → <span className="font-medium">Submissions</span>, and it's auto-detected.
                  Just click <span className="font-medium">Connect</span>. That's it.
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-700 mb-1">Manual setup</p>
              <p className="text-sm text-slate-500 mb-3 leading-relaxed">
                For full control, point your form at your site's submit endpoint:
              </p>
              <code className="block text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono text-slate-700 mb-2 overflow-x-auto">
                {API_URL}/api/forms/&lt;your-site-id&gt;/submit
              </code>
              <p className="text-xs text-slate-400 mb-6">
                Your <span className="font-medium">site ID</span> is the code in the dashboard URL while editing
                your site (<span className="font-mono">/sites/&lt;id&gt;</span>) — the exact endpoint is also shown
                in your Submissions tab.
              </p>

              <p className="text-sm font-semibold text-slate-700 mb-1">Option A — No code (page reloads on submit)</p>
              <p className="text-sm text-slate-500 mb-2">Set your form's <code className="bg-slate-100 px-1 rounded text-xs">action</code> and <code className="bg-slate-100 px-1 rounded text-xs">method</code>. The optional hidden field redirects visitors back after sending:</p>
              <pre className="text-[11px] bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto mb-6"><code>{`<form action="${API_URL}/api/forms/<your-site-id>/submit" method="POST">
  <input type="hidden" name="_redirect" value="https://yoursite.chasqr.com/thank-you">
  <!-- your existing fields — any names work -->
  <button type="submit">Send</button>
</form>`}</code></pre>

              <p className="text-sm font-semibold text-slate-700 mb-1">Option B — Stay on the page (add a small script)</p>
              <p className="text-sm text-slate-500 mb-2">Add <code className="bg-slate-100 px-1 rounded text-xs">data-chasqr-form</code> to your <code className="bg-slate-100 px-1 rounded text-xs">&lt;form&gt;</code> tag, then paste this before <code className="bg-slate-100 px-1 rounded text-xs">&lt;/body&gt;</code>:</p>
              <pre className="text-[11px] bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto mb-4"><code>{`<script>
document.querySelectorAll('[data-chasqr-form]').forEach(function(f){
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var data = Object.fromEntries(new FormData(f));
    fetch("${API_URL}/api/forms/<your-site-id>/submit", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(function(){ f.reset(); alert('Thanks — your message was sent!'); });
  });
});
</script>`}</code></pre>
              <p className="text-xs text-slate-400">
                Tip: fields need a <span className="font-mono">name</span> attribute to be captured. The one-click
                Connect handles this for you automatically; for manual setup, make sure each field has one.
              </p>
            </section>

            {/* Not yet supported */}
            <section
              id="roadmap"
              ref={(el) => { sectionRefs.current["roadmap"] = el; }}
              className="mb-14 scroll-mt-28"
            >
              <h2 className="font-bebas text-3xl text-slate-900 mb-2">Coming Soon</h2>
              <p className="text-sm text-slate-500 mb-5">
                These features require server-side processing which we're working on:
              </p>
              <div className="flex flex-wrap gap-2">
                {UPCOMING.map((u) => (
                  <span
                    key={u}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full"
                  >
                    <Clock size={11} /> {u}
                  </span>
                ))}
              </div>
            </section>

            {/* Need help */}
            <section
              id="get-help"
              ref={(el) => { sectionRefs.current["get-help"] = el; }}
              className="p-6 bg-primary-light border border-primary/20 rounded-2xl scroll-mt-28"
            >
              <h2 className="font-bebas text-2xl text-slate-900 mb-1.5">Still Have Questions?</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                If you need personalized help or prefer to have an expert make changes for you, reach out from your site's dashboard — we have verified experts ready to assist.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                Go to Dashboard
              </Link>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
