const crypto = require("crypto");

const AUTH_TTL_MS = 60 * 60 * 1000; // 15 min
const authStore = new Map(); 

function generateAuthKey() {
  const key = crypto.randomUUID();
  const expiresAt = Date.now() + AUTH_TTL_MS;

  authStore.set(key, expiresAt);
  return { key, expiresAt };
}


function isAuthKeyValid(key) {
  const expiresAt = authStore.get(key);
  if (!expiresAt) return false;

  if (Date.now() > expiresAt) {
    authStore.delete(key);
    return false;
  }
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, exp] of authStore.entries()) {
    if (now > exp) authStore.delete(k);
  }
}, 60 * 1000);

module.exports = {
  generateAuthKey,
  isAuthKeyValid,
};
