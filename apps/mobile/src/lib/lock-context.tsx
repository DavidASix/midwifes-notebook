import { createContext, useContext, useState } from "react";

type LockContextValue = {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
};

const LockContext = createContext<LockContextValue>({
  isLocked: false,
  lock: () => {},
  unlock: () => {},
});

/**
 * Provides app-wide lock state to the tree. Pass `initiallyLocked={true}` to start the app in a locked state,
 * requiring the user to authenticate before the rest of the UI is rendered.
 *
 * Consume via `useLock` to read `isLocked` or call `lock()`/`unlock()` from any component in the tree.
 */
export function LockProvider({
  children,
  initiallyLocked = false,
}: {
  children: React.ReactNode;
  initiallyLocked?: boolean;
}) {
  const [isLocked, setIsLocked] = useState(initiallyLocked);

  return (
    <LockContext.Provider
      value={{
        isLocked,
        lock: () => setIsLocked(true),
        unlock: () => setIsLocked(false),
      }}
    >
      {children}
    </LockContext.Provider>
  );
}

/**
 * Returns the current lock state and functions to lock or unlock the app.
 * Call `lock()` from any screen to show the authentication screen over the entire app.
 * Must be used inside `LockProvider`.
 *
 * @example
 * function SettingsScreen() {
 *   const { lock } = useLock();
 *   return <Button title="Lock app" onPress={lock} />;
 * }
 */
export function useLock() {
  return useContext(LockContext);
}
