# 🎨 TalentIQ Frontend — Design System & Developer Guide

> **Next.js 15 · TypeScript · Tailwind CSS v4 · Framer Motion · Three.js**
>
> A premium, dark-themed AI career coaching interface built with a cohesive `Black → Blue → White` design language.

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── globals.css         # 🎨 Design system — all tokens, keyframes & utilities
│   │   ├── layout.tsx          # Root layout (fonts, Clerk auth wrapper)
│   │   ├── page.tsx            # Landing page (Hero, Features, How It Works)
│   │   ├── dashboard/          # Main authenticated dashboard
│   │   ├── resume/             # AI Resume Analyzer
│   │   ├── job-analysis/       # JD vs Resume matcher
│   │   ├── copilot/            # AI Career Copilot chat
│   │   ├── mock-interview/     # Mock interview module
│   │   ├── live-interview/     # Live interview session
│   │   ├── analytics/          # Career analytics & charts
│   │   ├── tracker/            # Job application tracker
│   │   ├── groups/             # Community groups
│   │   └── studynotion/        # Study notes module
│   ├── components/
│   │   ├── Navbar.tsx          # Scroll-aware fixed navbar
│   │   ├── DashboardLayout.tsx # Sidebar + main area wrapper
│   │   ├── ui-custom.tsx       # GlassCard & GlowButton primitives
│   │   ├── ui/                 # Shadcn-style headless components
│   │   └── 3d/                 # Three.js 3D scene components
│   └── lib/
│       └── utils.ts            # cn() class merger utility
├── package.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 🖋️ Typography

All fonts are loaded via `next/font/google` (zero-layout-shift, self-hosted by Next.js).

| Role        | Font Family       | CSS Variable        | Weights       | Used On                          |
|-------------|-------------------|---------------------|---------------|----------------------------------|
| **Display** | **Syne**          | `--font-display`    | 400, 700, 800 | All headings `h1–h6`, logo, CTAs |
| **Body**    | **DM Sans**       | `--font-sans`       | 400, 500, 600 | Body text, paragraphs, labels    |
| **Mono**    | **JetBrains Mono**| `--font-mono`       | 400, 500      | Code blocks, terminal output     |

### Usage in JSX / Tailwind

```tsx
// Headings — automatic via globals.css @layer base
<h1>TalentIQ</h1>                   // → Syne, 800

// Body — default on <body>
<p>Some body text</p>               // → DM Sans, 400

// Mono — explicit class
<code className="font-mono">...</code>  // → JetBrains Mono
```

---

## 🎨 Color Palette

The entire UI uses a **Black → Blue → White** signature system.

### Core Background Scale

| Token                | Hex         | Description                          |
|----------------------|-------------|--------------------------------------|
| `--color-navy`       | `#0a0a0a`   | App background (near black)           |
| `--color-dark-slate` | `#161616`   | Card surfaces, sidebars               |
| `--color-mid-slate`  | `#262626`   | Borders, dividers, subtle separators  |

### Brand Accent Colors

| Token               | Hex       | Usage                                     |
|---------------------|-----------|-------------------------------------------|
| `--color-teal-600`  | `#378ADD` | Primary brand blue — buttons, links, glow |
| `--color-teal-300`  | `#60A5FA` | Lighter blue — hover states, carets       |
| `--color-violet`    | `#8B5CF6` | Secondary accent — secondary buttons      |
| `--color-amber`     | `#F59E0B` | Warning / bonus badges                    |
| `--color-rose`      | `#F43F5E` | Error / missing / destructive states      |
| `--color-cyan`      | `#378ADD` | (alias of teal-600)                       |
| `--color-slate-100` | `#F1F5F9` | High-contrast text on dark surfaces       |

### Semantic Text Colors

| CSS Variable      | Hex       | Usage                    |
|-------------------|-----------|--------------------------|
| `--text-primary`  | `#FFFFFF` | Primary headings & labels|
| `--text-muted`    | `#A1A1AA` | Secondary text, nav links|

### Glow Effects (box-shadow)

| Variable         | Value                                    | Applied To          |
|------------------|------------------------------------------|---------------------|
| `--glow-teal`    | `0 0 20px rgba(55, 138, 221, 0.4)`       | Cards, buttons      |
| `--glow-violet`  | `0 0 20px rgba(139, 92, 246, 0.4)`       | Secondary elements  |

### Signature Gradient Strip

