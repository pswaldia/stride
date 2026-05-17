# Stride — Design System: Chalk & Ember

---

## Philosophy
Editorial, analogue feel. Off-white paper surfaces with deep ember red accents.
Closest analogy: a well-designed running journal meets a fintech dashboard.
Furthest thing from Strava orange or generic dark-mode fitness apps.

---

## Colour tokens

### Light mode (default)
```css
--bg: #FAF9F6;           /* page background — off-white paper */
--surface: #F0EDE6;      /* card / sidebar background */
--surface2: #E8E4DB;     /* deeper surface — inputs, mini-map, code blocks */
--border: #DDD9D0;       /* default border — 0.5px */
--border2: #C8C3B8;      /* emphasis border — hover, focus rings */
--text: #1A1A1A;         /* primary text */
--text2: #6B6560;        /* secondary text — labels, descriptions */
--text3: #A09890;        /* muted text — hints, placeholders, timestamps */
--accent: #C0392B;       /* ember red — CTAs, active nav, chart highlights */
--accent2: #E74C3C;      /* lighter ember — hover states */
--accent-bg: #C0392B12;  /* accent tint — AI card bg, active badge bg */
--accent-border: #C0392B30; /* accent border — AI card, selected day */
```

### Dark mode (`data-theme="dark"` on `<html>`)
```css
--bg: #1A120E;           /* warm near-black */
--surface: #251810;      /* warm dark surface */
--surface2: #2E1E14;     /* deeper warm dark */
--border: #3A2418;       /* dark border */
--border2: #4A3020;      /* emphasis dark border */
--text: #F5EDE6;         /* warm off-white text */
--text2: #A08070;        /* warm mid text */
--text3: #604030;        /* warm muted text */
--accent: #E74C3C;       /* brighter ember in dark mode */
--accent2: #FF6B5B;      /* hover state */
--accent-bg: #E74C3C12;
--accent-border: #E74C3C30;
```

### Run type colours (consistent across light and dark)
```css
--easy: #2E7D32;         /* forest green */
--easy-bg: #2E7D3215;
--tempo: #B45309;        /* burnt amber */
--tempo-bg: #B4530915;
--long: #C0392B;         /* ember red (same as accent) */
--long-bg: #C0392B15;
--race: #7C3AED;         /* violet */
--race-bg: #7C3AED15;
```

### Semantic colours (training load)
```css
--ctl-color: #185FA5;    /* blue — fitness/CTL bars */
--atl-color: #B45309;    /* amber — fatigue/ATL bars */
--tsb-color: #2E7D32;    /* green — form/TSB bars */
```

---

## Typography

### Font families
```css
--font-outfit: 'Outfit', system-ui, sans-serif;
--font-jakarta: 'Plus Jakarta Sans', system-ui, sans-serif;
```

Load in `app/layout.tsx`:
```tsx
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500'],
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500'],
})
```

### Usage rules
| Element | Font | Size | Weight |
|---|---|---|---|
| Logo text | Outfit | 15px | 500 |
| Screen headings (h1) | Outfit | 18–20px | 500 |
| Card titles | Outfit | 13–14px | 500 |
| Stat values (numbers) | Outfit | 20–26px | 500 |
| Nav items | Plus Jakarta Sans | 12–13px | 400 |
| Body text | Plus Jakarta Sans | 13–14px | 400 |
| Labels / hints | Plus Jakarta Sans | 10–12px | 400 |
| Badges | Plus Jakarta Sans | 10–11px | 400 |

**Two weights only: 400 (regular) and 500 (medium).** Never 600 or 700.

---

## Spacing
```
4px   — micro gaps (dot to text, icon to label)
8px   — tight gaps (within a stat card)
10–12px — standard component gaps
16px  — card padding
20–24px — section gaps
28px  — page padding
```

---

## Border radius
```
5–6px  — small elements (buttons, day cells, chips)
7–8px  — standard (nav items, inputs, small cards)
10px   — cards, panels
50%    — avatars, dots
```

---

## Components

### Stat card
```tsx
<div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
  <div className="text-[var(--text3)] text-[11px] mb-2 flex items-center gap-1">
    <i className="ti ti-road text-[13px]" />
    This week
  </div>
  <div className="text-[var(--text)] text-[22px] font-medium font-outfit tracking-tight">
    42.6<span className="text-[var(--text3)] text-[12px] font-normal"> km</span>
  </div>
  <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full mt-1.5 bg-[var(--easy-bg)] text-[var(--easy)]">
    ↑ +8% vs last week
  </div>
</div>
```

