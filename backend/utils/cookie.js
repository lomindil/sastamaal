const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const KEY = crypto
  .createHash("sha256")
  .update(process.env.COOKIE_SECRET)
  .digest();

function encodePodId(podId) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);

    let encrypted = cipher.update(String(podId), "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag().toString("hex");

    return Buffer.from(
        JSON.stringify({
            iv: iv.toString("hex"),
            data: encrypted,
            tag
        })
    ).toString("base64");
}

function decodePodId(encoded) {
    const decoded = JSON.parse(
        Buffer.from(encoded, "base64").toString("utf8")
    );

    const decipher = crypto.createDecipheriv(
        ALGO,
        KEY,
        Buffer.from(decoded.iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(decoded.tag, "hex"));

    let decrypted = decipher.update(decoded.data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return Number(decrypted);
}

module.exports = { encodePodId, decodePodId };

