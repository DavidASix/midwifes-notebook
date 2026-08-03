# Conventions

Coding conventions for this repository. Applies across all packages and apps unless a section specifies otherwise.

---

## File naming

- **Components and screens** — PascalCase: `ClientList.tsx`, `Button.tsx`
- **Hooks** — camelCase matching the export: `useAppFonts.ts`
- **Lib and util files** — kebab-case: `make-styles.ts`, `theme-context.tsx`

---

## UI primitives

Before reaching for a React Native primitive (`Pressable`, `Text`, `View`, etc.) or building a styled element from scratch, check `src/components/ui/` for an existing component that covers the use case. Always use those over rolling a new one:

- Use `<Button>` from `@/components/ui/Button` for any tappable button — do not use a raw `Pressable` with inline styles.
- Use `<Text>` from `@/components/ui/Text` instead of the React Native `Text` primitive.
- Use the form primitives in `src/components/ui/` (`FormTextField`, `FormDateField`, and `FormChoiceGroup`) instead of
  defining styled inputs inside a screen or feature component.
- For any other element, check `src/components/ui/` first before writing a new styled primitive.

---

## Component props

If a component has three or fewer props, declare their types inline rather than in a separate `Props` type:

```tsx
// ✓ inline — three or fewer props
function Avatar({ name, size = 40 }: { name: string; size?: number }) { ... }

// ✓ named type — more than three props, or needs to be exported
export type AvatarProps = { ... };
function Avatar({ ... }: AvatarProps) { ... }
```

Create a named `Props` type (or `interface`) only when the component has four or more props, or when the type needs to be exported for consumers to extend or reference.

---

## JSDoc

### When to write one

Any function or component that goes beyond simple (i.e. non-obvious purpose, non-trivial logic, or meaningful side effects) should have a JSDoc comment. Straightforward one-liners or components whose name fully describes their behaviour do not need one.

### What to include

- A concise description of what the function does and why it exists — not a restatement of its name.
- `@param` tags for any parameters that are not self-evident from their name and type alone.
- `@returns` if the return value is non-obvious.
- `@example` when the call signature is hard to reason about in isolation (e.g. factory functions, hooks with unusual patterns, non-obvious argument combinations).

### Line length

Wrap prose at roughly 120 characters per line.

---

## Testing

### When to write tests

Any function or component with more than moderate complexity should have tests. Simple one-liners or components whose behaviour is fully described by their name and types do not need them.

### What to test

Tests should either illustrate the intended usage of the function or encode its contract so that a behaviour change causes a failure. Coverage should be balanced:

- **Happy path** — verify expected outputs for valid inputs.
- **Failure cases** — verify that invalid inputs are rejected, that certain values are absent from results, or that the function throws/returns an error as intended.

Do not write many tests that assert the same thing in slightly different ways. A small number of precise, well-named tests that together cover the meaningful cases is preferable to exhaustive redundancy.

### Example

```ts
describe("formatDate", () => {
  it("formats an ISO string as DD/MM/YYYY", () => { ... });
  it("returns null for an invalid date string", () => { ... });
  it("handles the end of a month correctly", () => { ... });
});
```

### Example

```ts
/**
 * Defines a themed stylesheet. Call at module level with a factory that receives the current `ColorTheme` and returns
 * a style object. Returns a `useStyles` hook that resolves the theme from context and memoises the result — styles
 * only recompute when the theme changes.
 *
 * @example
 * const useStyles = makeStyles((theme) => ({
 *   container: { backgroundColor: theme.background },
 * }));
 *
 * function MyComponent() {
 *   const styles = useStyles();
 *   return <View style={styles.container} />;
 * }
 */
export function makeStyles<T extends NamedStyles>(factory: (theme: ColorTheme) => T) { ... }
```

---

## Runtime validation

- Validate data at runtime whenever it crosses an untyped boundary, including route parameters, external payloads, and
  database query results. Use Zod schemas instead of ad hoc `typeof` checks or manual regular expressions.
- Generate database row schemas from the Drizzle schema with `drizzle-zod`, then refine fields whose SQL constraints or
  domain formats cannot be inferred automatically.
- Declare each generated row schema immediately after its Drizzle table and keep reusable field schemas in the schema
  directory's `shared.ts` module. Name it by appending `Schema` to the table export name, such as `clientsSchema` for
  `clients`.
- Call `safeParse` at the boundary before data enters application state or domain logic. Handle validation failures as
  controlled load/input errors rather than allowing malformed data to propagate.
- Infer application data types from the runtime schema when practical so static and runtime contracts remain aligned.
