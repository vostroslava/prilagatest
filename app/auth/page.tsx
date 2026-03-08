import { AuthPanel } from "@/components/auth/auth-panel";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return <AuthPanel callbackUrl={params.callbackUrl} />;
}
