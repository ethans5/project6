const crypto = require('crypto');

const COOKIE_NAME = 'session';
const ONE_DAY_SECONDS = 24 * 60 * 60;

function getSecret() {
  return process.env.AUTH_SECRET || 'dev-only-change-this-auth-secret';
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sign(value) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(value)
    .digest('base64url');
}

function createSessionToken(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + ONE_DAY_SECONDS
  };
  const encodedPayload = base64UrlEncode(payload);
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature || sign(encodedPayload) !== signature) {
    return null;
  }

  try {
    const payload = base64UrlDecode(encodedPayload);
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getCookieOptions() {
  return [
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${ONE_DAY_SECONDS}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : ''
  ].filter(Boolean);
}

function createSessionCookie(user) {
  return `${COOKIE_NAME}=${createSessionToken(user)}; ${getCookieOptions().join('; ')}`;
}

function createClearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

function parseSessionCookie(cookieHeader) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  if (!sessionCookie) {
    return null;
  }

  return decodeURIComponent(sessionCookie.slice(COOKIE_NAME.length + 1));
}

module.exports = {
  createSessionCookie,
  createClearSessionCookie,
  parseSessionCookie,
  verifySessionToken
};
