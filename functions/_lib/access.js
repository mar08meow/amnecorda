const certCache = new Map();

const base64UrlToBytes = (value) => {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized.padEnd(
    Math.ceil(normalized.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const decodeJson = (value) =>
  JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));

const normalizeTeamDomain = (value) =>
  String(value || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

async function getCertificates(teamDomain) {
  const cached = certCache.get(teamDomain);
  if (cached && cached.expires > Date.now()) return cached.keys;

  const response = await fetch(
    `https://${teamDomain}/cdn-cgi/access/certs`
  );
  if (!response.ok) {
    throw new Error(
      `无法获取 Cloudflare Access 证书（${response.status}）`
    );
  }

  const data = await response.json();
  const keys = Array.isArray(data.keys) ? data.keys : [];
  certCache.set(teamDomain, {
    keys,
    expires: Date.now() + 60 * 60 * 1000,
  });
  return keys;
}

async function verifyAccessJwt(token, audience, teamDomain) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw new Error("Cloudflare Access JWT 格式不正确");
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJson(headerPart);
  const payload = decodeJson(payloadPart);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Cloudflare Access JWT 算法不受支持");
  }

  const keys = await getCertificates(teamDomain);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) {
    throw new Error("找不到 Cloudflare Access 签名密钥");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    base64UrlToBytes(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`)
  );

  if (!valid) {
    throw new Error("Cloudflare Access JWT 签名无效");
  }

  const audiences = Array.isArray(payload.aud)
    ? payload.aud
    : [payload.aud];
  if (!audiences.includes(audience)) {
    throw new Error("Cloudflare Access JWT audience 不匹配");
  }

  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    throw new Error("Cloudflare Access JWT 已过期");
  }

  return payload;
}

export async function requireAccessUser(context) {
  const token = context.request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return null;

  const teamDomain = normalizeTeamDomain(
    context.env.ACCESS_TEAM_DOMAIN
  );
  const audience = context.env.ACCESS_AUD;

  if (!teamDomain || !audience) {
    throw new Error(
      "Cloudflare Access 环境变量未配置：ACCESS_TEAM_DOMAIN / ACCESS_AUD"
    );
  }

  const payload = await verifyAccessJwt(token, audience, teamDomain);
  return {
    email: payload.email || "",
    sub: payload.sub || "",
  };
}
