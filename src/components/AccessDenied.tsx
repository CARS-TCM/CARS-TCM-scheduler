export function AccessDenied({ needs }: { needs: string }) {
  return (
    <div role="alert" className="card mx-auto max-w-xl p-6">
      <h2 className="text-lg font-semibold">Access denied</h2>
      <p className="mt-2 text-sm text-ink2">
        This view is only available to the {needs}. Use the sample login selector at the top of the page to switch role.
      </p>
      <p className="mt-2 text-xs text-muted">
        Prototype note: this check happens in the browser only. A production system must enforce it on the server.
      </p>
    </div>
  );
}
