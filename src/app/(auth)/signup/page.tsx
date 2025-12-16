"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Failed to create account.");
        setIsLoading(false);
        return;
      }

      // Auto sign-in after successful signup
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      setIsLoading(false);

      if (result?.error) {
        // Account was created, but auto sign-in failed; direct user to sign-in page.
        router.push("/signin");
        return;
      }

      router.push("/");
    } catch (err) {
      console.error("Signup failed", err);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError(null);
    await signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Sign up
        </p>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Join the Bhendi Bazaar circle
        </h1>
        <p className="text-xs text-muted-foreground">
          Create an account to save your details and track your orders. You can
          still complete purchases as a guest anytime.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <p className="text-[0.7rem] text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>

        <div className="flex items-center gap-2 pt-2">
          <span className="h-px flex-1 bg-border/70" />
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            or
          </span>
          <span className="h-px flex-1 bg-border/70" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignUp}
          className="w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
        >
          Continue with Google
        </Button>

        <p className="pt-2 text-center text-[0.7rem] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="underline underline-offset-4">
            Sign in
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
