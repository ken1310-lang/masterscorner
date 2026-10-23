export function HomeRefreshBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="mt-8 rx-sm:mt-10 flex rx-sm:flex-row flex-col rx-sm:items-center rx-sm:justify-between gap-2 rounded-[16px] border border-hairline bg-sand px-4 py-3"
      role="status"
    >
      <p className="text-[14px] text-ink">
        {message} Showing the last loaded data.
      </p>
      <button
        className="min-h-9 rx-sm:self-auto self-start font-semibold text-[14px] text-brand-strong underline-offset-4 hover:underline"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}
