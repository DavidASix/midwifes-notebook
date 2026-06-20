import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const KEY_ALIAS = "db_encryption_key";

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
  if (!canUseSecureStore || !biometricEnabled) {
    return null;
  }
  let key = await SecureStore.getItemAsync(KEY_ALIAS, {
    requireAuthentication: true,
  });
  if (key === null) {
    key = Crypto.randomUUID();
    await SecureStore.setItemAsync(KEY_ALIAS, key, {
      requireAuthentication: true,
    });
  }
  return key;
}
