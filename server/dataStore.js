const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const KEY_PATH = path.join(DATA_DIR, ".encryption.key");
const DEFAULT_USERNAME = "elton";
const DEFAULT_PASSWORD = "23112004";

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getEncryptionKey() {
  ensureDataDir();

  if (fs.existsSync(KEY_PATH)) {
    return fs.readFileSync(KEY_PATH, "utf8").trim();
  }

  const key = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(KEY_PATH, key, "utf8");
  return key;
}

function encryptText(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

function decryptText(payload, key) {
  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, 16);
  const authTag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function buildInitialStore() {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    auth: {
      username: DEFAULT_USERNAME,
      passwordHash: hashPassword(DEFAULT_PASSWORD, salt),
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    },
    session: { active: false },
    appData: {
      seeded: false,
      dismissedNotificationIds: [],
      customers: [],
      services: [],
      appointments: [],
      inventory: [],
      gallery: [],
    },
  };
}

function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function saveStore(store) {
  ensureDataDir();
  const key = getEncryptionKey();
  const payload = JSON.stringify(store);
  const encrypted = encryptText(payload, key);
  fs.writeFileSync(STORE_PATH, JSON.stringify({ encrypted: true, payload: encrypted }), "utf8");
}

function loadStore() {
  ensureDataDir();

  if (!fs.existsSync(STORE_PATH)) {
    const initialStore = buildInitialStore();
    saveStore(initialStore);
    return initialStore;
  }

  try {
    const fileContent = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(fileContent);
    if (!parsed?.payload) {
      const initialStore = buildInitialStore();
      saveStore(initialStore);
      return initialStore;
    }

    const key = getEncryptionKey();
    const decrypted = decryptText(parsed.payload, key);
    return JSON.parse(decrypted);
  } catch {
    const initialStore = buildInitialStore();
    saveStore(initialStore);
    return initialStore;
  }
}

function authenticateUser(username, password) {
  const store = loadStore();
  const normalized = username?.trim().toLowerCase() || "";
  if (store.auth.username !== normalized) {
    return false;
  }

  const expectedHash = hashPassword(password || "", store.auth.passwordSalt);
  return expectedHash === store.auth.passwordHash;
}

function setAuthSession(active) {
  const store = loadStore();
  store.session = { active: Boolean(active) };
  saveStore(store);
  return store.session.active;
}

function hasActiveSession() {
  return loadStore().session.active === true;
}

function loadAppData() {
  const store = loadStore();
  return store.appData || {
    seeded: false,
    dismissedNotificationIds: [],
    customers: [],
    services: [],
    appointments: [],
    inventory: [],
    gallery: [],
  };
}

function saveAppData(appData) {
  const store = loadStore();
  store.appData = appData;
  saveStore(store);
}

function clearAppData() {
  const store = loadStore();
  store.appData = {
    seeded: false,
    dismissedNotificationIds: [],
    customers: [],
    services: [],
    appointments: [],
    inventory: [],
    gallery: [],
  };
  saveStore(store);
}

module.exports = {
  authenticateUser,
  clearAppData,
  hasActiveSession,
  loadAppData,
  saveAppData,
  setAuthSession,
};
