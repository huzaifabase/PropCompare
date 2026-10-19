"use client";

/* Public admin sign-in. Middleware keeps every other /admin/* route protected. */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-client";
import { Button, Card, Input, Field, Alert } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const unauthorized = searchParams.get("error") === "unauthorized";
  const next = searchParams.get("next");
  const dest = next && next.startsWith("/admin") ? next : "/admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
      router.push(dest);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-bold text-accent-dark">PropCompare</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">Admin sign in</h1>
        </div>
        {unauthorized && (
          <div className="mb-4">
            <Alert tone="warning">
              That account is signed in but does not have admin access. Contact the site owner to
              grant access.
            </Alert>
          </div>
        )}
        {error && (
          <div className="mb-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" htmlFor="admin-email">
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" htmlFor="admin-password">
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="font-semibold text-accent-dark hover:underline">
            ← Back to PropCompare
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
