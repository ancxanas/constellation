import { LoginForm } from "@/components/auth/login-form"
import { availableOAuthProviders } from "@/lib/auth-providers"

export default function LoginPage() {
  return <LoginForm providers={availableOAuthProviders()} />
}