A 4 px decorative top-bar used throughout as a visual brand signature:

```css
/* Black → Blue → White */
background: linear-gradient(90deg, #0a0a0a 0%, #378ADD 50%, #FFFFFF 100%);
```

---

## 🧱 Component Classes (globals.css)

### `.glass-card`

A frosted-glass card surface — the primary content container across all pages.

```css
background:      rgba(22, 22, 22, 0.6);
backdrop-filter: blur(20px);
border:          1px solid rgba(38, 38, 38, 0.8);
border-radius:   16px;
transition:      all 0.3s ease;
```

**With hover** (add `.glass-card-hover`):
- Border color shifts to `rgba(55, 138, 221, 0.4)` (blue)
- Receives `--glow-teal` box-shadow
- Lifts 2 px via `transform: translateY(-2px)`

---

### `.glow-btn` / `.glow-btn-primary`

Reusable CTA button with glow on hover.

| State    | Effect                                                    |
|----------|-----------------------------------------------------------|
| Default  | Blue-tinted transparent bg, blue border                   |
| `:hover` | Intensified bg + `--glow-teal` shadow + `scale(1.02)`    |
| `:active`| `scale(0.98)` for tactile press feedback                  |

**Primary variant** (`.glow-btn-primary`):
- Solid `#378ADD` background, white text
- Darkens to `#2E73B8` on hover

---

### `.sidebar-item` / `.sidebar-item.active`

```
Default:  color #A1A1AA, transparent background
Hover:    color #60A5FA, bg rgba(55,138,221,0.1)
Active:   color #60A5FA, bg rgba(55,138,221,0.15) + 3px left border #378ADD
```

---

### Skill Badges

| Class                  | Border / BG Color | Text Color  | Meaning         |
|------------------------|-------------------|-------------|-----------------|
| `.skill-badge-matched` | `#378ADD` blue    | `#60A5FA`   | ✅ Found in JD   |
| `.skill-badge-missing` | `#F43F5E` rose    | `#FDA4AF`   | ❌ Gap skill     |
| `.skill-badge-bonus`   | `#F59E0B` amber   | `#FCD34D`   | ⭐ Bonus skill   |

---

### `.stat-card`

Dashboard metric cards — dark fill with blue border + glow on hover.

---

### `.typewriter-text`

A CSS-only typewriter animation with a blinking blue caret (`#60A5FA`).

---

### `.code-output`

Terminal/code result block — `#0a0a0a` background, `var(--font-mono)`, 13 px.

---

## ✨ Animations & Keyframes

All keyframes are defined in `globals.css` and exposed as utility classes.

### Keyframe Reference

| Keyframe           | Effect                                         | Duration Hint  |
|--------------------|------------------------------------------------|----------------|
| `float-y`          | Vertical bob (0 → -8 px → 0)                  | 6s infinite    |
| `fade-in`          | Opacity + slide up 20 px                       | 0.6s           |
| `fade-in-up`       | Same as fade-in (forwards fill)                | 0.7s           |
| `slide-in-left`    | Slide from -20 px left + fade in              | 0.7s           |
| `scale-up`         | Scale 0.9 → 1 + fade in                       | 0.5s           |
| `rotate`           | Continuous 360° spin                           | 2s infinite    |
| `shimmer`          | Loading skeleton shimmer sweep                 | 1.5s infinite  |
| `gradient-shift`   | Animated gradient (teal → violet → rose)       | 3s infinite    |
| `background-pan`   | Pans a 200%-wide background left               | 10s infinite   |
| `spin`             | Simple full rotation                           | 3s slow        |
| `bounce`           | Elastic bounce up (material-style)             | 1s infinite    |
| `wiggle`           | Rotation ±3°                                   | 1s infinite    |
| `shake`            | Horizontal shake (error state)                 | 0.8s           |
| `pulse-green`      | Green glow pulse (status dot)                  | 2s infinite    |
| `pulse-blue`       | Blue glow pulse                                | 2s infinite    |
| `pulse-red`        | Red glow pulse                                 | 2s infinite    |
| `ping`             | Scale to 2× + fade (notification ring)         | 1s infinite    |
| `typing`           | Typewriter text reveal (width 0 → 100%)        | 3s             |
| `blink-caret`      | Blinking cursor border                         | 0.75s infinite |

### Animation Utility Classes

Apply any animation instantly with these classes on any element:

