import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";
import { Platform } from "react-native";

import type { AppData } from "@/context/DataContext";

const ENCRYPTION_KEY_NAME = "@eg_encryption_key";
const APP_DATA_KEY = "app_data";
const AUTH_USER_KEY = "auth_user";
const AUTH_SESSION_KEY = "auth_session";
const DEFAULT_AUTH_USERNAME = "elton";
const DEFAULT_AUTH_PASSWORD = "23112004";
const LEGACY_AUTH_KEY = "@eg_auth_v1";
const LEGACY_AUTH_USERNAME = "elton";
const LEGACY_AUTH_PASSWORD = "23112004";

let encryptionKeyPromise: Promise<string> | null = null;
const isWeb = Platform.OS === "web";

export interface PersistedAuthUser {
  username: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

function buildDefaultAppData(): AppData {
  return {
    seeded: false,
    dismissedNotificationIds: [],
    customers: [],
    services: [],
    appointments: [],
    inventory: [],
    gallery: [],
  };
}


async function getStorageValue(key: string): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setStorageValue(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function removeStorageValue(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

async function getEncryptionKey(): Promise<string> {
  if (!encryptionKeyPromise) {
    encryptionKeyPromise = (async () => {
      const existing = await getStorageValue(ENCRYPTION_KEY_NAME);
      if (existing) {
        return existing;
      }

      const seed = `${Crypto.randomUUID()}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        seed
      );

      await setStorageValue(ENCRYPTION_KEY_NAME, key);
      return key;
    })();
  }

  return encryptionKeyPromise;
}

function encryptText(value: string, key: string): string {
  return CryptoJS.AES.encrypt(value, key).toString();
}

function decryptText(value: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(value, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}

async function getStoredValue(key: string): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(`@eg_store:${key}`);
  }

  return null;
}

async function setStoredValue(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(`@eg_store:${key}`, value);
    return;
  }

  return;
}

async function deleteStoredValue(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(`@eg_store:${key}`);
    return;
  }

  return;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
}

async function ensureAuthSeed(): Promise<void> {
  const existing = await getStoredValue(AUTH_USER_KEY);
  if (existing) {
    return;
  }

  const passwordSalt = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${Date.now()}-${Crypto.randomUUID()}`
  );
  const passwordHash = await hashPassword(DEFAULT_AUTH_PASSWORD, passwordSalt);

  const authUser: PersistedAuthUser = {
    username: DEFAULT_AUTH_USERNAME,
    passwordHash,
    passwordSalt,
    createdAt: new Date().toISOString(),
  };

  const key = await getEncryptionKey();
  await setStoredValue(AUTH_USER_KEY, encryptText(JSON.stringify(authUser), key));
}

export async function loadPersistedAppData(): Promise<AppData | null> {
  const storedValue = await getStoredValue(APP_DATA_KEY);
  if (!storedValue) {
    return null;
  }

  const key = await getEncryptionKey();
  const decrypted = decryptText(storedValue, key);
  if (!decrypted) {
    return null;
  }

  try {
    const parsed = JSON.parse(decrypted) as AppData;
    return {
      ...buildDefaultAppData(),
      ...parsed,
      customers: parsed.customers ?? [],
      services: parsed.services ?? [],
      appointments: parsed.appointments ?? [],
      inventory: parsed.inventory ?? [],
      gallery: parsed.gallery ?? [],
      dismissedNotificationIds: parsed.dismissedNotificationIds ?? [],
      seeded: parsed.seeded ?? false,
    };
  } catch {
    return null;
  }
}

export async function persistAppData(data: AppData): Promise<void> {
  const key = await getEncryptionKey();
  const payload = JSON.stringify(data);
  await setStoredValue(APP_DATA_KEY, encryptText(payload, key));
}

export async function clearPersistedAppData(): Promise<void> {
  await deleteStoredValue(APP_DATA_KEY);
  await deleteStoredValue(AUTH_SESSION_KEY);
}

export async function authenticateUser(username: string, password: string): Promise<boolean> {
  const normalizedUsername = username.trim().toLowerCase();
  const legacyMatches =
    normalizedUsername === LEGACY_AUTH_USERNAME && password === LEGACY_AUTH_PASSWORD;

  if (legacyMatches) {
    await ensureAuthSeed();
    return true;
  }

  await ensureAuthSeed();

  const storedValue = await getStoredValue(AUTH_USER_KEY);
  if (!storedValue) {
    return false;
  }

  const key = await getEncryptionKey();
  const decrypted = decryptText(storedValue, key);
  if (!decrypted) {
    return false;
  }

  try {
    const user = JSON.parse(decrypted) as PersistedAuthUser;
    if (user.username !== normalizedUsername) {
      return false;
    }

    const expectedHash = await hashPassword(password, user.passwordSalt);
    return expectedHash === user.passwordHash;
  } catch {
    return false;
  }
}

export async function setAuthSession(active: boolean): Promise<void> {
  if (!active) {
    await deleteStoredValue(AUTH_SESSION_KEY);
    if (isWeb) {
      await AsyncStorage.removeItem(LEGACY_AUTH_KEY);
    }
    return;
  }

  const key = await getEncryptionKey();
  await setStoredValue(AUTH_SESSION_KEY, encryptText(JSON.stringify({ active: true }), key));
}

export async function hasActiveSession(): Promise<boolean> {
  if (isWeb) {
    const legacyValue = await AsyncStorage.getItem(LEGACY_AUTH_KEY);
    if (legacyValue === "true") {
      return true;
    }
  }

  const storedValue = await getStoredValue(AUTH_SESSION_KEY);
  if (!storedValue) {
    return false;
  }

  const key = await getEncryptionKey();
  const decrypted = decryptText(storedValue, key);
  if (!decrypted) {
    return false;
  }

  try {
    const payload = JSON.parse(decrypted) as { active?: boolean };
    return payload.active === true;
  } catch {
    return false;
  }
}
