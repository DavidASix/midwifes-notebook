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

- List rows: generous vertical padding, hairline separators, no borders or elevation — rows are flat, not raised
- Detail view: section-grouped with labeled field pairs in a two-column grid beneath bold section headers
- Consistent left-rail avatar column in list view
- Chevron right-rail affordance on all drilldown rows

---

**Components**

- Status badges: pill-shaped, uppercase, small text, low-contrast fill
- Bottom tab bar: icon + label, active state in `#1a4331`
- Detail view tabs: underline indicator, inactive labels in `#96a5b9`
- Skeleton loaders: used wherever load time may exceed 200ms — match the geometry of the content they replace (row height, label width, badge width), colored in a `#96a5b9`-tinted pulse

---

**Tone**

Professional but not intimidating. Designed for midwives or doulas — not hospital IT.