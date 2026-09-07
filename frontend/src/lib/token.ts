const TOKEN_KEY = "studyflow_token";

// Isolation layer for JWT storage. Currently uses localStorage for this
// student project; can be swapped for httpOnly cookies without touching
// callers.
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}