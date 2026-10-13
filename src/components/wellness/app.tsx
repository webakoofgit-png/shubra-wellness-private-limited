import { lazy, Suspense, useEffect, useState } from "react";
import {
  Activity,
  Bell,
  ClipboardList,
  HeartPulse,
  HelpCircle,
  Languages,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
  X,
  BarChart3,
  UserRound,
  Settings,
  ArrowRight,
} from "lucide-react";
import { Context } from "./context";
import { Auth } from "./auth";
import {
  accountFor,
  loadDemo,
  seedStore,
  STORE_KEY,
  type Session,
  type Store,
} from "@/lib/wellness-service";
import { languages, translate, type Language } from "@/lib/i18n";
import type { Role } from "@/lib/demo-data";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
const Dashboard = lazy(() => import("./dashboard").then((m) => ({ default: m.Dashboard })));
const Reports = lazy(() => import("./dashboard").then((m) => ({ default: m.Reports })));
const Patients = lazy(() => import("./care").then((m) => ({ default: m.Patients })));
const Registration = lazy(() => import("./care").then((m) => ({ default: m.Registration })));
const Surveys = lazy(() => import("./care").then((m) => ({ default: m.Surveys })));
const Assignments = lazy(() => import("./care").then((m) => ({ default: m.Assignments })));
const Team = lazy(() => import("./care").then((m) => ({ default: m.Team })));
const Incentives = lazy(() => import("./care").then((m) => ({ default: m.Incentives })));
const Catalogue = lazy(() => import("./commerce").then((m) => ({ default: m.Catalogue })));
const Checkout = lazy(() => import("./commerce").then((m) => ({ default: m.Checkout })));
const Orders = lazy(() => import("./commerce").then((m) => ({ default: m.Orders })));
const Payments = lazy(() => import("./commerce").then((m) => ({ default: m.Payments })));
const Account = lazy(() => import("./common").then((m) => ({ default: m.Account })));
const Notifications = lazy(() => import("./common").then((m) => ({ default: m.Notifications })));
const Support = lazy(() => import("./common").then((m) => ({ default: m.Support })));
const Policy = lazy(() => import("./common").then((m) => ({ default: m.Policy })));
const Recovery = lazy(() => import("./common").then((m) => ({ default: m.Recovery })));
export const navigation: Record<Role, string[]> = {
  patient: [
    "Overview",
    "Profile",
    "Surveys",
    "Medicines",
    "Cart",
    "Orders",
    "Payments",
    "Notifications",
    "Settings",
    "Support",
    "Recovery",
    "Privacy",
    "Terms",
  ],
  worker: [
    "Overview",
    "Patients",
    "Register",
    "Surveys",
    "Incentives",
    "Payments",
    "Profile",
    "Notifications",
    "Settings",
    "Support",
    "Privacy",
    "Terms",
  ],
  sales: [
    "Overview",
    "Patients",
    "Medicines",
    "Cart",
    "Orders",
    "Reports",
    "Payments",
    "Profile",
    "Notifications",
    "Settings",
    "Support",
    "Privacy",
    "Terms",
  ],
  admin: [
    "Overview",
    "Workers",
    "Patients",
    "Sales",
    "Surveys",
    "Assignments",
    "Incentives",
    "Medicines",
    "Cart",
    "Orders",
    "Payments",
    "Reports",
    "Notifications",
    "Profile",
    "Settings",
    "Support",
    "Recovery",
    "Privacy",
    "Terms",
  ],
};
const icons: Record<string, typeof Leaf> = {
  Overview: LayoutDashboard,
  Profile: UserRound,
  Patients: Users,
  Register: UserRound,
  Surveys: ClipboardList,
  Incentives: Wallet,
  Medicines: Leaf,
  Cart: ShoppingCart,
  Orders: Package,
  Payments: Wallet,
  Reports: BarChart3,
  Assignments: Activity,
  Workers: HeartPulse,
  Sales: Users,
  Notifications: Bell,
  Settings,
  Support: HelpCircle,
  Privacy: ShieldCheck,
  Terms: ClipboardList,
  Recovery: ShieldCheck,
};
const roleNames = {
  patient: "Patient",
  worker: "Health Worker",
  sales: "Sales Representative",
  admin: "Super Admin",
};
export function WellnessApp() {
  const [store, setStore] = useState<Store>(seedStore);
  const [session, setSession] = useState<Session | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState("Overview");
  const [menu, setMenu] = useState(false);
  const [switcher, setSwitcher] = useState(false);
  const [toast, setToast] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [storageError, setStorageError] = useState(false);
  const t = (key: string) => translate(language, key);
  useEffect(() => {
    setStore(loadDemo());
    try {
      const lang = localStorage.getItem("ssw-language");
      if (lang && lang in languages) setLanguage(lang as Language);
      const raw = sessionStorage.getItem("ssw-session");
      if (raw) {
        const s = JSON.parse(raw) as Session;
        if (accountFor(loadDemo(), s)) setSession(s);
      }
    } catch {
      /* storage may be disabled */
    }
    const handle = () => {
      try {
        setPage(decodeURIComponent(window.location.hash.slice(1)) || "Overview");
      } catch {
        setPage("Overview");
      }
    };
    handle();
    window.addEventListener("popstate", handle);
    window.addEventListener("hashchange", handle);
    const timer = window.setTimeout(() => setReady(true), 600);
    return () => {
      window.removeEventListener("popstate", handle);
      window.removeEventListener("hashchange", handle);
      window.clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [store, ready]);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = language;
    try {
      localStorage.setItem("ssw-language", language);
    } catch {
      /* in-memory preference */
    }
  }, [language, ready]);
  useEffect(() => {
    if (!ready) return;
    try {
      if (session) sessionStorage.setItem("ssw-session", JSON.stringify(session));
      else sessionStorage.removeItem("ssw-session");
    } catch {
      /* in-memory session */
    }
  }, [session, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = (message: string) => setToast(message);
  const go = (next: string) => {
    if (session && !navigation[session.role].includes(next)) {
      notify("Access denied");
      return;
    }
    window.history.pushState({}, "", `#${encodeURIComponent(next)}`);
    setPage(next);
    setMenu(false);
    window.scrollTo(0, 0);
  };
  const logout = () => {
    setSession(null);
    setCart({});
    setPage("Overview");
    window.history.replaceState({}, "", window.location.pathname);
  };
  const update = (fn: (store: Store) => Store) => {
    let next: Store;
    try {
      next = fn(store);
    } catch (error) {
      notify(error instanceof Error ? t(error.message) : t("Invalid"));
      return false;
    }
    setStore(next);
    return true;
  };
  const login = (next: Session) => {
    setSession(next);
    setCart({});
    setPage("Overview");
    window.history.replaceState({}, "", "#Overview");
  };
  if (!ready)
    return (
      <div className="splash">
        <Leaf size={58} />
        <h1>Shri Shubhra Wellness</h1>
        <p>{t("Tagline")}</p>
        <span className="loader" />
      </div>
    );
  if (!session || !accountFor(store, session))
    return (
      <>
        <Auth
          store={store}
          setStore={setStore}
          onLogin={login}
          language={language}
          setLanguage={setLanguage}
          t={t}
          notify={notify}
        />
        {toast && (
          <div className="toast" role="alert">
            {toast}
            <button onClick={() => setToast("")} aria-label={t("Close")}>
              <X size={18} />
            </button>
          </div>
        )}
      </>
    );
  const person = accountFor(store, session)!;
  const safePage = navigation[session.role].includes(page) ? page : "Overview";
  const unread = store.notices.filter((n) => n.userId === session.id && !n.read).length;
  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const ctx = {
    store,
    session,
    language,
    setLanguage,
    t,
    notify,
    update,
    go,
    logout,
    cart,
    setCart,
  };
  return (
    <Context.Provider value={ctx}>
      <div className="wellness-app">
        {menu && (
          <button className="scrim" onClick={() => setMenu(false)} aria-label={t("Close")} />
        )}
        <aside className={`app-sidebar ${menu ? "open" : ""}`}>
          <a
            className="brand"
            href="#Overview"
            onClick={(e) => {
              e.preventDefault();
              go("Overview");
            }}
          >
            <span>
              <Leaf />
            </span>
            <div>
              shri shubhra<small>WELLNESS</small>
            </div>
          </a>
          <div className="sidebar-caption">{t(roleNames[session.role])}</div>
          <nav aria-label="Main navigation">
            {navigation[session.role].map((key) => {
              const Icon = icons[key] ?? Leaf;
              return (
                <button
                  key={key}
                  aria-label={t(key)}
                  onClick={() => go(key)}
                  className={safePage === key ? "selected" : ""}
                  aria-current={safePage === key ? "page" : undefined}
                >
                  <Icon size={18} />
                  {t(key)}
                  {key === "Cart" && cartCount > 0 && <b>{cartCount}</b>}
                  {key === "Notifications" && unread > 0 && <b>{unread}</b>}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-account">
            <span className="avatar">
              {person.name
                .split(" ")
                .map((s) => s[0])
                .join("")}
            </span>
            <div>
              <strong>{person.name}</strong>
              <small>{person.id}</small>
            </div>
            <button onClick={logout} aria-label={t("Logout")}>
              <LogOut size={18} />
            </button>
          </div>
        </aside>
        <main className="app-main">
          <header className="app-header">
            <button
              className="mobile-menu"
              onClick={() => setMenu(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <div className="breadcrumb">
              {t(roleNames[session.role])}
              <span>/</span>
              <strong>{t(safePage)}</strong>
            </div>
            <div className="header-actions">
              <Languages size={17} />
              <select
                aria-label={t("Language")}
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => go("Notifications")}
                aria-label={t("Notifications")}
                className="bell"
              >
                <Bell size={19} />
                {unread > 0 && <i />}
              </button>
              <button className="avatar" onClick={() => go("Profile")} aria-label={t("Profile")}>
                {person.name
                  .split(" ")
                  .map((s) => s[0])
                  .join("")}
              </button>
            </div>
          </header>
          <div className="app-content">
            <div className="demo-strip">
              <span>
                <i />
                {t("Demo")}
                <small>{t("Demo notice")}</small>
              </span>
              <button onClick={() => setSwitcher(true)}>
                {t("Demo role")}
                <ArrowRight size={15} />
              </button>
            </div>
            {storageError && (
              <p role="alert" className="notice">
                Browser storage is unavailable. Demo changes last only until this page is closed.
              </p>
            )}
            <Suspense
              fallback={
                <div className="workspace-skeleton" role="status" aria-label="Loading">
                  <div />
                  <div />
                  <div />
                  <div />
                </div>
              }
            >
              <div key={`${session.id}-${safePage}`}>
                {safePage === "Overview" && <Dashboard />}
                {safePage === "Patients" && <Patients />}
                {safePage === "Register" && <Registration />}
                {safePage === "Surveys" && <Surveys />}
                {safePage === "Assignments" && <Assignments />}
                {["Workers", "Sales"].includes(safePage) && (
                  <Team kind={safePage === "Workers" ? "worker" : "sales"} />
                )}
                {safePage === "Incentives" && <Incentives />}
                {safePage === "Medicines" && <Catalogue />}
                {safePage === "Cart" && <Checkout />}
                {safePage === "Orders" && <Orders />}
                {safePage === "Payments" && <Payments />}
                {safePage === "Reports" && <Reports />}
                {safePage === "Notifications" && <Notifications />}
                {["Profile", "Settings"].includes(safePage) && (
                  <Account settings={safePage === "Settings"} />
                )}
                {safePage === "Support" && <Support />}
                {["Privacy", "Terms"].includes(safePage) && <Policy kind={safePage} />}
                {safePage === "Recovery" && <Recovery />}
              </div>
            </Suspense>
            <footer>
              © 2026 Shri Shubhra Wellness Private Limited <span>{t("Demo notice")}</span>
            </footer>
          </div>
        </main>
        <nav className="bottom-nav" aria-label="Mobile navigation">
          {[
            "Overview",
            ...(session.role === "patient"
              ? ["Medicines", "Orders"]
              : session.role === "worker"
                ? ["Patients", "Surveys"]
                : ["Patients", "Orders"]),
            "Profile",
          ].map((key) => {
            const Icon = icons[key]!;
            return (
              <button
                key={key}
                onClick={() => go(key)}
                className={key === safePage ? "selected" : ""}
              >
                <Icon size={20} />
                <span>{t(key)}</span>
              </button>
            );
          })}
          <button onClick={() => setMenu(true)}>
            <Menu size={20} />
            <span>{t("All")}</span>
          </button>
        </nav>
        <Dialog open={switcher} onOpenChange={setSwitcher}>
          <DialogContent>
            <DialogTitle>{t("Demo role")}</DialogTitle>
            <DialogDescription>
              {t("Demo notice")}. This switcher grants no production permissions.
            </DialogDescription>
            <div className="role-grid">
              {(Object.keys(roleNames) as Role[]).map((role) => (
                <button
                  className="role-card"
                  key={role}
                  onClick={() => {
                    const p =
                      role === "patient"
                        ? store.patients.find((p) => p.status === "Active")
                        : store.team.find((p) => p.role === role && p.status === "Active");
                    if (p) {
                      login({ role, id: p.id });
                      setSwitcher(false);
                    }
                  }}
                >
                  <ShieldCheck />
                  <strong>{t(roleNames[role])}</strong>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
        {toast && (
          <div role="status" className="toast">
            {toast}
            <button onClick={() => setToast("")} aria-label={t("Close")}>
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    </Context.Provider>
  );
}
