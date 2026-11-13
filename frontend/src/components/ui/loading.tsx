export function LoadingPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper">
      <div className="flex items-center gap-3 text-sm font-semibold text-pine">
        <span className="size-5 animate-spin rounded-full border-2 border-pine/20 border-t-pine" />
        Loading workspace…
      </div>
    </div>
  );
}
