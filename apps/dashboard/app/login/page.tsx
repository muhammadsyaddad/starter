"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/ui/button";
import { Field } from "@repo/ui/ui/field";
import { Input } from "@repo/ui/ui/input";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="grid min-h-dvh bg-background md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="grid gap-1">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your dashboard
            </p>
          </div>
          <form
            className="grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setBusy(true);
              try {
                await login(String(f.get("email")), String(f.get("password")));
                router.replace("/");
              } catch (err) {
                setError((err as Error).message);
                setBusy(false);
              }
            }}
          >
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
            <Field label="Password">
              <Input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </Field>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
      <div className="relative hidden md:block">
        <Image
          src="/login-hero.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
