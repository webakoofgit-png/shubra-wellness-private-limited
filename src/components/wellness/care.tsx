import { useState } from "react";
import { Plus, Copy, ClipboardList, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge, Empty, Field, Panel, csvDownload, useWellness } from "./context";
import { PatientForm, type RegistrationInput } from "./patient-form";
import {
  addNotice,
  assignPatient,
  ensureEligibility,
  money,
  normalizeMobile,
  registerPatient,
  today,
  uid,
  validMobile,
  visiblePatients,
  visibleSurveys,
  type PatientRecord,
  type Person,
  type Survey,
} from "@/lib/wellness-service";

export function Patients() {
  const { store, session, t, update, notify, go } = useWellness();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<PatientRecord | null>(null);
  const [register, setRegister] = useState(false);
  const rows = visiblePatients(store, session).filter(
    (p) =>
      `${p.id} ${p.name} ${p.mobile} ${p.district}`.toLowerCase().includes(search.toLowerCase()) &&
      (!status || p.status === status),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CARE NETWORK</span>
          <h1>{t("Patients")}</h1>
          <p>
            {session.role === "worker"
              ? `${session.id} · ${t("Assigned worker")}`
              : session.role === "sales"
                ? "Customer contact details only. Health records are excluded."
                : "Fictional patient registrations and care connections."}
          </p>
        </div>
        {session.role !== "sales" && (
          <button className="btn" onClick={() => setRegister(true)}>
            <Plus size={17} />
            {t("Register")}
          </button>
        )}
      </div>
      <Panel title={t("Patients")}>
        <div className="toolbar">
          <input
            aria-label={t("Search")}
            placeholder={`${t("Search")} · ID / ${t("Name")}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label={t("Status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("All")}</option>
            <option value="Active">{t("Active")}</option>
            <option value="Pending">{t("Pending")}</option>
            <option value="Inactive">{t("Inactive")}</option>
          </select>
          <span className="muted">
            {rows.length} {t("Patients")}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Patient ID",
                  "Name",
                  "Mobile",
                  "District",
                  "Registration date",
                  "Assigned worker",
                  "Status",
                ].map((k) => (
                  <th key={k}>{t(k)}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="id">{p.id}</td>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.mobile}</td>
                  <td>{p.district}</td>
                  <td>{p.joined}</td>
                  <td>{p.worker}</td>
                  <td>
                    <Badge value={p.status} />
                  </td>
                  <td>
                    <button className="text-btn" onClick={() => setSelected(p)}>
                      {t("Details")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty />}
        </div>
      </Panel>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {selected?.name} · {selected?.id}
          </DialogTitle>
          <DialogDescription>Fictional demo account</DialogDescription>
          {selected && (
            <>
              <div className="details-grid">
                {[
                  ["Mobile", selected.mobile],
                  ["Address", selected.address],
                  ["State", selected.state],
                  ["District", selected.district],
                  ["Assigned worker", selected.worker],
                  ["Registration date", selected.joined],
                ].map(([k, v]) => (
                  <div key={k}>
                    <small>{t(k!)}</small>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
              {session.role !== "sales" && (
                <div>
                  <h3>{t("Surveys")}</h3>
                  {store.surveys
                    .filter((s) => s.patientId === selected.id)
                    .map((s) => (
                      <p key={s.id}>
                        {s.date} · {t(s.status)} · {s.workerId}
                      </p>
                    ))}
                  <button className="btn secondary" onClick={() => go("Surveys")}>
                    {t("Surveys")}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
              <h3>{t("Orders")}</h3>
              {store.orders
                .filter((o) => o.patientId === selected.id)
                .map((o) => (
                  <p key={o.id}>
                    {o.id} · {money(o.amount)} · {t(o.status)}
                  </p>
                ))}
              {session.role === "admin" && (
                <button
                  className="btn secondary"
                  onClick={() => {
                    update((s) => ({
                      ...s,
                      patients: s.patients.map((p) =>
                        p.id === selected.id
                          ? { ...p, status: p.status === "Active" ? "Inactive" : "Active" }
                          : p,
                      ),
                    }));
                    setSelected(null);
                    notify(t("Saved"));
                  }}
                >
                  {t(selected.status === "Active" ? "Deactivate" : "Activate")}
                </button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={register} onOpenChange={setRegister}>
        <DialogContent className="wide-dialog">
          <DialogTitle>{t("Register")}</DialogTitle>
          <DialogDescription>{t("OTP note")}</DialogDescription>
          <Registration onComplete={() => setRegister(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Registration({ onComplete }: { onComplete?: () => void }) {
  const { store, session, t, update, notify } = useWellness();
  const [input, setInput] = useState<RegistrationInput | null>(null);
  const [otp, setOtp] = useState("");
  const [result, setResult] = useState("");
  const worker =
    session.role === "worker"
      ? session.id
      : (store.team.find((p) => p.role === "worker" && p.status === "Active")?.id ?? "");
  const reference = `REF-${worker}`;
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/?ref=${reference}`;
  return (
    <div className="form-stack">
      {!onComplete && (
        <div className="page-heading">
          <div>
            <h1>{t("Register")}</h1>
            <p>{t("OTP note")}</p>
          </div>
        </div>
      )}
      <div className="notice">
        <strong>
          {t("Reference")}: {reference}
        </strong>
        <p>
          {t("Registration link")}: <a href={link}>{link}</a>
        </p>
        <button
          className="text-btn"
          onClick={() => {
            navigator.clipboard
              ?.writeText(link)
              .then(() => notify(t("Saved")))
              .catch(() => notify(link));
          }}
        >
          <Copy size={15} />
          {t("Copy link")}
        </button>
      </div>
      {result ? (
        <div className="success-state">
          <ClipboardList size={35} />
          <h2>{t("Completed")}</h2>
          <p>{result}</p>
          <button
            className="btn"
            onClick={() => {
              setResult("");
              setInput(null);
              setOtp("");
              onComplete?.();
            }}
          >
            {t("Close")}
          </button>
        </div>
      ) : input ? (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (otp !== "123456") {
              notify(t("Invalid"));
              return;
            }
            try {
              const r = registerPatient(store, input);
              update(() => r.store);
              setResult(
                `${t(r.restored ? "Restore" : "Success")} · ${r.patient.id} · ${r.patient.worker}`,
              );
            } catch (error) {
              notify(error instanceof Error ? t(error.message) : t("Invalid"));
            }
          }}
        >
          <div className="steps">
            <span className="active">{t("Pending OTP")}</span>
            <span>{t("Verified")}</span>
            <span>{t("Completed")}</span>
          </div>
          <p>
            {input.name} · {input.mobile}
          </p>
          <Field label={t("OTP")}>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </Field>
          <button className="btn">{t("Verify")}</button>
          <button className="text-btn" type="button" onClick={() => setInput(null)}>
            {t("Back")}
          </button>
        </form>
      ) : (
        <PatientForm
          t={t}
          reference={reference}
          workers={store.team.filter(
            (w) =>
              w.role === "worker" &&
              w.status === "Active" &&
              (session.role !== "worker" || w.id === session.id),
          )}
          onSave={setInput}
        />
      )}
    </div>
  );
}

