import type { CSSProperties, ReactNode } from "react";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function EditorShell({
  viewport,
  brand,
  toolbar,
  leftSidebar,
  rightSidebar,
  centerPanel,
  bottomRail,
  mobilePanel,
  stageStyle
}: {
  viewport: ReactNode;
  brand: ReactNode;
  toolbar: ReactNode;
  leftSidebar: ReactNode;
  rightSidebar: ReactNode;
  centerPanel: ReactNode;
  bottomRail: ReactNode;
  mobilePanel: ReactNode;
  stageStyle?: CSSProperties;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white" style={stageStyle}>
      <div className="absolute inset-0 opacity-70">
        <div className="absolute inset-x-[8%] top-[-26%] h-[48vh] rounded-full bg-black blur-3xl" />
        <div className="absolute left-1/2 top-[32%] h-[70vh] w-[70vw] -translate-x-1/2 rounded-full bg-[#0f7b5d]/30 blur-[120px]" />
        <div className="absolute bottom-[-18%] left-1/2 h-[42vh] w-[76vw] -translate-x-1/2 rounded-full bg-white/12 blur-[120px]" />
      </div>
      <div className="absolute inset-0">{viewport}</div>
      <header className="absolute inset-x-0 top-0 z-30 hidden items-start justify-between px-[50px] pt-[50px] lg:flex">
        {brand}
        {toolbar}
      </header>
      <aside className="absolute bottom-[50px] left-[50px] z-30 hidden lg:block">{leftSidebar}</aside>
      <aside className="absolute bottom-[50px] right-[50px] z-30 hidden lg:block">{rightSidebar}</aside>
      <section className="absolute bottom-[122px] left-1/2 z-30 hidden -translate-x-1/2 lg:block">{centerPanel}</section>
      <section className="absolute bottom-[50px] left-1/2 z-30 hidden -translate-x-1/2 lg:block">{bottomRail}</section>
      <section className="relative z-30 flex min-h-screen flex-col justify-between p-4 lg:hidden">{mobilePanel}</section>
    </div>
  );
}

export function GlassCard({
  title,
  onClose,
  children,
  className
}: {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={joinClasses(
        "rounded-[16px] border border-white/5 bg-[#222]/94 p-2 text-white shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center justify-center px-1">
        <div className="min-w-0 flex-1" />
        <h2 className="text-[14px] tracking-[-0.05em] text-white">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className={joinClasses(
            "ml-auto inline-flex size-4 items-center justify-center rounded-full text-[#a3a3a3] transition hover:text-white",
            !onClose && "pointer-events-none opacity-0"
          )}
          aria-label={`Close ${title}`}
        >
          <span className="text-sm leading-none">×</span>
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-center text-[14px] tracking-[-0.05em] text-[#808080]">{children}</p>;
}

export function ActionCluster({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1 rounded-[16px] bg-[#222]/94 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.32)]">{children}</div>;
}

export function IconActionButton({
  active = false,
  onClick,
  children,
  title,
  disabled = false
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={joinClasses(
        "inline-flex size-10 items-center justify-center rounded-[16px] border border-white/6 bg-black text-white transition hover:bg-[#2f2f2f] disabled:cursor-not-allowed disabled:opacity-50",
        active && "bg-[#2f2f2f]"
      )}
      aria-label={title}
    >
      {children}
    </button>
  );
}

export function BrandBadge({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  return (
    <div className="flex h-14 items-center gap-[6px] rounded-[16px] bg-[#222]/94 px-2 shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
      <div className="inline-flex size-10 items-center justify-center rounded-[12px] bg-black text-white">{icon}</div>
      <div className="leading-none">
        <p className="text-[18px] font-semibold tracking-[-0.07em] text-white">{title}</p>
        <p className="mt-0.5 text-[18px] tracking-[-0.07em] text-white/90">{subtitle}</p>
      </div>
    </div>
  );
}

export function PresetTile({
  active = false,
  onClick,
  children,
  disabled = false,
  className
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={joinClasses(
        "flex h-20 w-20 items-center justify-center rounded-[12px] border border-transparent bg-[#2f2f2f] p-2 transition",
        active && "bg-[#4c4c4c]",
        !disabled && "hover:border-white/12",
        disabled && "cursor-default opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

export function CollapsedChip({
  onClick,
  children,
  className
}: {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={joinClasses(
        "inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#222]/94 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.32)] transition hover:bg-[#2b2b2b]",
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-[8px] bg-[#424242]">{children}</div>
    </button>
  );
}

export function Rail({
  leading,
  children,
  className
}: {
  leading?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={joinClasses(
        "flex h-14 items-center gap-4 rounded-[16px] bg-[#222]/94 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.32)]",
        className
      )}
    >
      {leading}
      {children}
    </div>
  );
}

export function RailSegment({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const percentage = ((value - min) / (max - min || 1)) * 100;

  return (
    <label className="relative flex h-10 w-40 items-center justify-center overflow-hidden rounded-[12px] bg-black px-3">
      <span
        className="absolute inset-y-0 left-0 rounded-[12px] bg-[#4c4c4c] transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      />
      <span className="relative z-10 text-[14px] tracking-[-0.04em] text-white">{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );
}

export function FieldFrame({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={joinClasses("rounded-[12px] bg-black p-2", className)}>{children}</div>;
}
