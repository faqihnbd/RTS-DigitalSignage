/**
 * Decode JWT token without verification (client-side)
 * Returns the payload if valid, null if invalid or expired
 */
export function decodeToken(token) {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * Returns true if expired, false if still valid
 */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
}

/**
 * Get token expiry time in milliseconds
 */
export function getTokenExpiry(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;

  return payload.exp * 1000; // Convert to milliseconds
}

/**
 * Get time remaining until token expires (in milliseconds)
 */
export function getTokenTimeRemaining(token) {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;

  const remaining = expiry - Date.now();
  return Math.max(0, remaining);
}

/**
 * Clear all auth data from storage
 */
export function clearAuthData() {
  localStorage.removeItem("admin_token");
  sessionStorage.removeItem("admin_token");
  localStorage.removeItem("tenant_id");
  sessionStorage.removeItem("tenant_id");
  localStorage.removeItem("role");
  sessionStorage.removeItem("role");
}
