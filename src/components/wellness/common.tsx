import { useState } from "react";
import { Bell, ShieldCheck, UserRound, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge, Empty, Field, Panel, useWellness } from "./context";
import {
  accountFor,
  normalizeMobile,
  seedStore,
  today,
  uid,
  validMobile,
} from "@/lib/wellness-service";
import { languages, type Language } from "@/lib/i18n";

export function Account({ settings }: { settings: boolean }) {
  const { store, session, t, language, setLanguage, update, notify, logout, go } = useWellness();
  const person = accountFor(store, session)!;
  const patient = store.patients.find((p) => p.id === session.id);
  const [edit, setEdit] = useState(false);
  const [reset, setReset] = useState(false);
  const [deleteRequest, setDeleteRequest] = useState(false);
  const [updates, setUpdates] = useState(() => {
    try {
      return localStorage.getItem("ssw-updates") !== "false";
    } catch {
      return true;
    }
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1>{t(settings ? "Settings" : "Profile")}</h1>
          <p>
            {person.id} ·{" "}
            {t(
              person.role === "patient"
                ? "Patient"
                : person.role === "worker"
                  ? "Health Worker"
                  : person.role === "sales"
                    ? "Sales Representative"
                    : "Super Admin",
            )}
          </p>
        </div>
      </div>
      <div className="two-col">
        <Panel
          title={t("Profile")}
          action={
            <button className="btn secondary small" onClick={() => setEdit(true)}>
              {t("Edit")}
            </button>
          }
        >
          <div className="profile-hero">
            <span className="avatar large">
              {person.name
                .split(" ")
                .map((s) => s[0])
                .join("")}
            </span>
            <div>
              <h2>{person.name}</h2>
              <p>{person.mobile}</p>
              <Badge value={person.status} />
            </div>
          </div>
          <div className="details-grid">
            {[
              ["Patient ID", person.id],
              ["DOB", patient?.dob ?? "—"],
              ["Gender", patient?.gender ?? "—"],
              ["Address", person.address],
              ["State", person.state],
              ["District", person.district],
              ["PIN", patient?.pin ?? "—"],
              ["Joining date", person.joined],
            ].map(([k, v]) => (
              <div key={k}>
                <small>{t(k!)}</small>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          {patient && (
            <div className="assigned-card">
              <ShieldCheck />
              <div>
                <small>{t("Assigned worker")}</small>
                <strong>
                  {store.team.find((w) => w.id === patient.worker)?.name} · {patient.worker}
                </strong>
                <p>{store.team.find((w) => w.id === patient.worker)?.mobile}</p>
              </div>
            </div>
          )}
        </Panel>
        <div>
          <Panel title={t("Settings")}>
            <div className="form-stack">
              <Field label={t("Language")}>
                <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                  {Object.entries(languages).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="check">
                <input
                  type="checkbox"
                  checked={updates}
                  onChange={(e) => {
                    setUpdates(e.target.checked);
                    try {
                      localStorage.setItem("ssw-updates", String(e.target.checked));
                    } catch {
                      /* preference is temporary */
                    }
                  }}
                />
                {t("Notifications enabled")}
              </label>
              <button className="link-row" onClick={() => go("Privacy")}>
                <ShieldCheck />
                {t("Privacy")}
              </button>
              <button className="link-row" onClick={() => go("Terms")}>
                <ShieldCheck />
                {t("Terms")}
              </button>
              {session.role === "patient" && (
                <button className="link-row" onClick={() => go("Recovery")}>
                  <UserRound />
                  {t("Recovery")}
                </button>
              )}
              <button className="btn secondary" onClick={logout}>
                {t("Logout")}
              </button>
              {session.role === "admin" && (
                <button className="text-btn danger" onClick={() => setReset(true)}>
                  {t("Reset")}
                </button>
              )}
              <button className="text-btn danger" onClick={() => setDeleteRequest(true)}>
                Request account deletion · Demo
              </button>
            </div>
          </Panel>
        </div>
      </div>
      {session.role === "admin" && (
        <Panel title={t("Survey categories")}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const text = String(new FormData(e.currentTarget).get("conditions"));
              const conditions = [
                ...new Set(
                  text
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                ),
              ];
              if (!conditions.length || conditions.length > 20) {
                notify(t("Invalid"));
                return;
              }
              update((s) => ({ ...s, rules: { ...s.rules, conditions } }));
              notify(t("Saved"));
            }}
          >
            <Field label={t("Conditions")}>
              <textarea
                name="conditions"
                defaultValue={store.rules.conditions.join("\n")}
                required
                maxLength={2000}
                rows={5}
              />
            </Field>
            <p className="muted">One condition per line. Existing survey answers are retained.</p>
            <button className="btn">{t("Save")}</button>
          </form>
        </Panel>
      )}
      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent>
          <DialogTitle>{t("Edit")}</DialogTitle>
          <DialogDescription>
            Patient ID, mobile and worker assignment cannot be changed here.
          </DialogDescription>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const details = {
                name: String(f.get("name")).trim(),
                address: String(f.get("address")),
                state: String(f.get("state")),
                district: String(f.get("district")),
              };
              if (!details.name) {
                notify(t("Invalid"));
                return;
              }
              update((s) =>
                session.role === "patient"
                  ? {
                      ...s,
                      patients: s.patients.map((p) =>
                        p.id === session.id ? { ...p, ...details } : p,
                      ),
                    }
                  : {
                      ...s,
                      team: s.team.map((p) => (p.id === session.id ? { ...p, ...details } : p)),
                    },
              );
              setEdit(false);
              notify(t("Saved"));
            }}
          >
            {[
              ["Name", "name"],
              ["Address", "address"],
              ["State", "state"],
              ["District", "district"],
            ].map(([label, name]) => (
              <Field key={name} label={t(label!)}>
                <input
                  name={name}
                  defaultValue={(person as unknown as Record<string, string>)[name!]}
                  required
                  maxLength={150}
                />
              </Field>
            ))}
            <button className="btn">{t("Save")}</button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={reset} onOpenChange={setReset}>
        <DialogContent>
          <DialogTitle>{t("Reset")}</DialogTitle>
          <DialogDescription>
            This removes all changes to fictional local demo records. It does not affect any
            backend.
          </DialogDescription>
          <button
            className="btn danger"
            onClick={() => {
              update(() => seedStore());
              setReset(false);
              logout();
            }}
          >
            {t("Reset")}
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteRequest} onOpenChange={setDeleteRequest}>
        <DialogContent>
          <DialogTitle>Account deletion request</DialogTitle>
          <DialogDescription>
            Demo only: this request is recorded for administrator review. Production deletion and
            retention need a reviewed backend policy.
          </DialogDescription>
          <button
            className="btn danger"
            onClick={() => {
              update((s) => ({
                ...s,
                audit: [
                  {
                    id: uid("AUD"),
                    date: today(),
                    actor: session.id,
                    action: "Account deletion requested",
                    reason: "Demo request pending administrator review",
                  },
                  ...s.audit,
                ],
              }));
              setDeleteRequest(false);
              notify(t("Saved"));
            }}
          >
            {t("Send request")}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Notifications() {
  const { store, session, t, update } = useWellness();
  const [filter, setFilter] = useState("all");
  const rows = store.notices.filter(
    (n) => n.userId === session.id && (filter === "all" || !n.read),
  );
  const read = (id?: string) =>
    update((s) => ({
      ...s,
      notices: s.notices.map((n) =>
        n.userId === session.id && (!id || id === n.id) ? { ...n, read: true } : n,
      ),
    }));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">UPDATES & REMINDERS</span>
          <h1>{t("Notifications")}</h1>
          <p>Care activity, registrations, orders and incentives.</p>
        </div>
        <button className="btn secondary" onClick={() => read()}>
          {t("Mark read")}
        </button>
      </div>
      <Panel title={t("Notifications")}>
        <div className="toolbar">
          <select
            aria-label={t("Status")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{t("All")}</option>
            <option value="unread">{t("Unread")}</option>
          </select>
        </div>
        {rows.map((n) => (
          <button
            className={`notification-row ${n.read ? "read" : ""}`}
            key={n.id}
            onClick={() => read(n.id)}
          >
            <span className="notification-symbol">
              <Bell size={20} />
            </span>
            <div>
              <strong>{t(n.title)}</strong>
              <p>{n.detail}</p>
            </div>
            <small>{n.date}</small>
            {!n.read && <i />}
          </button>
        ))}
        {!rows.length && <Empty />}
      </Panel>
    </>
  );
}

export function Support() {
  const { session, t, update, notify } = useWellness();
  const [sent, setSent] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">WE'RE HERE TO HELP</span>
          <h1>{t("Support")}</h1>
          <p>Guidance for the fictional demo workspace.</p>
        </div>
      </div>
      <div className="support-banner">
        <HelpCircle size={40} />
        <div>
          <h2>Connected care, made simple.</h2>
          <p>
            For real medical concerns, contact your healthcare provider. This prototype does not
            provide clinical advice.
          </p>
        </div>
      </div>
      <div className="two-col">
        <Panel title="Frequently asked questions">
          {[
            [
              "How do I restore my account?",
              "Log out and log in with the same demo mobile number and OTP 123456. Your Patient ID, assigned worker, surveys and orders will be restored in this browser. Clearing browser storage removes the simulation.",
            ],
            [
              "Can I change my health worker?",
              "Your worker is linked by explicit registration reference. Only the demo administrator can reassign you with a recorded reason.",
            ],
            [
              "Are payments real?",
              "All online methods simulate success without collecting payment credentials. Cash on delivery remains pending. No money is transferred.",
            ],
            [
              "How do incentives work?",
              "Verified registrations are eligible under administrator-configured rules. A patient can create at most one incentive record. App installation alone is not eligible.",
            ],
            [
              "Is this an Android app?",
              "The responsive frontend is ready for future Capacitor packaging. Android builds, OTP, payments and permanent records require the next implementation phase.",
            ],
          ].map(([question, answer]) => (
            <details className="faq" key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </Panel>
        <Panel title={t("Support message")}>
          {sent ? (
            <div className="success-state">
              <ShieldCheck />
              <h2>{t("Saved")}</h2>
              <p>
                Your demo request is recorded locally. No message was sent to a real support team.
              </p>
            </div>
          ) : (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                update((s) => ({
                  ...s,
                  audit: [
                    {
                      id: uid("SUP"),
                      date: today(),
                      actor: session.id,
                      action: "Support request",
                      reason: String(f.get("message")),
                    },
                    ...s.audit,
                  ],
                }));
                setSent(true);
                notify(t("Saved"));
              }}
            >
              <Field label={t("Support message")}>
                <textarea name="message" required minLength={10} maxLength={2000} rows={5} />
              </Field>
              <button className="btn">{t("Send request")}</button>
              <p className="notice">Saved in the demo only; no email or SMS is sent.</p>
            </form>
          )}
        </Panel>
      </div>
    </>
  );
}

export function Policy({ kind }: { kind: string }) {
  const { t } = useWellness();
  const privacy = kind === "Privacy";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PHASE 1 DEMO POLICY</span>
          <h1>{t(kind)}</h1>
          <p>Prototype information · Updated 12 October 2026</p>
        </div>
      </div>
      <Panel title={t(kind)}>
        <div className="prose">
          <p>
            This application is a frontend demonstration for Shri Shubhra Wellness Private Limited.
            These demo notices are not finalized production legal terms.
          </p>
          {privacy ? (
            <>
              <h3>Fictional data and local storage</h3>
              <p>
                Use fictional details only. The demo stores profiles, consented surveys, worker
                assignments, orders and audit entries in this browser's local storage. The session
                is kept in session storage. Language and notification preferences may also be saved
                locally. No centralized medical database is connected. Clearing browser data
                permanently removes the simulation.
              </p>
              <h3>Consent and access</h3>
              <p>
                Health surveys require explicit patient consent. Demo views restrict health
                information to the patient, their assigned worker and the administrator. Sales
                representatives receive customer contact and order information only. Frontend guards
                are a demonstration and are not production authorization.
              </p>
              <h3>Identity, payments and Aadhaar</h3>
              <p>
                No real OTP, payment, Aadhaar verification, card or bank account information is
                collected. Do not enter Aadhaar numbers, images or real health records.
              </p>
              <h3>Recovery, deletion and retention</h3>
              <p>
                Recovery and account deletion requests are simulated review requests. A future
                backend must implement identity verification, documented retention, deletion
                policies, encryption and access audit controls before handling real users.
                Production privacy terms and applicable legal obligations must be reviewed before
                launch.
              </p>
            </>
          ) : (
            <>
              <h3>Use of the prototype</h3>
              <p>
                Use this prototype to evaluate navigation and workflows with fictional data. Demo
                authentication does not grant production permissions. Registration restoration
                applies only to the current browser's stored simulation.
              </p>
              <h3>Products and clinical information</h3>
              <p>
                Catalogue details, ingredients, prices and stock are illustrative. Products make no
                treatment or cure claims. This application does not replace advice from a qualified
                healthcare practitioner.
              </p>
              <h3>Simulated orders and incentives</h3>
              <p>
                No real purchase, shipment, incentive payout or payment occurs. Demo rates are
                configurable examples. Incentive eligibility is based on verification and configured
                approval rules, never merely on installing an app.
              </p>
              <h3>Future production service</h3>
              <p>
                Production terms, refund and shipping policies, support contacts, authorization and
                data retention will need approval and implementation before public use. Android
                publishing is a future deployment step.
              </p>
            </>
          )}
        </div>
      </Panel>
    </>
  );
}

export function Recovery() {
  const { store, session, t, update, notify } = useWellness();
  const [decision, setDecision] = useState("");
  function resolve(id: string, status: string, reason: string) {
    if (!reason.trim()) {
      notify(t("Invalid"));
      return;
    }
    const success = update((s) => {
      const r = s.recovery.find((r) => r.id === id);
      if (!r || session.role !== "admin") throw new Error("Access denied");
      if (
        status === "Approved" &&
        [...s.patients, ...s.team].some((p) => p.mobile === r.mobile && p.id !== r.patientId)
      )
        throw new Error("Mobile number is already registered");
      return {
        ...s,
        recovery: s.recovery.map((x) => (x.id === id ? { ...x, status } : x)),
        patients:
          status === "Approved"
            ? s.patients.map((p) => (p.id === r.patientId ? { ...p, mobile: r.mobile } : p))
            : s.patients,
        audit: [
          {
            id: uid("AUD"),
            date: today(),
            actor: session.id,
            action: `Recovery ${r.patientId}: ${status}`,
            reason: `Demo identity review: ${reason}`,
          },
          ...s.audit,
        ],
      };
    });
    if (success) {
      setDecision("");
      notify(t("Saved"));
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT CONTINUITY</span>
          <h1>{t("Recovery")}</h1>
          <p>{t("Recovery note")}</p>
        </div>
      </div>
      {session.role === "patient" && (
        <Panel title={t("Recovery")}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const mobile = normalizeMobile(String(f.get("mobile")));
              if (
                !validMobile(mobile) ||
                store.recovery.some((r) => r.patientId === session.id && r.status === "Pending")
              ) {
                notify(t("Invalid"));
                return;
              }
              update((s) => ({
                ...s,
                recovery: [
                  ...s.recovery,
                  {
                    id: uid("REC"),
                    patientId: session.id,
                    mobile,
                    reason: String(f.get("reason")),
                    date: today(),
                    status: "Pending",
                  },
                ],
              }));
              notify(t("Saved"));
              e.currentTarget.reset();
            }}
          >
            <Field label={t("Mobile")}>
              <input
                name="mobile"
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                inputMode="tel"
              />
            </Field>
            <Field label={t("Reason")}>
              <textarea name="reason" required minLength={5} maxLength={500} />
            </Field>
            <button className="btn">{t("Send request")}</button>
          </form>
        </Panel>
      )}
      <Panel title={t("Recovery")}>
        {store.recovery
          .filter((r) => session.role === "admin" || r.patientId === session.id)
          .map((r) => (
            <div className="list-row" key={r.id}>
              <div>
                <strong>
                  {r.patientId} · {r.mobile}
                </strong>
                <p>{r.reason}</p>
                <small>{r.date}</small>
              </div>
              <Badge value={r.status} />
              {session.role === "admin" && r.status === "Pending" && (
                <button className="btn secondary small" onClick={() => setDecision(r.id)}>
                  {t("Review")}
                </button>
              )}
            </div>
          ))}
        {!store.recovery.some((r) => session.role === "admin" || r.patientId === session.id) && (
          <Empty />
        )}
      </Panel>
      <Dialog
        open={Boolean(decision)}
        onOpenChange={(open) => {
          if (!open) setDecision("");
        }}
      >
        <DialogContent>
          <DialogTitle>{t("Review")}</DialogTitle>
          <DialogDescription>
            Simulated identity review only. Production recovery needs backend identity verification.
          </DialogDescription>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              resolve(decision, String(f.get("status")), String(f.get("reason")));
            }}
          >
            <Field label={t("Status")}>
              <select name="status">
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </Field>
            <Field label={t("Reason")}>
              <textarea name="reason" required minLength={5} />
            </Field>
            <label className="check">
              <input required type="checkbox" />I confirm this is a fictional demo identity review
            </label>
            <button className="btn">{t("Save")}</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
