# MultiCoder — design direction

This file records the identity that ships in `resources/app/dist`. It is a
description, not a proposal: every value below is read from
`renderer/assets/zen-themes.js`, `renderer/assets/oc-shell.css` and
`renderer/assets/chat-workbench.js`. New surfaces must reuse these tokens instead
of inventing a second visual language.

## 1. Identity — "Instrument"

One drawing instrument in three materials: graphite, ledger paper and drafting
paper. The product helps someone lay out a build, so the chrome behaves like a
measuring tool: hairline rules, a filled block where the cursor would be, tabular
numbers, nothing that glows. Ink is the only accent; it is the surface, not a
brand hue. The mark is a registration/viewfinder square, not a brush circle.

- **Voice of the surface:** flat, precise, low-colour. Structure comes from rules
  and alignment, never from shadow depth or blur.
- **Dials:** ENERGY 3 (still, one accent), RHYTHM 3 (8px grid, two panel widths),
  MOTION 1 (state transitions only, no entrance choreography).
- **One deliberate accent:** a filled `--accent` block marks the active rail
  button, the active tab underline, the primary button and the caret. Nothing
  else is filled ink.

## 2. Palette

Three materials. Each theme defines the same role set; `--accent` is ink, so a
filled control is the strongest mark on the screen and never a coloured one.

| id | name | mode | material | bg | panel | accent | accent-ink |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `graphite` | Grafit | dark (default) | graphite and silver | `#0e0f10` | `#16181a` | `#e9e6de` | `#0e0f10` |
| `ledger` | Defter | light | paper and ink | `#f5f3ec` | `#eeeae0` | `#1a1814` | `#f5f3ec` |
| `blueprint` | Aydınger | light | drafting paper | `#f0f3f6` | `#e6ebf0` | `#0f151b` | `#f0f3f6` |

Role tokens (the only names new work may use): `--bg`, `--bg-elevated`,
`--panel`, `--panel-alt`, `--panel-hover`, `--border`, `--border-strong`,
`--text`, `--muted`, `--accent`, `--accent-ink`, `--accent-soft`, `--cyan`,
`--ok`, `--warn`, `--error`, `--error-soft`, `--selection`, `--backdrop`,
`--shadow`, `--radius`, `--radius-lg`, plus the editor and syntax sets.

Rules that follow from this palette:

- **One accent, and it is ink.** There is no brand hue. Green, amber and red exist
  only as `--ok`, `--warn`, `--error` on status text and toggles.
- **Neutrals carry hierarchy.** Depth is panel → panel-alt → panel-hover, then a
  hairline. No shadow stacks.
- **Elevation is printed, not floating.** `--shadow` is a crisp offset block
  (`4px 4px 0`), used only by dialogs, popovers and the palette. Nothing else on
  the screen has a shadow.
- **Body text is never dimmed.** Nothing carries `opacity` below 1; hierarchy is
  a token, not a multiplier. Every `--muted` value holds at least 4.5:1 against
  `bg`, `panel`, `panel-alt` and `panel-hover` (measured minimum 4.60).

## 3. Typography

Three roles: `--display-font` (greeting, dialog and card titles), `--ui-font`
(everything else in the chrome) and `--mono-font` (code, paths, keys, data).
All presets resolve to system fonts — no webfont is loaded, so first paint never
waits on the network.

| id | name | display | ui | tracking |
| --- | --- | --- | --- | --- |
| `instrument` (default) | Ölçü | Sitka Banner | Segoe UI Variable Text | 0 |
| `drawing` | Çizim | Bahnschrift | Bahnschrift | .01em |
| `book` | Kitap | Constantia | Candara | .002em |

Display type is serif or humanist on purpose: monospace is reserved for code,
paths, keys and numeric readouts, never for a headline.

Five sizes and one display step, declared once in `:root`:
`--oc-text-1` 11px (meta, hints, labels), `--oc-text-2` 12px (secondary UI),
`--oc-text-3` 13px (body, transcript), `--oc-text-4` 15px (section titles),
`--oc-text-5` 18px (dialog and page titles), and
`--oc-text-display: clamp(22px, 2.8vw, 30px)` for the greeting only. Labels are
sentence case at 11px; uppercase survives only for code-like keys such as a
fenced block's language, and tracking never exceeds 0.04em.

## 4. Layout and shape

- Content column `--oc-max: 880px`; transcript and composer share it.
- Editor pane `clamp(420px, 46vw, 760px)`; the chat dock and the editor split the
  window, neither is a modal.
- Header `40px`. **Two radii for the whole product**: `--radius: 2px` for
  controls and rows, `--radius-lg: 4px` for cards, dialogs and popovers. The shell
  aliases both as `--oc-r: 3px`. Pills (`999px`) exist only on real pill shapes
  such as status badges; nothing else is rounded past 4px.
- Nothing is centred for its own sake: the greeting sits on a left margin, card
  text aligns left, and only list empty-states centre.
- The greeting carries one readout row, the folder the next task runs in, as a
  `dl`: an 11px `--muted` key in a 78px column, a mono `tabular-nums` value in
  `--text`, one short hairline above. It is the only place the greeting states a
  fact; model and provider live in the dock that owns them, where the user acts
  on them. An empty folder says so in words ("açık değil"), not with a dash or a
  hidden row.
- Focus is a 1px ring in `--accent` (`--oc-ring`) plus the 2px outline on native
  controls, never a colour change alone.
- One z-index ladder, declared in `:root`: canvas 10, canvas-top 20, shell 30,
  scrim 40, drawer 50, overlay 60, dialog 70, popover 80, sheet 90, toast 100,
  and 110 for the React app dialogs, which sit above the shell and never under it.

## 5. Motion

Motion reports state and stops. Transitions are 120–180ms on background, colour
and border; a theme change cross-fades the token set once. The only loop allowed
is the 1s spinner next to a running agent — one spinner, no pulsing core, no
second bar animation. There is no entrance choreography (no staggered fade-up),
no blur-in, no glow, no parallax. `prefers-reduced-motion: reduce` removes every
animation and collapses the greeting transition to 1ms.

## 6. What this direction refuses

- Metrics, testimonials, rating stars, "trusted by" rows and invented usage counts.
- A hero gradient, an orb, glass on more than one surface, or a pill radius on
  every control.
- A second colour language for "AI" (iridescent, neon, blue-purple). The agent's
  output uses `--text` and `--muted` like any other content.
- Marketing voice inside the product. Every string is a label or an instruction.

## 7. Where new work must hook in

1. Add colours only as theme tokens in `zen-themes.js`, for all three materials.
2. Add typography only as a `TYPE_PRESETS` entry; never a one-off font-family.
3. Use `--oc-*` aliases inside the shell, never raw hex — a `var()` fallback must
   match the `graphite` value, never a legacy palette.
4. Reuse `--radius`, `--radius-lg`, `--shadow`, `--oc-ring`; do not introduce new
   px values.
5. New user-visible strings go through the `STRINGS` table so `tr` and `en` stay
   in step, and `document.documentElement.lang` must follow the active language.
