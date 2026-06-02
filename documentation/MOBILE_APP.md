# Mobile App Specification

## Overview

A mobile app for midwives and doulas to manage client records, track pregnancies, and access clinical tools. All data is stored locally on-device (SQLite). No account or internet connection is required to use the app.

---

## First Launch & Onboarding

On first launch the user is taken through a multi-step onboarding flow:

1. **Feature highlights** — brief walkthrough of key app sections (Clients, Tools, Calendar, Statistics)
2. **App lock setup** — user is prompted to enable biometric/PIN lock via `expo-local-authentication`; this step is optional and can be skipped
3. **Mailing list** — user is optionally prompted to enter their email to receive app update announcements

After onboarding completes, the user lands on the **Clients** screen. On all subsequent launches (after any lock screen, if enabled), the Clients screen is the landing screen.

---

## App Lock

When enabled in Settings, the app requires the user to authenticate via their device's configured method (Face ID, Touch ID, fingerprint, or PIN/passcode) before accessing content.

- The full app UI is hidden behind a lock screen until auth succeeds

---

## Routing Architecture

The app uses Expo Router with a file-based route tree rooted at `app/_layout.tsx`.

### Lock gate

`LockProvider` wraps the entire tree. When `isLocked` is true, `RootLayoutContent` renders `LockScreen` directly — the Stack never mounts. There is no route to navigate away from; the lock screen is a React render gate, not a route. Any screen can trigger it by calling `lock()` from `useLock()`.

### Root Stack (`app/_layout.tsx`)

Once unlocked, a single `Stack` navigator is mounted. The starting screen is determined by `getInitialRouteName()` in `_layout.tsx`. Both `onboarding` and `(tabs)` have `headerShown: false`. All other screens in the stack inherit a default header with a custom back arrow.

### Tabs group (`app/(tabs)/`)

A `Tabs` navigator with four tabs: Tools, Clients, Calendar, Statistics. Each tab screen can export a `HeaderRightButton` component, which the tabs layout injects into that screen's header.

**Do not add new screens inside the `(tabs)/` group.** Any screen that needs to be navigated to — including detail views, edit forms, and settings — should be added to the root stack instead. Tabs are reserved for the four top-level sections only.

### Root stack screens

Screens at the root stack level (outside tabs) are pushed over the tab bar:

| Route | Description |
|---|---|
| `onboarding` | First-launch onboarding flow |
| `(tabs)` | The tab navigator (treated as a single stack entry) |
| `clients/[id]` | Client detail |
| `clients/new` | Add client form |
| `settings` | Settings screen |

---

## Navigation Structure

### Bottom Tab Bar

| Tab | Icon | Description |
|---|---|---|
| Tools | Toolbox | List of clinical calculators |
| Clients | Person | Client list (default landing tab) |
| Calendar | Calendar | EDD and delivery date calendar |
| Statistics | Bar chart | Aggregated client stats |

Settings are **not** in the tab bar. A gear icon is shown only on the Statistics screen, providing access to the Settings page.

### Navigation Patterns

| Pattern | Usage |
|---|---|
| Bottom tab bar | Top-level navigation between the four main screens |
| Stack push | Edit screens pushed on top of modals; Settings pushed from Statistics |
| Bottom sheet modal (full-screen) | Client detail view, tool views, calendar day detail |

---

## Screens

---

### Clients Screen

A scrollable contact-style list of all clients.

**Filter tabs** at the top of the screen (horizontal scroll):
- All Clients
- Prenatal
- Postpartum
- Out of Care

**Search** — search icon in the header opens an inline search bar to filter by name.

**Add client** — person+ icon in the header navigates to the Add Client form (pushed as a stack screen).

#### Client List Row

Each row displays:
- **Avatar** — circular; shows client photo if set, otherwise a default placeholder
- **Name** — `Last, First` format; last name in heavier serif weight, given name in regular serif weight (Newsreader)
- **Date line** — `EDD: YYYY-MM-DD` if prenatal; `DD: YYYY-MM-DD` if postpartum. If postpartum, also show **days postpartum** (e.g. `· 4 days postpartum`)
- **GBS status icon** — shield icon; filled/accented if GBS+, outline/muted if GBS−
- **G/P notation** — e.g. `G2P1`
- **Blood type** — e.g. `A+`
- **Status badge** — pill-shaped, uppercase: `PRENATAL`, `POSTPARTUM`, or `OUT OF CARE`
- **Chevron** — right-rail affordance indicating drilldown

