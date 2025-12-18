import { isAuthKeyValid } from "../authStore.js";

export function requireAuth(req, res, next) {
    const authKey = req.header("x-client-key");
    if (!authKey || !isAuthKeyValid(authKey)) {
        return res.status(401).json({
            error: "Invalid or expired auth key",
        })
    }
  next();
}