```html
<!-- Entry Animations -->
<div class="animate-fade-in">...</div>
<div class="animate-fade-in-up">...</div>
<div class="animate-slide-in-left">...</div>
<div class="animate-scale-up">...</div>

<!-- Continuous Animations -->
<div class="animate-float-y">...</div>        <!-- hero 3D globe -->
<div class="animate-rotate">...</div>         <!-- spinner -->
<div class="animate-spin-slow">...</div>      <!-- slow loader -->
<div class="animate-shimmer">...</div>        <!-- skeleton loader -->
<div class="animate-gradient-shift">...</div> <!-- live gradient text -->
<div class="animate-background-pan">...</div> <!-- panning bg -->

<!-- State Animations -->
<div class="animate-bounce">...</div>
<div class="animate-wiggle">...</div>
<div class="animate-shake">...</div>          <!-- error state -->
<div class="animate-ping">...</div>           <!-- notification dot -->

<!-- Glow Pulses -->
<div class="animate-pulse-blue">...</div>
<div class="animate-pulse-red">...</div>
<span class="status-dot-active">...</span>    <!-- green pulse dot -->
```

---

## 🎭 Transitions

| Element              | Property        | Duration | Easing         |
|----------------------|-----------------|----------|----------------|
| `.glass-card`        | `all`           | `0.3s`   | `ease`         |
| `.glass-card-hover`  | border + shadow | `0.3s`   | `ease`         |
| `.glow-btn`          | `all`           | `0.2s`   | `ease`         |
| `.sidebar-item`      | `all`           | `0.2s`   | `ease`         |
| `.stat-card`         | `all`           | `0.2s`   | —              |
| Navbar (on scroll)   | `all`           | `0.3s`   | `ease`         |
| Nav links (hover)    | `colors`        | instant  | Tailwind       |
| `GlassCard` (Framer) | `translateY, scale` | spring | Framer Motion |
| `GlowButton` (Framer)| `scale`         | spring   | `whileTap`     |
| Ambient glow overlay | `opacity`       | `0.5s`   | `ease`         |

---

## 🪟 Glassmorphism System

Two layers of glass are used throughout:

### CSS Glass (`.glass-card`)
- `backdrop-filter: blur(20px)` — blurs content behind card
- `background: rgba(22, 22, 22, 0.6)` — semi-transparent dark fill
- `border: 1px solid rgba(38, 38, 38, 0.8)` — subtle border

### React Glass (`<GlassCard />` in `ui-custom.tsx`)
- `bg-white/5` + `backdrop-blur-md` (Tailwind)
- Powered by **Framer Motion** `whileHover` for lift animation
- Ambient gradient overlay: `from-blue-500/5 to-purple-500/5` on hover

---

## 🧩 Reusable React Components

### `<GlassCard />`

```tsx
import { GlassCard } from "@/components/ui-custom";

<GlassCard hover={true} className="p-8">
  <h2>Card Title</h2>
</GlassCard>
```

| Prop        | Type      | Default | Description                       |
|-------------|-----------|---------|-----------------------------------|
| `hover`     | `boolean` | `true`  | Enable Framer Motion lift on hover|
| `className` | `string`  | —       | Extra Tailwind classes            |

### `<GlowButton />`

```tsx
import { GlowButton } from "@/components/ui-custom";

<GlowButton variant="primary" glow={true}>Launch Copilot</GlowButton>
<GlowButton variant="secondary">View Resume</GlowButton>
<GlowButton variant="outline">Cancel</GlowButton>
```

| Variant     | Background     | Glow Color    |
|-------------|----------------|---------------|
| `primary`   | `#2563EB` blue | Blue 30%→50%  |
| `secondary` | `#9333EA` violet | Purple 30%→50%|
| `outline`   | Transparent    | None          |

All variants use `whileTap={{ scale: 0.98 }}` for press feedback.

---

## 🌐 Navbar Behavior

The `<Navbar />` is **scroll-aware** and transitions between two visual states:

| State          | Background                   | Backdrop Filter | Border                       |
|----------------|------------------------------|-----------------|------------------------------|
| **Top of page**| Transparent                  | None            | Transparent                  |
| **Scrolled**   | `rgba(10,10,10,0.92)`        | `blur(20px)`    | `rgba(38,38,38,0.6)` bottom  |

Transition: `all 0.3s ease` — smooth glass effect slides in as user scrolls past 20 px.

---

## 🔮 3D Components (Three.js)

Located in `src/components/3d/` — uses **@react-three/fiber** and **@react-three/drei**.

