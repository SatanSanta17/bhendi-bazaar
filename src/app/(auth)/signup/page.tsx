import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
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
          This is a placeholder for a richer account experience in future
          phases.
        </p>
      </header>
      <div className="space-y-3 text-sm">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            Name
          </label>
          <Input />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            Email
          </label>
          <Input type="email" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            Password
          </label>
          <Input type="password" />
        </div>
        <Button
          disabled
          className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
        >
          Create account (coming soon)
        </Button>
        <p className="pt-2 text-center text-[0.7rem] text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="underline underline-offset-4">
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}