### Card
```tsx
<div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
  <div className="flex items-center justify-between mb-3.5">
    <span className="text-[13px] font-medium text-[var(--text)] font-outfit">
      Card title
    </span>
    <span className="text-[11px] text-[var(--accent)] cursor-pointer">
      Action ›
    </span>
  </div>
  {/* content */}
</div>
```

### Nav item
```tsx
// Active
<div className="flex items-center gap-2 px-2.5 py-2 rounded-[7px] text-[12px]
  bg-[var(--accent-bg)] text-[var(--accent)] cursor-pointer">
  <i className="ti ti-layout-dashboard text-[16px]" />
  Dashboard
</div>

// Inactive
<div className="flex items-center gap-2 px-2.5 py-2 rounded-[7px] text-[12px]
  text-[var(--text3)] cursor-pointer hover:bg-[var(--surface2)] hover:text-[var(--text2)]
  transition-colors">
  <i className="ti ti-map text-[16px]" />
  Map & hotspots
</div>
```

### Badge / pill
```tsx
// Run type badge
<span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--long-bg)] text-[var(--long)]">
  Long
</span>

// Trend badge — positive
<span className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5
  rounded-full bg-[var(--easy-bg)] text-[var(--easy)]">
  ↑ +8%
</span>
```

### AI insight card
```tsx
<div className="bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-[10px] p-4">
  <div className="flex items-center gap-2 mb-2.5">
    <div className="w-[26px] h-[26px] bg-[var(--accent)] rounded-[6px]
      flex items-center justify-center text-[#FAF9F6] text-[13px]">
      <i className="ti ti-robot" />
    </div>
    <span className="text-[13px] font-medium font-outfit text-[var(--accent)]">
      AI coach insight
    </span>
  </div>
  <p className="text-[12px] text-[var(--text2)] leading-[1.65]">
    {insight}
  </p>
  <button className="mt-2.5 text-[12px] text-[var(--accent)] flex items-center gap-1">
    Full analysis <i className="ti ti-arrow-right text-[12px]" />
  </button>
</div>
```

### Calendar day cell
```tsx
// Has run
<div className="aspect-square rounded-[6px] flex flex-col items-center justify-center
  cursor-pointer border border-transparent hover:bg-[var(--surface2)]
  has-run:border-transparent selected:bg-[var(--accent-bg)]
  selected:border-[var(--accent-border)] today:border-[var(--accent)]">
  <span className="text-[11px] text-[var(--text)]">14</span>
  <div className="w-1 h-1 rounded-full mt-0.5 bg-[var(--long)]" />
</div>
```

---

## Icons
Use Tabler Icons outline only — loaded via CDN or `@tabler/icons-react`.

Common icons used in Stride:
```
ti-layout-dashboard  — Dashboard nav
ti-map               — Map nav
ti-chart-line        — Training load nav
ti-robot             — AI insights nav
ti-trophy            — Race predictor nav
ti-settings          — Settings nav
ti-run               — Logo
ti-road              — Distance stat
ti-clock             — Pace stat
ti-heart-rate-monitor — HR stat
ti-mountain          — Elevation stat
ti-cloud             — Weather
ti-trending-up       — Positive trend badge
ti-trending-down     — Negative trend badge
ti-chevron-left/right — Calendar navigation
ti-arrow-right       — CTA link
ti-sun / ti-moon     — Theme toggle
```

---

## Responsive breakpoints
```
< 640px   — mobile: sidebar hidden, bottom tab bar shown, single column
640–1024px — tablet: sidebar shown narrow, content collapses
> 1024px  — desktop: full two-column layout
```

### Mobile bottom tab bar
Replace sidebar with:
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)]
  border-t border-[var(--border)] flex justify-around py-2
  md:hidden">
  {/* 5 nav items with icon + label */}
</nav>
```

---

## Dark mode implementation
```tsx
// In layout.tsx — read system preference, store in localStorage
useEffect(() => {
  const stored = localStorage.getItem('stride-theme')
  const system = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = stored ? stored === 'dark' : system
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}, [])
```

```css
/* In globals.css */
:root { /* light mode vars */ }
[data-theme="dark"] { /* dark mode vars */ }
```
