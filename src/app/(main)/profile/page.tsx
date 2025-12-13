export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Profile
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Your Bhendi Bazaar profile
        </h1>
      </header>
      <p className="text-sm text-muted-foreground">
        This page will eventually host saved addresses, measurements, and order
        preferences once authentication and backend are wired. For Phase 1, it
        simply marks the place in the architecture.
      </p>
    </div>
  );
}


