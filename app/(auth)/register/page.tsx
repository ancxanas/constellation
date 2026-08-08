import { RegisterForm } from "@/components/auth/register-form"
import { availableOAuthProviders } from "@/lib/auth-providers"

export default function RegisterPage() {
  return <RegisterForm providers={availableOAuthProviders()} />
}
