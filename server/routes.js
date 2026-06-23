const express = require("express");
const router = express.Router();
const { authenticateUser, clearAppData, hasActiveSession, loadAppData, saveAppData, setAuthSession } = require("./dataStore");

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const ok = authenticateUser(username, password);
  if (ok) {
    setAuthSession(true);
    res.json({ ok: true });
    return;
  }

  res.status(401).json({ ok: false, error: "Credenciais inválidas" });
});

router.post("/auth/logout", (_req, res) => {
  setAuthSession(false);
  res.json({ ok: true });
});

router.get("/auth/session", (_req, res) => {
  res.json({ active: hasActiveSession() });
});

router.get("/data", (_req, res) => {
  res.json(loadAppData());
});

router.post("/data", (req, res) => {
  saveAppData(req.body);
  res.json({ ok: true });
});

router.delete("/data", (_req, res) => {
  clearAppData();
  res.json({ ok: true });
});

module.exports = router;