Status is derived at query time (not stored):

| Condition | Status |
|---|---|
| `is_active = 0` | Out of Care |
| `is_active = 1` AND `actual_delivery_date IS NULL` | Prenatal |
| `is_active = 1` AND `actual_delivery_date IS NOT NULL` | Postpartum |

---

### Client Detail (Bottom Sheet Modal)

Tapping a client row opens a full-height bottom sheet modal (drag handle at top). The background content (client list) is visible but dimmed behind it.

**Header:** client full name, `EDIT` on the right.

**Three tabs:**

#### Tab 1 — Client

Grouped sections with labeled field pairs in a two-column grid. Should include all client details from the `clients` table, and some derived fields yet to come. Here are the sections in the scrollable area:

**Identity**

**Clinical Stats**

**Partner Details**

**Status**
- Active toggle (active = in care; inactive = Out of Care)

#### Tab 2 — Children

A list of the client's babies. Each baby entry shows all details from the babies table, some with multiple format variants (brith weight in both grams and pounds/ounces, for example)
An **Add Baby** button at the bottom opens a form to create a new baby entry for this client.

Each baby row is tappable to view/edit full baby details.

#### Tab 3 — Notes

A general-purpose scratchpad for the client. Notes are stored as individual entries (title, content, date) in the `notes` table.

The tab shows a chronological list of notes. Tapping a note opens it for viewing/editing. A **New Note** button creates a new entry.

---

### Client Edit Screen

Pushed as a stack screen on top of the Client Detail modal when `EDIT` is tapped.

- Full scrollable form with all editable client fields
- Photo field: tap to choose from library or take a new photo (`expo-image-picker`)
- Save button commits changes and pops back to the detail modal
- Cancel discards changes and pops back

Same form is used for **Add Client** (reached from the client list header), with all fields empty.

---

### Tools Screen

A scrollable list of clinical calculator tools. Each tool row opens in a **bottom sheet modal**.

#### Tool: LMP / GA / EDD Calculator

Calculates any one value from any other single input. All three values are displayed together once a calculation is made.

| Input | Derivation |
|---|---|
| LMP (Last Menstrual Period) | EDD = LMP + 280 days; GA = today − LMP |
| Gestational Age | LMP = today − GA; EDD = LMP + 280 days |
| EDD (Estimated Due Date) | LMP = EDD − 280 days; GA = today − LMP |

Display format for GA: `X weeks, Y days`.

Additional tools may be added here over time. Each tool is a self-contained modal.

---

### Calendar Screen

A full-screen, vertically scrolling calendar. Scrolling is continuous — no month pagination.

- **Always opens at today's date**
- Each day cell shows event indicators for:
  - Upcoming EDDs (prenatal clients)
  - Past delivery dates (postpartum clients)
- Tapping a date opens a **modal** listing all events on that day, with each event linking to the relevant client's detail sheet

---

### Statistics Screen

Displays aggregated, read-only stats derived from the local SQLite database. Intended to be informative and a little fun for the midwife.

Examples of stats (exact set to be defined):
- Total clients seen
- Total babies delivered
- Most recent delivery
- Oldest child on record
- Breakdown by delivery method (SVD / AVD / C-Section)
- Breakdown by feeding type
- GBS+ rate

A **gear icon** in the Statistics screen header links to the Settings page.

---

### Settings Screen

Pushed as a stack screen from the Statistics screen gear icon.

| Setting | Description |
|---|---|
| App Lock | Toggle biometric/PIN lock on/off |
| Accent Color | Color picker to select the app's primary accent color |
| Theme | Light / Dark mode toggle |
| Mailing List | Enter or update email address for app update notifications |
| Onboarding | Button to re-view the onboarding flow |

---

## Data Model Summary

See `SCHEMA.md` for the full SQL schema. 

---

## Design Reference

See `STYLES.md` for the full visual spec.