export function Surveys() {
  const { store, session, t, update, notify } = useWellness();
  const [create, setCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<Survey | null>(null);
  const rows = visibleSurveys(store, session).filter(
    (s) =>
      `${s.id} ${s.patientId} ${store.patients.find((p) => p.id === s.patientId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!status || s.status === status),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONSENT-BASED CARE</span>
          <h1>{t("Surveys")}</h1>
          <p>
            Fictional health information, visible only to the patient, assigned worker and demo
            administrator.
          </p>
        </div>
        {session.role !== "patient" && (
          <button className="btn" onClick={() => setCreate(true)}>
            <Plus size={17} />
            {t("New survey")}
          </button>
        )}
      </div>
      <Panel title={t("Surveys")}>
        <div className="toolbar">
          <input
            aria-label={t("Search")}
            placeholder={t("Search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label={t("Status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("All")}</option>
            <option value="Completed">{t("Completed")}</option>
            <option value="In review">{t("In review")}</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["Patient ID", "Name", "Registration date", "Worker", "Status", "Details"].map(
                  (k) => (
                    <th key={k}>{t(k)}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="id">{s.patientId}</td>
                  <td>{store.patients.find((p) => p.id === s.patientId)?.name}</td>
                  <td>{s.date}</td>
                  <td>{s.workerId}</td>
                  <td>
                    <Badge value={s.status} />
                  </td>
                  <td>
                    <button className="text-btn" onClick={() => setDetail(s)}>
                      {t("Details")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty />}
        </div>
      </Panel>
      <Dialog open={create} onOpenChange={setCreate}>
        <DialogContent className="wide-dialog">
          <DialogTitle>{t("New survey")}</DialogTitle>
          <DialogDescription>
            Consent is required before any health details are collected.
          </DialogDescription>
          <SurveyForm onComplete={() => setCreate(false)} />
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{detail?.id}</DialogTitle>
          <DialogDescription>
            {detail?.patientId} · {detail?.workerId}
          </DialogDescription>
          {detail && (
            <>
              <dl className="details-grid">
                {[
                  ["Conditions", detail.conditions.join(", ") || "None reported"],
                  ["Medication", detail.medication],
                  ["Notes", detail.notes],
                  ["Status", t(detail.status)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{t(k!)}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="notice">
                {t("Consent")} · {detail.date}
              </p>
              {session.role === "admin" && detail.status !== "Completed" && (
                <button
                  className="btn"
                  onClick={() => {
                    update((s) =>
                      ensureEligibility(
                        {
                          ...s,
                          surveys: s.surveys.map((row) =>
                            row.id === detail.id ? { ...row, status: "Completed" } : row,
                          ),
                        },
                        detail.patientId,
                      ),
                    );
                    setDetail(null);
                    notify(t("Saved"));
                  }}
                >
                  {t("Approve")}
                </button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function SurveyForm({ onComplete }: { onComplete: () => void }) {
  const { store, session, t, update, notify } = useWellness();
  const patients = visiblePatients(store, session).filter((p) => p.status === "Active");
  const [formError, setFormError] = useState("");
  const [step, setStep] = useState(1);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [consent, setConsent] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [medication, setMedication] = useState("");
  const [notes, setNotes] = useState("");
  const patient = patients.find((p) => p.id === patientId);
  return (
    <div className="form-stack">
      {formError && (
        <p role="alert" className="error">
          {formError}
        </p>
      )}
      <div className="steps">
        {["Basic information", "Health information", "Review", "Success"].map((s, i) => (
          <span key={s} className={step === i + 1 ? "active" : ""}>
            {i + 1}. {t(s)}
          </span>
        ))}
      </div>
      {step === 1 && (
        <>
          <Field label={t("Patient")}>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.id}
                </option>
              ))}
            </select>
          </Field>
          {patient && (
            <div className="details-grid">
              {[
                ["Mobile", patient.mobile],
                ["DOB", patient.dob],
                ["Gender", patient.gender],
                ["Address", patient.address],
                ["State", patient.state],
                ["District", patient.district],
                ["PIN", patient.pin],
              ].map(([k, v]) => (
                <div key={k}>
                  <small>{t(k!)}</small>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>{t("Consent")}</span>
          </label>
          <button
            className="btn"
            onClick={() => {
              if (!patient || !consent) {
                setFormError(t("Consent required"));
                return;
              }
              setFormError("");
              setStep(2);
            }}
          >
            {t("Continue")}
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <Field label={t("Conditions")}>
            <div className="condition-options">
              {store.rules.conditions.map((c) => (
                <label className="check" key={c}>
                  <input
                    type="checkbox"
                    checked={conditions.includes(c)}
                    onChange={(e) =>
                      setConditions(
                        e.target.checked ? [...conditions, c] : conditions.filter((x) => x !== c),
                      )
                    }
                  />
                  {t(c)}
                </label>
              ))}
            </div>
          </Field>
          <Field label={t("Medication")}>
            <textarea
              maxLength={1000}
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
            />
          </Field>
          <Field label={t("Notes")}>
            <textarea maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="button-row">
            <button className="btn secondary" onClick={() => setStep(1)}>
              {t("Back")}
            </button>
            <button className="btn" onClick={() => setStep(3)}>
              {t("Review")}
            </button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <div className="details-grid">
            {[
              ["Patient", `${patient?.name} · ${patientId}`],
              ["Worker", patient?.worker ?? ""],
              ["Conditions", conditions.join(", ") || "None reported"],
              ["Medication", medication || "None reported"],
              ["Notes", notes || "None"],
              ["Consent", t("Verified")],
            ].map(([k, v]) => (
              <div key={k}>
                <small>{t(k!)}</small>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <div className="button-row">
            <button className="btn secondary" onClick={() => setStep(2)}>
              {t("Back")}
            </button>
            <button
              className="btn"
              onClick={() => {
                if (!patient || !consent) return;
                const survey: Survey = {
                  id: uid("SUR"),
                  patientId,
                  workerId: session.role === "worker" ? session.id : patient.worker,
                  date: today(),
                  conditions,
                  medication,
                  notes,
                  consent,
                  status: "In review",
                };
                update((s) => ({ ...s, surveys: [survey, ...s.surveys] }));
                setStep(4);
              }}
            >
              {t("Save")}
            </button>
          </div>
        </>
      )}
      {step === 4 && (
        <div className="success-state">
          <ClipboardList size={38} />
          <h2>{t("Success")}</h2>
          <p>
            {patient?.name} · {t("Pending")}
          </p>
          <button className="btn" onClick={onComplete}>
            {t("Close")}
          </button>
        </div>
      )}
    </div>
  );
}

export function Assignments() {
  const { store, session, t, update, notify } = useWellness();
  const [search, setSearch] = useState("");
  const [reassign, setReassign] = useState<PatientRecord | null>(null);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EXPLICIT REGISTRATION ATTRIBUTION</span>
          <h1>{t("Assignments")}</h1>
          <p>
            One primary worker per patient. Existing incentive attribution stays with the
            originating worker.
          </p>
        </div>
      </div>
      <Panel title={t("Assignments")}>
        <div className="toolbar">
          <input
            placeholder={t("Search")}
            aria-label={t("Search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {["Patient ID", "Name", "Assigned worker", "Reference", "Reassign"].map((k) => (
                  <th key={k}>{t(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {store.patients
                .filter((p) =>
                  `${p.id} ${p.name} ${p.worker}`.toLowerCase().includes(search.toLowerCase()),
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td className="id">{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.worker}</td>
                    <td>{p.reference}</td>
                    <td>
                      <button className="text-btn" onClick={() => setReassign(p)}>
                        {t("Reassign")}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title={t("Audit history")}>
        {store.audit.length ? (
          store.audit.map((a) => (
            <div className="list-row" key={a.id}>
              <div>
                <strong>{a.action}</strong>
                <p>{a.reason}</p>
              </div>
              <small>
                {a.date} · {a.actor}
              </small>
            </div>
          ))
        ) : (
          <Empty />
        )}
      </Panel>
      <Dialog
        open={Boolean(reassign)}
        onOpenChange={(open) => {
          if (!open) setReassign(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {t("Reassign")} · {reassign?.id}
          </DialogTitle>
          <DialogDescription>{t("Reason")} · required</DialogDescription>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!reassign) return;
              const f = new FormData(e.currentTarget);
              try {
                const next = assignPatient(
                  store,
                  session,
                  reassign.id,
                  String(f.get("worker")),
                  String(f.get("reason")),
                );
                update(() => next);
                setReassign(null);
                notify(t("Saved"));
              } catch (error) {
                notify(error instanceof Error ? t(error.message) : t("Invalid"));
              }
            }}
          >
            <Field label={t("Worker")}>
              <select name="worker" required>
                {store.team
                  .filter(
                    (w) =>
                      w.role === "worker" && w.status === "Active" && w.id !== reassign?.worker,
                  )
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} · {w.id}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label={t("Reason")}>
              <textarea name="reason" minLength={3} maxLength={500} required />
            </Field>
            <button className="btn">{t("Save")}</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Team({ kind }: { kind: "worker" | "sales" }) {
  const { store, session, t, update, notify, go } = useWellness();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Person | null>(null);
  const [open, setOpen] = useState(false);
  const rows = store.team.filter(
    (p) =>
      p.role === kind &&
      `${p.id} ${p.name} ${p.mobile}`.toLowerCase().includes(search.toLowerCase()) &&
      (!status || p.status === status),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PEOPLE & ACCESS</span>
          <h1>{t(kind === "worker" ? "Workers" : "Sales")}</h1>
          <p>Manage fictional team members, account status and regional assignments.</p>
        </div>
        <button
          className="btn"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={17} />
          {t(kind === "worker" ? "Add worker" : "Add sales")}
        </button>
      </div>
      <Panel title={t(kind === "worker" ? "Workers" : "Sales")}>
        <div className="toolbar">
          <input
            placeholder={t("Search")}
            aria-label={t("Search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label={t("Status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("All")}</option>
            <option value="Active">{t("Active")}</option>
            <option value="Inactive">{t("Inactive")}</option>
          </select>
        </div>
        <div className="team-grid">
          {rows.map((p) => (
            <article className="team-card" key={p.id}>
              <span className="avatar large">
                {p.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")}
              </span>
              <h3>{p.name}</h3>
              <p>
                {p.id} · {p.mobile}
              </p>
              <p>
                {p.district}, {p.state}
              </p>
              <Badge value={p.status} />
              <div className="button-row">
                <button
                  className="btn secondary small"
                  onClick={() => {
                    setEditing(p);
                    setOpen(true);
                  }}
                >
                  {t("Edit")}
                </button>
                <button
                  className="text-btn"
                  onClick={() => {
                    if (
                      p.status === "Active" &&
                      kind === "worker" &&
                      store.patients.some((x) => x.worker === p.id && x.status === "Active")
                    ) {
                      notify("Reassign active patients before deactivating this worker");
                      return;
                    }
                    update((s) => ({
                      ...s,
                      team: s.team.map((x) =>
                        x.id === p.id
                          ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" }
                          : x,
                      ),
                      audit: [
                        {
                          id: uid("AUD"),
                          date: today(),
                          actor: session.id,
                          action: `Team status ${p.id}`,
                          reason: p.status === "Active" ? "Deactivated" : "Activated",
                        },
                        ...s.audit,
                      ],
                    }));
                    notify(t("Saved"));
                  }}
                >
                  {t(p.status === "Active" ? "Deactivate" : "Activate")}
                </button>
              </div>
              {kind === "worker" && (
                <div className="mini-metrics">
                  <button onClick={() => go("Assignments")}>
                    {store.patients.filter((x) => x.worker === p.id).length} {t("Patients")}
                  </button>
                  <button onClick={() => go("Surveys")}>
                    {store.surveys.filter((x) => x.workerId === p.id).length} {t("Surveys")}
                  </button>
                  <button onClick={() => go("Incentives")}>
                    {money(
                      store.incentives
                        .filter((x) => x.workerId === p.id)
                        .reduce((sum, i) => sum + i.amount, 0),
                    )}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
        {!rows.length && <Empty />}
      </Panel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>
            {t(editing ? "Edit" : kind === "worker" ? "Add worker" : "Add sales")}
          </DialogTitle>
          <DialogDescription>Fictional demo team account</DialogDescription>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const mobile = normalizeMobile(String(f.get("mobile")));
              if (
                !validMobile(mobile) ||
                [...store.team, ...store.patients].some(
                  (p) => p.mobile === mobile && p.id !== editing?.id,
                )
              ) {
                notify(t("Invalid"));
                return;
              }
              const row: Person = {
                id: editing?.id ?? uid(kind === "worker" ? "HW" : "SR"),
                role: kind,
                name: String(f.get("name")).trim(),
                mobile,
                address: String(f.get("address")),
                district: String(f.get("district")),
                state: String(f.get("state")),
                joined: editing?.joined ?? today(),
                status: editing?.status ?? "Active",
              };
              update((s) => ({
                ...s,
                team: editing
                  ? s.team.map((p) => (p.id === editing.id ? row : p))
                  : [...s.team, row],
              }));
              setOpen(false);
              notify(t("Saved"));
            }}
          >
            <div className="form-grid">
              {[
                ["Name", "name"],
                ["Mobile", "mobile"],
                ["Address", "address"],
                ["State", "state"],
                ["District", "district"],
              ].map(([label, name]) => (
                <Field key={name} label={t(label!)}>
                  <input
                    name={name}
                    defaultValue={
                      editing
                        ? (editing as unknown as Record<string, string>)[name!]
                        : name === "state"
                          ? "Maharashtra"
                          : ""
                    }
                    required
                    maxLength={name === "mobile" ? 10 : 120}
                    pattern={name === "mobile" ? "[6-9][0-9]{9}" : undefined}
                  />
                </Field>
              ))}
            </div>
            <button className="btn">{t("Save")}</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Incentives() {
  const { store, session, t, update, notify } = useWellness();
  const [worker, setWorker] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pay, setPay] = useState("");
  const admin = session.role === "admin";
  const rows = store.incentives.filter(
    (i) =>
      (admin || i.workerId === session.id) &&
      (!worker || i.workerId === worker) &&
      (!status || i.approval === status || i.payment === status) &&
      (!from || i.date >= from) &&
      (!to || i.date <= to),
  );
  const total = (predicate: (i: (typeof rows)[number]) => boolean) =>
    rows.filter(predicate).reduce((sum, i) => sum + i.amount, 0);
  function approve(id: string, status: string, reference = "") {
    const success = update((s) => {
      const row = s.incentives.find((i) => i.id === id);
      if (!row || !admin || row.payment === "Paid") throw new Error("Access denied");
      const p = s.patients.find((p) => p.id === row.patientId);
      if (
        status === "Approved" &&
        (!p?.verified ||
          (s.rules.requireSurvey &&
            !s.surveys.some((x) => x.patientId === p.id && x.consent && x.status === "Completed")))
      )
        throw new Error("Registration is not eligible");
      if (status === "Paid" && (row.approval !== "Approved" || !reference.trim()))
        throw new Error("Approval and payment reference are required");
      let next = {
        ...s,
        incentives: s.incentives.map((i) =>
          i.id === id
            ? {
                ...i,
                approval: status === "Paid" ? i.approval : status,
                payment: status === "Paid" ? "Paid" : i.payment,
                reference: status === "Paid" ? reference : i.reference,
                paidDate: status === "Paid" ? today() : i.paidDate,
              }
            : i,
        ),
        audit: [
          {
            id: uid("AUD"),
            actor: session.id,
            date: today(),
            action: `${id}: ${status}`,
            reason: reference || status,
          },
          ...s.audit,
        ],
      };
      next = addNotice(
        next,
        row.workerId,
        status === "Paid"
          ? "Incentive Paid"
          : status === "Rejected"
            ? "Incentive Rejected"
            : "Incentive Approved",
        `${id} · ${money(row.amount)}`,
      );
      return next;
    });
    if (success) notify(t("Saved"));
    return success;
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">VERIFICATION · ELIGIBILITY · APPROVAL</span>
          <h1>{t("Incentives")}</h1>
          <p>
            Eligible verified registrations only. Recorded rates are snapshots; rule changes apply
            to new eligible registrations.
          </p>
        </div>
        <button
          className="btn secondary"
          onClick={() =>
            csvDownload("incentives", [
              [
                "ID",
                "Patient",
                "Worker",
                "Date",
                "Amount",
                "Approval",
                "Payment",
                "Reference",
                "Paid date",
              ],
              ...rows.map((i) => [
                i.id,
                i.patientId,
                i.workerId,
                i.date,
                i.amount,
                i.approval,
                i.payment,
                i.reference,
                i.paidDate,
              ]),
            ])
          }
        >
          {t("Export")}
        </button>
      </div>
      <div className="metric-grid">
        <div className="metric">
          <small>{t("Eligible registrations")}</small>
          <strong>{rows.length}</strong>
        </div>
        <div className="metric">
          <small>{t("Earned")}</small>
          <strong>{money(total((i) => i.approval !== "Rejected"))}</strong>
        </div>
        <div className="metric">
          <small>{t("Approved")}</small>
          <strong>{money(total((i) => i.approval === "Approved"))}</strong>
        </div>
        <div className="metric">
          <small>{t("Paid amount")}</small>
          <strong>{money(total((i) => i.payment === "Paid"))}</strong>
        </div>
        <div className="metric">
          <small>{t("Pending amount")}</small>
          <strong>{money(total((i) => i.approval !== "Rejected" && i.payment !== "Paid"))}</strong>
        </div>
      </div>
      {admin && (
        <Panel title={t("Settings")}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const rate = Number(f.get("rate"));
              if (!Number.isFinite(rate) || rate < 0) {
                notify(t("Invalid"));
                return;
              }
              update((s) => ({
                ...s,
                rules: {
                  ...s.rules,
                  rate,
                  requireSurvey: f.get("survey") === "on",
                  requireApproval: f.get("approval") === "on",
                },
                audit: [
                  {
                    id: uid("AUD"),
                    date: today(),
                    actor: session.id,
                    action: "Incentive rules updated",
                    reason: `Rate ${rate}`,
                  },
                  ...s.audit,
                ],
              }));
              notify(t("Saved"));
            }}
          >
            <Field label={t("Rate")}>
              <input
                name="rate"
                type="number"
                min={0}
                max={100000}
                step="0.01"
                defaultValue={store.rules.rate}
                required
              />
            </Field>
            <label className="check">
              <input type="checkbox" name="survey" defaultChecked={store.rules.requireSurvey} />
              {t("Require survey")}
            </label>
            <label className="check">
              <input type="checkbox" name="approval" defaultChecked={store.rules.requireApproval} />
              {t("Require approval")}
            </label>
            <button className="btn">{t("Save")}</button>
          </form>
        </Panel>
      )}
      <Panel title={t("Incentives")}>
        <div className="toolbar">
          {admin && (
            <select
              aria-label={t("Worker")}
              value={worker}
              onChange={(e) => setWorker(e.target.value)}
            >
              <option value="">{t("All")}</option>
              {store.team
                .filter((w) => w.role === "worker")
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
          )}
          <select
            aria-label={t("Status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("All")}</option>
            {["Pending", "Approved", "Rejected", "Paid"].map((x) => (
              <option key={x} value={x}>
                {t(x)}
              </option>
            ))}
          </select>
          <Field label={t("Date from")}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label={t("Date to")}>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Patient ID",
                  "Worker",
                  "Registration date",
                  "Total",
                  "Status",
                  "Payments",
                  "Payment date",
                ].map((k) => (
                  <th key={k}>{t(k)}</th>
                ))}
                {admin && <th>{t("Quick actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <strong>{i.patientId}</strong>
                    <small>{i.id}</small>
                  </td>
                  <td>{i.workerId}</td>
                  <td>{i.date}</td>
                  <td>{money(i.amount)}</td>
                  <td>
                    <Badge value={i.approval} />
                  </td>
                  <td>
                    <Badge value={i.payment} />
                    <small>{i.reference}</small>
                  </td>
                  <td>{i.paidDate || "—"}</td>
                  {admin && (
                    <td>
                      <div className="button-row">
                        {i.approval === "Pending" && (
                          <>
                            <button className="text-btn" onClick={() => approve(i.id, "Approved")}>
                              {t("Approve")}
                            </button>
                            <button
                              className="text-btn danger"
                              onClick={() => approve(i.id, "Rejected")}
                            >
                              {t("Reject")}
                            </button>
                          </>
                        )}
                        {i.approval === "Approved" && i.payment !== "Paid" && (
                          <button className="text-btn" onClick={() => setPay(i.id)}>
                            {t("Mark paid")}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty />}
        </div>
      </Panel>
      <Dialog
        open={Boolean(pay)}
        onOpenChange={(open) => {
          if (!open) setPay("");
        }}
      >
        <DialogContent>
          <DialogTitle>{t("Paid")}</DialogTitle>
          <DialogDescription>
            Records a fictional payment only. No transfer takes place.
          </DialogDescription>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const ref = String(new FormData(e.currentTarget).get("reference"));
              if (approve(pay, "Paid", ref)) setPay("");
            }}
          >
            <Field label={t("Payment reference")}>
              <input name="reference" required minLength={3} maxLength={100} />
            </Field>
            <button className="btn">{t("Save")}</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
