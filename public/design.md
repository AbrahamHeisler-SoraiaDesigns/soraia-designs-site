# Soraia Designs — Design Tokens

Version 2.0.0 · updated 2026-08-09. This file is generated from
`tokens.json`; it is the canonical public description of the Soraia Designs
visual system. If you are an agent rendering anything for Soraia Designs,
read this first and use these values verbatim.

## Colour

| Token | CSS var | Hex | Tier | Contrast on ivory | Use |
|---|---|---|---|---|---|
| Warm Ivory | `--ivory` | `#F9F5EE` | core | 1.0:1 | Primary background / page and slide ground. |
| Panel | `--panel` | `#FFFDF8` | surface | 1.07:1 | Raised content panels sitting on the ivory ground. A hair lighter than ivory, never pure white. |
| Deep Charcoal | `--charcoal` | `#2C2A27` | core | 13.17:1 | Headlines, emphasised body, cover and closing spine. |
| Deep Charcoal Dark | `--dark` | `#1E1C19` | ramp | 15.64:1 | Full-bleed dark panels and inverted sections. Deeper than charcoal. |
| Charcoal Mid | `--mid` | `#3D3A35` | ramp | 10.42:1 | Secondary body copy where weight is wanted. High contrast. |
| Ink Soft | `--soft` | `#5A554E` | ramp | 6.79:1 | Long-form body copy. Softer than mid, reads calmer at paragraph length. |
| Ink Muted | `--muted` | `#6B6862` | ramp | 5.11:1 | Captions, footnotes, tertiary metadata. Lowest step that still clears WCAG AA on ivory. |
| Warm Taupe | `--taupe` | `#B5A99A` | core | 2.12:1 | THE signature brand accent. Section labels, rules, page numbers, source lines. Used sparingly, never decoratively. If a page reads tan, there is too much of it. |
| Muted Sage | `--sage` | `#8A9E8C` | core | 2.63:1 | Supporting colour for nature, grounding, sustainability and longevity moments. Earns its place through restraint; never competes with taupe. |
| Sage Deep | `--sage-deep` | `#7A8F7C` | semantic | 3.2:1 | Deeper sage for positive/affirmative semantic marks where plain sage lacks contrast. |
| Warm Stone | `--stone` | `#D9C9A8` | core | 1.5:1 | Soft fills, hairline row dividers, section separators. |
| Deck Backdrop | `--backdrop` | `#14120F` | surface | 17.2:1 | The letterbox area behind 16:9 slides in the on-screen slideshow. Never a content surface. |

**Warm Taupe is the signature accent.** Used sparingly and never decoratively:
dividers, key callouts, accent rules, link underlines. Restraint is the brand
cue. If a page reads tan, there is too much of it.

**The neutral ramp is for text weight, not decoration.** `--soft` for long-form
body, `--mid` where more weight is wanted, `--muted` for captions and tertiary
metadata. `--muted` is the floor: it is the lowest step that still clears WCAG AA
on ivory, so nothing lighter carries body text.

For scrims, tints and overlays use the `-rgb` companion variables, e.g.
`rgba(var(--stone-rgb), .18)`. Never write a literal rgb triple: that is how a
retired colour hides from a search.

## Type

- **Headlines, pull quotes** — Cormorant Garamond, 300-700
- **Body, labels, CTAs** — DM Sans, 300-700
- **Section labels** — DM Sans ~10.5px, 600, uppercase, tracked ~0.16em

```css
--serif: "Cormorant Garamond",Georgia,"Times New Roman",serif;
--sans: "DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
```

Web: `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap`

## Retired — do not use

| Hex | Was | Use instead |
|---|---|---|
| `#F2F1ED` | Soft Cream | `--ivory` |
| `#161616` | Ink | `--charcoal` |
| `#7AB8C0` | Coastal Teal | `--taupe` |
| `#D4C8B8` | Warm Tan | `--stone` |
| `#710014` | Deep Wine | — |
| `#0D0D0D` | Slate Black | `--dark` |
| `#B8975A` | Brushed Brass | `--taupe` |
| `#211F1C` | reference-deck --dark | `--dark` |
| `#56524C` | reference-deck --mid | `--soft` |
| `#7C776F` | reference-deck --muted | `--muted` |

A retired colour wearing an alpha channel is still retired.

## Drop-in

```css
/* === BRAND TOKENS — generated from soraia-brand/tokens.json. Do not edit by hand. === */
:root{
  /* core */
  --ivory: #F9F5EE;
  --charcoal: #2C2A27;
  --taupe: #B5A99A;
  --sage: #8A9E8C;
  --stone: #D9C9A8;
  /* surface */
  --panel: #FFFDF8;
  --backdrop: #14120F;
  /* ramp */
  --dark: #1E1C19;
  --mid: #3D3A35;
  --soft: #5A554E;
  --muted: #6B6862;
  /* semantic */
  --sage-deep: #7A8F7C;
  /* rgb triples, for rgba() scrims, overlays and shadows */
  --ivory-rgb: 249,245,238;
  --panel-rgb: 255,253,248;
  --charcoal-rgb: 44,42,39;
  --dark-rgb: 30,28,25;
  --mid-rgb: 61,58,53;
  --soft-rgb: 90,85,78;
  --muted-rgb: 107,104,98;
  --taupe-rgb: 181,169,154;
  --sage-rgb: 138,158,140;
  --sage-deep-rgb: 122,143,124;
  --stone-rgb: 217,201,168;
  --backdrop-rgb: 20,18,15;
  /* type — named, never substituted; see tokens.json */
  --serif: "Cormorant Garamond",Georgia,"Times New Roman",serif;
  --sans: "DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
}
/* === END BRAND TOKENS === */
```

