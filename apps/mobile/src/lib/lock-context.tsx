import { createContext, useCallback, useContext, useState } from "react";
import { initDb, resetDb } from "@/db";
import { getOrCreateDbKey } from "@/lib/locking";

type LockContextValue = {
  isLocked: boolean;
  lock: () => void;
  unlock: () => Promise<void>;
};

const LockContext = createContext<LockContextValue>({
  isLocked: false,
  lock: () => {},
  unlock: async () => {},
});

/**
 * Provides app-wide lock and database state.
 *
 * - `unlock()` — runs the full auth flow: fetches the encryption key, initializes the DB, then unlocks.
 * - `lock()` — clears the DB reference and re-locks.
 *
 * Consume via `useLock`
 */
export function LockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);

  const lock = useCallback(() => {
    resetDb();
    setIsLocked(true);
  }, []);

  const unlock = useCallback(async () => {
    const key = await getOrCreateDbKey();
    // TODO: Allow creating a db key if user doesn't have a lock on their phone
    if (!key) {
      throw new Error("SecureStore unavailable, cannot decrypt database.");
    }
    await initDb(key);
    setIsLocked(false);
  }, []);

  return (
    <LockContext.Provider value={{ isLocked, lock, unlock }}>
      {children}
    </LockContext.Provider>
  );
}

/**
 * Returns lock state and `lock`/`unlock` functions.
 * Call `lock()` from any screen to re-engage the auth gate.
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
