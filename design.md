# Snip Design System

Borrowed visual language from lovable.dev — dark, minimal, warm-glow aesthetic.
No logos, names, or marketing copy from that brand are used.

---

## Color Tokens

| Token              | Value       | Usage                                      |
|--------------------|-------------|--------------------------------------------|
| `--bg`             | `#0a0a0f`   | Page background                            |
| `--surface`        | `#13131a`   | Card / form surface                        |
| `--surface-raised` | `#1c1c26`   | Input background, table rows on hover      |
| `--border`         | `#2a2a38`   | Subtle borders                             |
| `--text`           | `#f0f0f5`   | Primary text                               |
| `--muted`          | `#7a7a9a`   | Subheadings, placeholder, secondary labels |
| `--accent-start`   | `#ff6b6b`   | Gradient start (coral)                     |
| `--accent-mid`     | `#ff8c42`   | Gradient mid (orange)                      |
| `--accent-end`     | `#ffd166`   | Gradient end (warm yellow)                 |
| `--success-bg`     | `#0d2818`   | Success notice background                  |
| `--success-border` | `#1a5c35`   | Success notice border                      |
| `--error-text`     | `#ff6b6b`   | Inline error messages                      |

## Accent Gradient

```css
background: linear-gradient(135deg, #ff6b6b 0%, #ff8c42 50%, #ffd166 100%);
```

Used for: hero glow overlay, primary button, short-link highlight.

---

## Hero Glow

A **fixed, full-width** translucent band at the very top of the viewport.
Must NOT be clipped inside the content column.

```css
position: fixed;
top: 0; left: 0; right: 0;
height: 380px;
background: radial-gradient(ellipse 80% 60% at 50% -10%,
  rgba(255, 107, 107, 0.28) 0%,
  rgba(255, 140, 66, 0.18) 40%,
  transparent 70%);
pointer-events: none;
z-index: 0;
```

---

## Typography

| Role        | Value                                        |
|-------------|----------------------------------------------|
| Font stack  | `'Inter', system-ui, -apple-system, sans-serif` |
| Hero h1     | `3rem`, weight 800, letter-spacing `-0.03em` |
| Subtitle    | `1.1rem`, weight 400, color `--muted`        |
| Section h2  | `1.1rem`, weight 600, color `--muted`, uppercase, letter-spacing `0.08em` |
| Body        | `0.95rem`, line-height `1.6`                 |
| Small/label | `0.8rem`, color `--muted`                    |

---

## Spacing

| Token   | Value  |
|---------|--------|
| `--s1`  | `0.5rem`  |
| `--s2`  | `1rem`    |
| `--s3`  | `1.5rem`  |
| `--s4`  | `2rem`    |
| `--s6`  | `3rem`    |
| `--s8`  | `4rem`    |

---

## Border Radii

| Role           | Value      |
|----------------|------------|
| Pill (input)   | `9999px`   |
| Card / surface | `16px`     |
| Small element  | `8px`      |

---

## Shadows & Glow

```css
/* Card */
box-shadow: 0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px var(--border);

/* Input focus ring */
box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.25);

/* Button glow */
box-shadow: 0 4px 20px rgba(255, 107, 107, 0.35);
```

---

## Element Mapping

| Snip element          | Design role                                                        |
|-----------------------|--------------------------------------------------------------------|
| `<h1>Snip</h1>`       | Hero headline — large, bold, centered, above the glow             |
| `.subtitle`           | Hero subline — muted, centered                                     |
| `.shorten-form`       | Chat-style pill input — the absolute centerpiece of the hero area |
| `.result`             | Success notice — subtle green-tinted card                          |
| `.error`              | Inline error — coral text, no box needed                           |
| `<table>` / `<h2>`    | "All links" section — surface card, generously rounded             |
| `<tr>` rows           | Surface-raised on hover                                            |
