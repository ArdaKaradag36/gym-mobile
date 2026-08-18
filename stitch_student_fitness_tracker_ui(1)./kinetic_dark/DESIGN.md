---
name: Kinetic Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c9ac'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9379'
  outline-variant: '#444933'
  surface-tint: '#abd600'
  primary: '#ffffff'
  on-primary: '#283500'
  primary-container: '#c3f400'
  on-primary-container: '#556d00'
  inverse-primary: '#506600'
  secondary: '#adc6ff'
  on-secondary: '#002e69'
  secondary-container: '#4b8eff'
  on-secondary-container: '#00285c'
  tertiary: '#ffffff'
  on-tertiary: '#313030'
  tertiary-container: '#e5e2e1'
  on-tertiary-container: '#656464'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3f400'
  primary-fixed-dim: '#abd600'
  on-primary-fixed: '#161e00'
  on-primary-fixed-variant: '#3c4d00'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -1px
  headline-lg:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  margin-page: 20px
  gutter-card: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for a high-performance, premium fitness environment. It targets a modern student demographic that values efficiency, motivation, and "Dribbble-esque" aesthetics. 

The style is **Modern Minimalism with a Tech-Infusion**. It utilizes a deep-dark color space to reduce eye strain during late-night or early-morning workouts. High-fidelity visuals are achieved through hyper-clean layouts, significant negative space, and strategic use of vibrant "energy" accents. The interface should feel like a high-end digital dashboard: precise, responsive, and motivating.

## Colors

The palette is built on a "Void and Glow" philosophy. 

- **Primary (Neon Green):** Reserved for the most important calls to action and progress indicators. It represents energy and completion.
- **Secondary (Electric Blue):** Used for informational accents, links, and secondary interactive states (e.g., toggles or active tab states).
- **Surface (Deep Charcoal):** `#1A1A1A` is used for cards and containers to create a subtle separation from the true black background.
- **Background (Pure Black):** `#0A0A0A` serves as the primary canvas to ensure maximum contrast and OLED efficiency.
- **Status Colors:** Use a muted red for errors and a deep amber for warnings, ensuring they do not compete with the neon green primary.

## Typography

This design system uses a dual-font strategy to balance character with legibility.

- **Headlines:** Montserrat provides a bold, geometric, and aggressive feel suitable for fitness goals and achievement titles. Use tight letter-spacing on larger displays.
- **Body & Data:** Inter is used for all functional text, data points, and labels. Its high x-height ensures clarity when reading workout metrics mid-exercise.
- **Hierarchy:** Maintain a clear distinction between "Reading" text (Inter Regular) and "Action" text (Inter Semi-Bold or Bold). Use uppercase only for labels and small category headers to improve scanning.

## Layout & Spacing

The layout follows a strict 4px grid system. 

- **Page Margins:** A generous 20px margin on mobile prevents content from feeling cramped.
- **Fluidity:** Cards and interactive elements should span the full width minus margins, or be arranged in a 2-column masonry grid for smaller metric tiles.
- **Vertical Rhythm:** Use 24px (stack-lg) to separate major sections (e.g., "Daily Goals" from "Recent Workouts") and 16px (stack-md) for internal card padding.
- **Safe Areas:** Ensure bottom navigation and primary action buttons respect the device's home indicator safe area.

## Elevation & Depth

In this dark-mode system, depth is communicated through **Luminance and Outlines** rather than heavy shadows.

- **Z-0 (Background):** Pure Black `#0A0A0A`.
- **Z-1 (Cards/Surfaces):** Deep Charcoal `#1A1A1A`. 
- **Borders:** All cards and buttons utilize a 1px solid border. For inactive cards, use `#2A2A2A`. For active or "special" cards, use a subtle 10% opacity version of the Primary Neon Green.
- **Glassmorphism:** Use a `backdrop-filter: blur(20px)` with a 60% opaque charcoal for sticky headers and the bottom navigation bar to maintain a sense of space.

## Shapes

The shape language is "Squircle-inspired" and friendly yet structured.

- **Standard Radius:** 16px (`rounded-lg` / value 2) for all primary cards, workout tiles, and modals.
- **Button Radius:** 12px for primary buttons to create a slightly sharper, more "precise" feel than the containers.
- **Pills:** Use full rounded corners (999px) for status tags (e.g., "Completed", "In Progress") and secondary filter chips.

## Components

- **Primary Buttons:** High-contrast Neon Green background with Black text. No shadows; use a subtle "glow" (outer stroke) on hover/tap.
- **Workout Cards:** Large-format tiles. Use a background of `#1A1A1A`. Top-left for the title (Montserrat Bold), bottom-right for the metric (Inter Bold + Blue accent).
- **Tab Navigation:** Sleek, blur-background bar at the bottom. Active states indicated by a Neon Green dot or a subtle vertical line above the icon. Use minimalist line icons.
- **Input Fields:** Darker than the card background, with a 1px border that glows Electric Blue when focused.
- **Progress Rings:** Use thin, high-contrast strokes. Neon Green for the progress, Deep Gray for the remaining track.
- **Data Graphs:** Clean line charts using the Secondary Blue. Area fills should be a very low-opacity gradient of the same blue.