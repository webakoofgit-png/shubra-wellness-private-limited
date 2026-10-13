import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Language } from "@/lib/i18n";
import type { Session, Store } from "@/lib/wellness-service";
export type AppContext = {
  store: Store;
  session: Session;
  language: Language;
  t: (key: string) => string;
  update: (fn: (current: Store) => Store) => boolean;
  notify: (message: string) => void;
  go: (page: string) => void;
  setLanguage: (language: Language) => void;
  logout: () => void;
  cart: Record<string, number>;
  setCart: (cart: Record<string, number>) => void;
};
export const Context = createContext<AppContext | null>(null);
export function useWellness() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Missing wellness provider");
  return ctx;
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  const control =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  return (
    <div className="field">
      {control ? <label htmlFor={id}>{label}</label> : <span>{label}</span>}
      {control ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children}
    </div>
  );
}
export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Badge({ value }: { value: string }) {
  const { t } = useWellness();
  return (
    <span
      className={`badge ${["Active", "Verified", "Approved", "Completed", "Delivered", "Simulated paid", "Paid"].includes(value) ? "good" : ["Cancelled", "Rejected", "Inactive"].includes(value) ? "bad" : "pending"}`}
    >
      {t(value)}
    </span>
  );
}
export function Empty() {
  const { t } = useWellness();
  return <div className="empty">{t("Empty")}</div>;
}
export function csvDownload(name: string, rows: (string | number | boolean)[][]) {
  const text =
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((cell) => {
            const raw = String(cell);
            const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\r\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
