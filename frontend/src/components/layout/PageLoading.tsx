export function PageLoading() {
  return (
    <div className="flex min-h-[62vh] items-center justify-center px-4 py-16" role="status" aria-label="Loading">
      <div className="flex flex-col items-center">
        <div className="estate-loader" aria-hidden="true">
          <span className="estate-loader__ring estate-loader__ring--outer" />
          <span className="estate-loader__ring estate-loader__ring--inner" />
          <span className="estate-loader__mark">E<span>.</span></span>
        </div>
        <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
          <span className="estate-loader__dot" />
          <span className="estate-loader__dot" />
          <span className="estate-loader__dot" />
        </div>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
