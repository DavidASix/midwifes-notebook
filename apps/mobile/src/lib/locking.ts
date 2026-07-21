import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AsyncStorageKey, LockType } from "@/lib/async-storage";

const KEY_ALIAS = "db_encryption_key";

/**
 * Checks how the encryption key is currently stored on the device.
 * A key stored as unsecured which is then attempted to be read as secured (or vice versa) will fail
 */
async function getKeyStorageMethod(): Promise<LockType | null> {
  const method = await AsyncStorage.getItem(
    AsyncStorageKey.EncryptionKeyStorageMethod,
  );
  if (method === LockType.Secure || method === LockType.Unsecure) {
    return method;
  }
  if (method !== null) {
    await AsyncStorage.removeItem(AsyncStorageKey.EncryptionKeyStorageMethod);
  }
  return null;
}

/**
 * Checks the user's preference for app authentication.
 *
 * If no valid authentication preference is found, returns null
 */
export async function getAuthPreference(): Promise<LockType | null> {
  const preference = await AsyncStorage.getItem(AsyncStorageKey.AuthPreference);
  if (preference === LockType.Secure || preference === LockType.Unsecure) {
    return preference;
  }
  return null;
}

/** Persists the user's authentication preference. */
export async function setAuthPreference(preference: LockType): Promise<void> {
  await AsyncStorage.setItem(AsyncStorageKey.AuthPreference, preference);
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

  if (storageMethod === LockType.Secure) {
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
      requireAuthentication: authPreference === LockType.Secure,
    });
    await AsyncStorage.setItem(
      AsyncStorageKey.EncryptionKeyStorageMethod,
      authPreference,
    );
  } else if (storageMethod !== authPreference) {
    // A key exists, but he the users authPreference has changed since it was created. Delete the old key and persist it with the new settings
    await SecureStore.deleteItemAsync(KEY_ALIAS);
    await AsyncStorage.removeItem(AsyncStorageKey.EncryptionKeyStorageMethod);
    await SecureStore.setItemAsync(KEY_ALIAS, key, {
      requireAuthentication: authPreference === LockType.Secure,
    });
    await AsyncStorage.setItem(
      AsyncStorageKey.EncryptionKeyStorageMethod,
      authPreference,
    );
  }
  return key;
}
