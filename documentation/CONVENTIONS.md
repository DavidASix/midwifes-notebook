# Conventions

Coding conventions for this repository. Applies across all packages and apps unless a section specifies otherwise.

---

## File naming

- **Components and screens** — PascalCase: `ClientList.tsx`, `Button.tsx`
- **Hooks** — camelCase matching the export: `useAppFonts.ts`
- **Lib and util files** — kebab-case: `make-styles.ts`, `theme-context.tsx`

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
