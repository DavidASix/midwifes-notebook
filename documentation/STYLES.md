**Visual Language**

Clean, clinical minimalism with warm undertones. Intentionally approachable for a healthcare context — comparable to a modern EMR designed by a consumer app team.

---

**Color**

- Background: warm off-white `#fcfbf7`
- Primary accent: deep forest green `#1a4331`
- Secondary accent: emerald `#059669` — used for active states, GBS+ indicators, badge fills
- Dark/text: near-black `#0f172a`
- Muted: slate-gray `#96a5b9` — metadata, inactive labels, secondary text
- Status badges: low-contrast fills derived from the primary/secondary palette; Out of Care rendered in muted text, no fill

---

**Typography**

- Patient names and section display text: Newsreader (serif) — last name rendered in a heavier weight, given name in regular weight, creating intra-name hierarchy without size change
- UI chrome, field labels, metadata, badges: clean sans-serif (Inter or system equivalent)
- Section headers in detail view: bold sans-serif, spaced uppercase

---

**Layout**

- List rows: adaptive vertical density based on visible supporting lines, hairline separators, no borders or elevation —
  rows are flat, not raised
- Detail view: section-grouped with labeled field pairs in a two-column grid beneath bold section headers
- Client-list content begins on a consistent text rail without repetitive avatar placeholders
- Chevron right-rail affordance on all drilldown rows

---

**Components**

- Status badges: pill-shaped, uppercase, small text, low-contrast fill
- Bottom tab bar: icon + label, active state in `#1a4331`
- Detail view tabs: underline indicator, inactive labels in `#96a5b9`
- Forms: one scrollable column of open sections directly on the page background, each with a compact tinted icon, serif
  title, and short supporting description; related short fields may share a row while long-form inputs remain full width
- Collapsible form sections: collapsed sections show only their icon, title, description, and a trailing down chevron;
  expanding switches it to an up chevron and reveals the fields below the same header
- Toasts: compact rounded cards that float above navigation and fixed actions, pairing a semantic icon with a short title
  and optional supporting message; they follow the active theme and use a restrained shadow
- Form choices: outlined segmented buttons when unset and primary-filled when selected; nullable choices reveal a subtle
  clearing hint and can be returned to the unset state by tapping the selection again
- Form controls: standard inputs and actions use a compact 44-point height; segmented choices use a denser 36-point
  visual height while disclosure headers retain a 44-point touch target
- Form actions: a persistent bottom action bar above the safe area, with equal-width secondary Cancel and primary Save
  actions
- Skeleton loaders: used wherever load time may exceed 200ms — match the geometry of the content they replace (row height, label width, badge width), colored in a `#96a5b9`-tinted pulse
- Onboarding: full-width horizontal pages with a single primary action, centered copy, and pagination dots fixed above the device's bottom safe area; the active dot is elongated and uses the primary accent

---

**Tone**

Professional but not intimidating. Designed for midwives or doulas — not hospital IT.
