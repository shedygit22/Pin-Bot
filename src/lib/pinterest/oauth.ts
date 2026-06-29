const PINTEREST_AUTH_URL = "https://www.pinterest.com/oauth";
const REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI || "http://localhost:3000/api/pinterest/callback";

const SCOPES = [
  "boards:read",
  "boards:write",
  "pins:read",
  "pins:write",
  "user_accounts:read",
].join(",");

export function getPinterestAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.PINTEREST_CLIENT_ID || "",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    state,
  });
  return `${PINTEREST_AUTH_URL}/?${params.toString()}`;
}

export function getPinterestRedirectUri(): string {
  return REDIRECT_URI;
}
