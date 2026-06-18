export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-lg bg-brand-700 text-sm font-bold text-white shadow-sm">
        RM
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold leading-tight text-ink-900">RMTRAVEL</p>
        <p className="truncate text-xs font-medium text-ink-500">Travel operations</p>
      </div>
    </div>
  );
}
