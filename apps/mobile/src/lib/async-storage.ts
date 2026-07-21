/** All keys persisted in AsyncStorage. */
export enum AsyncStorageKey {
  OnboardingStatus = "onboardingComplete",
  AuthPreference = "auth_preference",
  EncryptionKeyStorageMethod = "encryption_key_storage_method",
}

/** Whether the app requires device authentication before opening the database. */
export enum LockType {
  Secure = "secure",
  Unsecure = "unsecure",
}

/** The persisted state of the first-run onboarding flow. */
export enum OnboardingStatus {
  Complete = "complete",
}
