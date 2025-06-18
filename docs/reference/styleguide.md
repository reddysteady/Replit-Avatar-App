# Avatar App Style Guide

## 1. Brand Personality
- Clean, modern, minimal
- Greyscale base (whites, greys, blacks)
- Accent colors: Used sparingly for calls to action, status, or intent indication
- Accessible: Ensure high contrast for readability

## 2. Color Palette

| Usage           | Description                  | Hex Code  |
|-----------------|-----------------------------|-----------|
| Background      | White                       | #FFFFFF   |
| Primary Text    | Charcoal                    | #222222   |
| Secondary Text  | Mid-Grey                    | #666666   |
| Borders         | Light Grey                  | #E5E7EB   |
| Cards / UI      | Soft Grey                   | #F7F7F8   |
| Accent 1        | Vibrant Orange (Intent)     | #FF7300   |
| Accent 2        | Electric Blue (CTA)         | #3A8DFF   |
| Error           | Red                         | #FF4545   |
| Success         | Emerald                     | #36D399   |
| Disabled        | Pale Grey                   | #F3F4F6   |

## 3. Typography

| Element         | Font Family        | Weight | Size   |
|-----------------|-------------------|--------|--------|
| App Title       | Inter, sans-serif | 700    | 32px   |
| Section Heading | Inter, sans-serif | 600    | 20px   |
| Body Text       | Inter, sans-serif | 400-500| 16px   |
| Labels / Chips  | Inter, sans-serif | 500    | 14px   |
| Button          | Inter, sans-serif | 600    | 16px   |

- Line height: 1.5 for body, 1.25 for headings

## 4. UI Components

### Buttons
- Primary: White text on accent background (e.g. orange or blue)
- Border-radius: 2xl
- Padding: 0.75em 2em
- Shadow: Soft
- Disabled: Greyed out (#F3F4F6), text mid-grey

### Cards / Containers
- Background: #F7F7F8
- Shadow: 0 2px 8px rgba(0,0,0,0.03)
- Radius: 16px (2xl)
- Padding: 24px

### Menus & Drawers
- Menu bg: White
- Item hover: #F3F4F6
- Section dividers: Light grey

### Chips / Pills
- Greyscale base, popping color border for intent
- Radius: Full (pill)
- Padding: 0.25em 1em

### Icons
- Greyscale default
- Accent for status (intent = orange)
- Size: 20–24px

## 5. Interaction States

- Focus: Blue or orange outline shadow
- Active: Slightly darker bg
- Hover: Subtle bg or underline

## 6. Special Cases

### High Intent Indicator
- User profile border turns orange (#FF7300)
- Optional: Small orange dot or ring overlay

### Escalation/Alert
- Border or icon in red (#FF4545), never for intent

## 7. Spacing

- Grid: 8px base spacing (multiples)
- Card/Page padding: 24–32px
- Between elements: 8–16px

## 8. Sample Usage (Tailwind Example)

```jsx
<Button className="bg-[#FF7300] text-white rounded-2xl px-8 py-3 shadow-sm hover:bg-[#FF5400]">
  Send
</Button>

<div className="bg-[#F7F7F8] rounded-2xl p-6 shadow">
  {/* Card content */}
</div>

<span className="inline-flex items-center rounded-full border-2 border-[#FF7300] px-4 py-1 text-[#FF7300] font-semibold">
  High Intent
</span>

## 9. Assets
- Font: Inter (Google Fonts)
- Icons: Lucide or Heroicons