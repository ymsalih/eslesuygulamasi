"use client";

/** Geri alınması zor işlemler için onay soran gönder butonu. */
export default function ConfirmButton({ message, className, children, name, value }: {
  message: string; className?: string; children: React.ReactNode; name?: string; value?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      name={name}
      value={value}
      onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}
    >
      {children}
    </button>
  );
}
