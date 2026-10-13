import { useState, type Dispatch, type SetStateAction } from "react";
import { ArrowRight, Leaf, ShieldCheck, HeartPulse } from "lucide-react";
import { Field } from "./context";
import { PatientForm } from "./patient-form";
import { languages, type Language } from "@/lib/i18n";
import {
  normalizeMobile,
  registerPatient,
  validMobile,
  type Session,
  type Store,
} from "@/lib/wellness-service";
import productImage from "@/assets/ayurvedic-products.jpg";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function Auth({
  store,
  setStore,
  onLogin,
  language,
  setLanguage,
  t,
  notify,
}: {
  store: Store;
  setStore: Dispatch<SetStateAction<Store>>;
  onLogin: (s: Session) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
  notify: (s: string) => void;
}) {
  const [step, setStep] = useState<
    "welcome" | "language" | "mobile" | "otp" | "register" | "admin" | "recovery"
  >("welcome");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [admin, setAdmin] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [reference] = useState(() =>
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("ref") ?? "")
      : "",
  );
  const fail = (message: string) => setError(t(message));
  function verify() {
    if (otp !== "123456") {
      fail("Invalid");
      return;
    }
    if (admin) {
      onLogin({ role: "admin", id: "ADM001" });
      return;
    }
    const p = [...store.patients, ...store.team].find((p) => p.mobile === normalizeMobile(mobile));
    if (p && p.status === "Inactive") {
      fail("Inactive");
      return;
    }
    if (p) {
      const pending = store.patients.find((patient) => patient.id === p.id && !patient.verified);
      if (pending) setStore(registerPatient(store, pending).store);
      notify(`${t("Restore")} · ${p.id}`);
      onLogin({ role: p.role, id: p.id });
    } else setStep("register");
  }
  const move = (s: typeof step) => {
    setError("");
    setStep(s);
  };
  return (
    <div className="auth-layout">
      <section className="auth-brand">
        <a className="brand" href="/">
          <span>
            <Leaf />
          </span>
          <div>
            shri shubhra<small>WELLNESS</small>
          </div>
        </a>
        <div className="auth-story">
          <span className="eyebrow">CARE · COMMUNITY · WELLNESS</span>
          <h1>{t("Tagline")}</h1>
          <p>
            Connected care for your family and community. A shared space for patients, health
            workers and wellness teams.
          </p>
          <img src={productImage} alt="Ayurvedic wellness products with herbs" />
          <div className="auth-trust">
            <HeartPulse />
            <span>Thoughtful care. Every step of the way.</span>
          </div>
        </div>
        <small>Shri Shubhra Wellness Private Limited · Phase 1 frontend demo</small>
      </section>
      <section className="auth-form-area">
        <div className="auth-top">
          <select
            value={language}
            aria-label={t("Language")}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            {Object.entries(languages).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <span className="badge pending">{t("Demo")}</span>
        </div>
        <div className="auth-card">
          <div className="auth-icon">
            <Leaf size={28} />
          </div>
          <h2>
            {t(
              step === "welcome"
                ? "Welcome"
                : step === "language"
                  ? "Language"
                  : step === "otp"
                    ? "OTP"
                    : step === "register"
                      ? "New registration"
                      : step === "admin"
                        ? "Admin login"
                        : step === "recovery"
                          ? "Recovery"
                          : "Login",
            )}
          </h2>
          <p className="muted">{t("Demo notice")}</p>
          {step === "welcome" && (
            <div className="form-stack">
              <button className="btn" onClick={() => move("language")}>
                {t("Get started")}
                <ArrowRight size={17} />
              </button>
              <button className="btn secondary" onClick={() => move("mobile")}>
                {t("Login")}
              </button>
              <button className="text-btn" onClick={() => setDemo(true)}>
                {t("Demo role")}
              </button>
            </div>
          )}
          {step === "language" && (
            <div className="form-stack">
              {Object.entries(languages).map(([code, name]) => (
                <button
                  className={`language-card ${code === language ? "active" : ""}`}
                  key={code}
                  onClick={() => setLanguage(code as Language)}
                >
                  {name}
                  {code === language && <ShieldCheck size={18} />}
                </button>
              ))}
              <button className="btn" onClick={() => move("mobile")}>
                {t("Continue")}
              </button>
            </div>
          )}
          {step === "mobile" && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                if (!validMobile(mobile)) {
                  fail("Invalid");
                  return;
                }
                setAdmin(false);
                setOtp("");
                move("otp");
              }}
            >
              <Field label={t("Mobile")}>
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="9876543210"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                />
              </Field>
              <p className="notice">{t("OTP note")}</p>
              <button className="btn">{t("Send OTP")}</button>
              <button type="button" className="text-btn" onClick={() => move("admin")}>
                {t("Admin login")}
              </button>
              <button type="button" className="text-btn" onClick={() => move("recovery")}>
                {t("Recovery")}
              </button>
            </form>
          )}
          {step === "admin" && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (f.get("email") !== "admin@shubhra.demo" || f.get("password") !== "Demo@123") {
                  fail("Invalid");
                  return;
                }
                setAdmin(true);
                setOtp("");
                move("otp");
              }}
            >
              <Field label={t("Email")}>
                <input name="email" type="email" required placeholder="admin@shubhra.demo" />
              </Field>
              <Field label={t("Password")}>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Demo@123"
                />
              </Field>
              <p className="notice">
                Demo: admin@shubhra.demo / Demo@123
                <br />
                {t("MFA")}
              </p>
              <button className="btn">{t("Continue")}</button>
            </form>
          )}
          {step === "otp" && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
            >
              <p className="notice">{t("OTP note")}</p>
              <Field label={t("OTP")}>
                <input
                  className="otp-input"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoComplete="one-time-code"
                  placeholder="••••••"
                />
              </Field>
              <button className="btn">{t("Verify")}</button>
            </form>
          )}
          {step === "register" && (
            <PatientForm
              t={t}
              mobile={mobile}
              reference={reference}
              workers={store.team.filter((p) => p.role === "worker" && p.status === "Active")}
              onSave={(input) => {
                try {
                  const result = registerPatient(store, input);
                  setStore(result.store);
                  onLogin({ role: "patient", id: result.patient.id });
                  notify(`${t(result.restored ? "Restore" : "Success")} · ${result.patient.id}`);
                } catch (error) {
                  fail(error instanceof Error ? error.message : "Invalid");
                }
              }}
            />
          )}
          {step === "recovery" && (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const id = String(f.get("patientId"));
                const p = store.patients.find((p) => p.id === id);
                const nextMobile = String(f.get("mobile"));
                if (!p || !validMobile(nextMobile)) {
                  fail("Invalid");
                  return;
                }
                setStore({
                  ...store,
                  recovery: [
                    ...store.recovery,
                    {
                      id: `REC-${Date.now()}`,
                      patientId: id,
                      mobile: normalizeMobile(nextMobile),
                      reason: String(f.get("reason")),
                      status: "Pending",
                      date: new Date().toISOString().slice(0, 10),
                    },
                  ],
                });
                notify(t("Saved"));
                move("mobile");
              }}
            >
              <p className="notice">{t("Recovery note")}</p>
              <Field label={t("Patient ID")}>
                <input name="patientId" required placeholder="PT10001" />
              </Field>
              <Field label={t("Mobile")}>
                <input
                  name="mobile"
                  required
                  pattern="[6-9][0-9]{9}"
                  inputMode="tel"
                  maxLength={10}
                />
              </Field>
              <Field label={t("Reason")}>
                <textarea name="reason" required />
              </Field>
              <button className="btn">{t("Send request")}</button>
            </form>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {step !== "welcome" && (
            <button className="text-btn" onClick={() => move("welcome")}>
              {t("Back")}
            </button>
          )}
          <div className="auth-footer">
            <ShieldCheck size={17} />
            <span>Mock authentication only. No production permissions or permanent records.</span>
          </div>
        </div>
      </section>
      <Dialog open={demo} onOpenChange={setDemo}>
        <DialogContent>
          <DialogTitle>{t("Demo role")}</DialogTitle>
          <DialogDescription>{t("Demo notice")}</DialogDescription>
          <div className="role-grid">
            {(["patient", "worker", "sales", "admin"] as const).map((role, i) => (
              <button
                className="role-card"
                key={role}
                onClick={() => {
                  const p =
                    role === "patient"
                      ? store.patients.find((p) => p.status === "Active")
                      : store.team.find((p) => p.role === role && p.status === "Active");
                  if (p) onLogin({ role, id: p.id });
                }}
              >
                <ShieldCheck />
                <strong>
                  {t(["Patient", "Health Worker", "Sales Representative", "Super Admin"][i]!)}
                </strong>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
