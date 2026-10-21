interface ConsolePageHeaderProps {
  description: string;
  kicker: string;
  title: string;
}

export function ConsolePageHeader({
  description,
  kicker,
  title,
}: ConsolePageHeaderProps) {
  return (
    <div className="mb-7">
      <span className="font-extrabold text-[10px] text-muted-text uppercase tracking-[.12em]">
        {kicker}
      </span>
      <h1 className="mt-[7px] mb-[5px] font-extrabold text-4xl tracking-[-.04em]">
        {title}
      </h1>
      <p className="m-0 text-muted-text text-sm">{description}</p>
    </div>
  );
}
