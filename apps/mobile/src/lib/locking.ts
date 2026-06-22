import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_ALIAS = "db_encryption_key";

const STORE_METHOD_KEY = "encryption_key_storage_method";
const AUTH_PREFERENCE_KEY = "auth_preference";

type StorageMethod = "secure" | "unsecure" | null;
export type AuthPreference = "secure" | "unsecure";

/**
 * Checks how the encryption key is currently stored on the device.
 * A key stored as unsecured which is then attempted to be read as secured (or vice versa) will fail
 */
async function getKeyStorageMethod(): Promise<StorageMethod> {
  const method = await AsyncStorage.getItem(STORE_METHOD_KEY);
  if (method === null) {
    return null;
  }
  if (method === "secure" || method === "unsecure") {
    return method;
  }
  // If the value is something unexpected, clear it and start fresh
  await AsyncStorage.removeItem(STORE_METHOD_KEY);
  return null;
}

/**
 * Checks the user's preference for app authentication.
 *
 * If no valid authentication preference is found, returns null
 */
export async function getAuthPreference(): Promise<AuthPreference | null> {
  const preference = await AsyncStorage.getItem(AUTH_PREFERENCE_KEY);
  if (preference === "secure" || preference === "unsecure") {
    return preference;
  }
  return null;
}

/** Persists the user's authentication preference. */
export async function setAuthPreference(
  preference: AuthPreference,
): Promise<void> {
  await AsyncStorage.setItem(AUTH_PREFERENCE_KEY, preference);
}

/**
 * Returns the database encryption key from the device Keychain/Keystore,
 * generating and persisting a new random key if one does not yet exist.
 *
 * The `requireAuthentication` option makes Keychain and Keystore refuse to release the value
 * without biometric or passcode verification at some point in the app session.
 *
 * @returns The encryption key, or null if the device does not support SecureStore
 */
export async function getOrCreateDbKey(): Promise<string | null> {
  const canUseSecureStore = await SecureStore.isAvailableAsync();
  const biometricEnabled = SecureStore.canUseBiometricAuthentication();
  const authPreference = await getAuthPreference();
  const storageMethod = await getKeyStorageMethod();

  if (authPreference === null) {
    // NOTE: This shouldn't be possible
    throw new Error("No valid authentication preference found");
  }

  let requireAuthentication: boolean;

  if (storageMethod === "secure") {
    if (!canUseSecureStore || !biometricEnabled) {
      // User has selected preference for auth, but has since disabled their auth. Ask to re-enable it or truncate the DB.
      throw new Error(
        "User preference is to require authentication, but device does not support it.",
      );
    }
    requireAuthentication = true;
  } else {
    requireAuthentication = false;
  }

  let key = await SecureStore.getItemAsync(KEY_ALIAS, {
    requireAuthentication,
  });

  if (key === null) {
    // no key exists yet, generate and persist a new one
    key = Crypto.randomUUID();
    await SecureStore.setItemAsync(KEY_ALIAS, key, {
      requireAuthentication: authPreference === "secure",
    });
    await AsyncStorage.setItem(STORE_METHOD_KEY, authPreference);
  } else if (storageMethod !== authPreference) {
    // A key exists, but he the users authPreference has changed since it was created. Delete the old key and persist it with the new settings
    await SecureStore.deleteItemAsync(KEY_ALIAS);
    await AsyncStorage.removeItem(STORE_METHOD_KEY);
    await SecureStore.setItemAsync(KEY_ALIAS, key, {
      requireAuthentication: authPreference === "secure",
    });
    await AsyncStorage.setItem(STORE_METHOD_KEY, authPreference);
  }
  return key;
}