| File            | Description                                          |
|-----------------|------------------------------------------------------|
| `Canvas3D.tsx`  | Root WebGL canvas with `ErrorBoundary` + `Suspense`  |
| `HeroGlobe.tsx` | Animated 3D globe shown in the landing page hero     |

Dependencies:
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — helpers (Loader, OrbitControls, etc.)
- `@react-three/postprocessing` — bloom / depth-of-field effects
- `react-error-boundary` — catches WebGL failures gracefully

---

## 📜 Custom Scrollbar

A minimal 4 px scrollbar, applied with class `.custom-scrollbar`:

```
Track:     transparent
Thumb:     rgba(94, 234, 212, 0.3)  → teal-300 at 30%
Thumb:hover rgba(94, 234, 212, 0.5) → teal-300 at 50%
```

---

## 🔑 Key Dependencies

| Package                    | Version  | Purpose                              |
|----------------------------|----------|--------------------------------------|
| `next`                     | 15.1.0   | App framework (App Router)           |
| `react` / `react-dom`      | 19.0.0   | UI library                           |
| `tailwindcss`              | ^4       | Utility-first CSS                    |
| `framer-motion`            | ^12.4.10 | Page & component animations          |
| `@clerk/nextjs`            | ^6.12.3  | Authentication & user management     |
| `@react-three/fiber`       | ^9.5.0   | Three.js in React                    |
| `@react-three/drei`        | ^10.7.7  | Three.js helpers                     |
| `@react-three/postprocessing`| ^3.0.4 | Visual post-processing (bloom, etc.) |
| `react-error-boundary`     | ^6.1.1   | WebGL / 3D error recovery            |
| `lucide-react`             | ^0.477.0 | Icon set                             |
| `recharts`                 | ^2.15.1  | Analytics charts                     |
| `react-markdown`           | ^9.1.0   | Markdown rendering in Copilot        |
| `axios`                    | ^1.8.1   | HTTP client for API calls            |
| `zustand`                  | ^5.0.3   | Global state management              |
| `@monaco-editor/react`     | ^4.7.0   | In-browser code editor               |
| `stream-chat-react`        | ^12.16.0 | Real-time group chat                 |
| `@stream-io/video-react-sdk`| ^1.11.0 | Live interview video calls           |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build
```

### Required Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STREAM_API_KEY=...
```

---

## 🎯 Design Principles

1. **Black → Blue → White** — every gradient, every glow, every accent follows this signature direction.
2. **Glassmorphism first** — surfaces use translucent dark fills + blur rather than solid opaque panels.
3. **Glow over shadow** — interactive states use coloured box-shadow (glow) instead of traditional drop shadows.
4. **Motion with purpose** — entry animations reveal content intentionally; continuous animations (float, pulse) add life without distraction.
5. **Mono for data** — all code, scores, and technical values use JetBrains Mono for instant visual distinction.


Making a 3D website feel smooth is less about removing 3D and more about being intentional with performance.

1. Reduce Geometry (Biggest Impact)
Avoid high-poly models
Use low-poly + normal maps instead of detailed meshes
Simplify shapes wherever possible

2. Optimize Textures
Compress textures (use tools like Squoosh or TinyPNG)
Stick to .webp format
Keep texture sizes under control (don’t use 4K unless absolutely needed)
Reuse textures instead of loading new ones

3. Use Lazy Loading for 3D
Don’t load the entire scene on page load
Load 3D only when needed (on scroll or interaction)
Show a lightweight placeholder first

4. Limit Real-Time Rendering
Avoid heavy lighting + shadows
Use baked lighting instead of dynamic lighting
Reduce reflections and transparency

5. Use Efficient Libraries
Prefer optimized frameworks like Three.js or React Three Fiber
Avoid stacking too many libraries/plugins

6. Control Animations
Avoid continuous animations everywhere
Use trigger-based motion (hover, scroll, click)
Lower frame rate if needed for background elements

7. Use LOD (Level of Detail)
Load high-quality models only when close to the camera
Use simpler versions when far away

8. Compress 3D Files
Use formats like glTF / GLB
Compress using tools like Draco Compression

9. Fake 3D When Possible

This is what top studios do 👇

Use videos, parallax, or layered UI instead of real 3D
Use pre-rendered animations instead of live scenes

Reality - Most 3D websites fail because
Designers over-prioritize visuals
Ignore loading time
Forget user inten