# Mobile App Locking

The mobile app has no user accounts, passwords, sessions, or authentication
server. Locking happens entirely on the device and controls access to the key
used to open the encrypted local database.

## Stored in All Lock Modes

### AsyncStorage

AsyncStorage contains non-sensitive preferences and state:

- `onboardingComplete` — whether onboarding has been completed.
- `auth_preference` — the selected lock preference: `secure` or `unsecure`.
- `encryption_key_storage_method` — whether the database key is currently
  stored with or without an authentication requirement.

All AsyncStorage keys and constrained value enums are defined in
`apps/mobile/src/lib/async-storage.ts`. Callers import those constants and use
AsyncStorage directly.

### SecureStore

SecureStore contains:

- `db_encryption_key` — the randomly generated key used to encrypt and open the
  SQLite database.

SecureStore uses the iOS Keychain or Android Keystore. The database encryption
key is stored here in both lock modes; it is never stored in AsyncStorage.

### SQLite

The encrypted `midwifes_notebook.db` file contains the app's local records,
including clients, babies, notes, and database-backed settings.

## Biometric/PIN Lock

When the user selects **Biometric/PIN**:

- `auth_preference` is `secure` in AsyncStorage.
- `encryption_key_storage_method` is `secure` in AsyncStorage.
- `db_encryption_key` is saved in SecureStore with authentication required.
- The operating system must authenticate the user before SecureStore releases
  the database key.
- The released key is used to open the encrypted SQLite database.

The app does not store or verify the user's biometric data or device PIN. That
is handled by the operating system.

## No Lock

When the user selects **No lock**:

- `auth_preference` is `unsecure` in AsyncStorage.
- `encryption_key_storage_method` is `unsecure` in AsyncStorage.
- `db_encryption_key` remains in SecureStore, with authentication not required.
- SecureStore can release the key without presenting an authentication prompt.
- The SQLite database remains encrypted.
- If navigation reaches the lock route, it opens the database and immediately
  continues into the app without displaying the authentication action.

"No lock" therefore disables the authentication prompt; it does not move the
database key into AsyncStorage or make the database unencrypted.

## Stored Only in Memory

While the app is running:

- `isLocked` is held in React state.
- The open database reference is held in memory.

Locking the app clears the in-memory database reference. It does not delete the
SQLite database or the encryption key stored in SecureStore.

The manual **Lock** action in Settings is disabled while the authentication
preference is `unsecure`, because there is no authentication gate to engage.
