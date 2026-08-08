import type { OAuthProvider } from "@/components/auth/oauth-buttons"

export function availableOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = []
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push({ id: "google", label: "Google" })
  }
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push({ id: "github", label: "GitHub" })
  }
  return providers
}
