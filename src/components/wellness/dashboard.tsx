import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  HeartPulse,
  Leaf,
  Package,
  Plus,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Badge, Empty, Field, Panel, csvDownload, useWellness } from "./context";
import { accountFor, money, visiblePatients, visibleSurveys } from "@/lib/wellness-service";
import { useOrders } from "./commerce";
import productImage from "@/assets/ayurvedic-products.jpg";
const colors = ["#168B65", "#D4A853", "#3D8EAD", "#91BEA5"];
function Metric({
  label,
  value,
  icon,
  action,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  action: () => void;
}) {
  return (
    <button className="metric" onClick={action}>
      <div className="metric-label">
        <span>{label}</span>
        <i>{icon}</i>
      </div>
      <strong>{value}</strong>
      <small>
        <ArrowUpRight size={13} />
        View demo records
      </small>
    </button>
  );
}
export function Dashboard() {
  const { store, session, t, go } = useWellness();
  const person = accountFor(store, session)!;
  const patients = visiblePatients(store, session);
  const surveys = visibleSurveys(store, session);
  const orders = useOrders();
  const incentives = store.incentives.filter(
    (i) => session.role === "admin" || i.workerId === session.id,
  );
  const earned = incentives
    .filter((i) => i.approval !== "Rejected")
    .reduce((sum, i) => sum + i.amount, 0);
  const approved = incentives
    .filter((i) => i.approval === "Approved")
    .reduce((sum, i) => sum + i.amount, 0);
  const paid = incentives.filter((i) => i.payment === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const sales = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.amount, 0);
  const patient = store.patients.find((p) => p.id === session.id);
  const date = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const metrics =
    session.role === "admin"
      ? [
          ["Total patients", patients.length, "Patients"],
          ["Workers", store.team.filter((w) => w.role === "worker").length, "Workers"],
          ["Sales", store.team.filter((w) => w.role === "sales").length, "Sales"],
          ["Total surveys", surveys.length, "Surveys"],
          ["Verified", patients.filter((p) => p.verified).length, "Patients"],
          ["Total orders", orders.length, "Orders"],
          ["Total sales", money(sales), "Reports"],
          ["Earned", money(earned), "Incentives"],
          ["Pending amount", money(earned - paid), "Incentives"],
        ]
      : session.role === "worker"
        ? [
            ["Total surveys", surveys.length, "Surveys"],
            ["Total patients", patients.length, "Patients"],
            ["Active", patients.filter((p) => p.status === "Active").length, "Patients"],
            ["Pending", patients.filter((p) => !p.verified).length, "Patients"],
            ["Earned", money(earned), "Incentives"],
            ["Approved", money(approved), "Incentives"],
            ["Paid amount", money(paid), "Payments"],
            ["Pending amount", money(earned - paid), "Incentives"],
          ]
        : session.role === "sales"
          ? [
              ["Customer", patients.length, "Patients"],
              ["Total orders", orders.length, "Orders"],
              ["Total sales", money(sales), "Reports"],
              [
                "Pending",
                orders.filter((o) => !["Delivered", "Cancelled"].includes(o.status)).length,
                "Orders",
              ],
              ["Completed", orders.filter((o) => o.status === "Delivered").length, "Orders"],
              ["Performance", money(sales), "Reports"],
            ]
          : [
              ["Total surveys", surveys.length, "Surveys"],
              ["Total orders", orders.length, "Orders"],
              ["Payments", money(sales), "Payments"],
            ];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{date.toUpperCase()}</span>
          <h1>
            {t("Welcome back")}, {person.name.split(" ")[0]}
            <span className="greeting-dot">.</span>
          </h1>
          <p>
            {t("Health overview")} · {person.id}
          </p>
        </div>
        <button
          className="btn"
          onClick={() =>
            go(
              session.role === "worker"
                ? "Surveys"
                : session.role === "admin"
                  ? "Reports"
                  : "Medicines",
            )
          }
        >
          <Plus size={17} />
          {t(
            session.role === "worker"
              ? "New survey"
              : session.role === "admin"
                ? "Reports"
                : "Medicines",
          )}
        </button>
      </div>
      {session.role === "patient" && (
        <>
          <div className="welcome-card">
            <div>
              <span className="eyebrow">
                <HeartPulse size={16} /> YOUR CARE, IN ONE PLACE
              </span>
              <h2>{t("Tagline")}</h2>
              <p>Stay connected with your care partner and explore everyday wellness.</p>
              <button onClick={() => go("Surveys")}>
                {t("Surveys")}
                <ArrowRight size={17} />
              </button>
            </div>
            <img src={productImage} alt="Ayurvedic wellness products and botanicals" />
          </div>
          <div className="patient-strip">
            <div>
              <small>{t("Patient ID")}</small>
              <strong>{person.id}</strong>
            </div>
            <div>
              <small>{t("Assigned worker")}</small>
              <strong>
                {store.team.find((w) => w.id === patient?.worker)?.name} · {patient?.worker}
              </strong>
            </div>
            <div>
              <small>{t("Registration date")}</small>
              <strong>{patient?.joined}</strong>
            </div>
          </div>
        </>
      )}
      {session.role === "worker" && (
        <div className="worker-banner">
          <div>
            <span className="eyebrow">YOUR COMMUNITY, HEALTHIER</span>
            <h2>Small steps make a lasting difference.</h2>
            <p>
              {patients.length} {t("Patients")} · REF-{session.id}
            </p>
            <button className="btn" onClick={() => go("Register")}>
              {t("Register")}
              <ArrowRight size={16} />
            </button>
          </div>
          <Leaf size={125} strokeWidth={1} />
        </div>
      )}
      <div className="metric-grid">
        {metrics.map(([label, value, destination], i) => (
          <Metric
            key={String(label)}
            label={t(String(label))}
            value={value!}
            icon={
              i % 3 === 0 ? (
                <Users size={18} />
              ) : i % 3 === 1 ? (
                <Wallet size={18} />
              ) : (
                <ClipboardList size={18} />
              )
            }
            action={() => go(String(destination))}
          />
        ))}
      </div>
      <div className="two-col">
        <Panel title={t("Quick actions")}>
          <div className="quick-actions">
            {(session.role === "patient"
              ? [
                  ["Profile", Users],
                  ["Surveys", ClipboardList],
                  ["Medicines", Leaf],
                  ["Orders", Package],
                  ["Payments", Wallet],
                  ["Support", HeartPulse],
                ]
              : session.role === "worker"
                ? [
                    ["Register", Plus],
                    ["Surveys", ClipboardList],
                    ["Patients", Users],
                    ["Incentives", Wallet],
                  ]
                : session.role === "sales"
                  ? [
                      ["Patients", Users],
                      ["Medicines", Leaf],
                      ["Orders", Package],
                      ["Reports", Wallet],
                    ]
                  : [
                      ["Workers", Stethoscope],
                      ["Patients", Users],
                      ["Incentives", Wallet],
                      ["Medicines", Leaf],
                    ]
            ).map(([key, Icon]) => {
              const I = Icon as typeof Leaf;
              return (
                <button key={String(key)} onClick={() => go(String(key))}>
                  <I size={23} />
                  <strong>{t(String(key))}</strong>
                  <ArrowRight size={16} />
                </button>
              );
            })}
          </div>
        </Panel>
        <Panel
          title={t(session.role === "worker" ? "Incentives" : "Orders")}
          action={
            <button
              className="text-btn"
              onClick={() => go(session.role === "worker" ? "Incentives" : "Orders")}
            >
              {t("All")}
              <ArrowRight size={15} />
            </button>
          }
        >
          {session.role === "worker"
            ? incentives.slice(0, 3).map((i) => (
                <div className="list-row" key={i.id}>
                  <div>
                    <strong>{i.patientId}</strong>
                    <p>{money(i.amount)}</p>
                  </div>
                  <Badge value={i.approval} />
                </div>
              ))
            : orders.slice(0, 3).map((o) => (
                <div className="list-row" key={o.id}>
                  <div>
                    <strong>{o.id}</strong>
                    <p>
                      {money(o.amount)} · {o.date}
                    </p>
                  </div>
                  <Badge value={o.status} />
                </div>
              ))}
          {!(session.role === "worker" ? incentives.length : orders.length) && <Empty />}
        </Panel>
      </div>
      {session.role !== "patient" && <Charts />}
      {session.role === "admin" && (
        <Panel title="Illustrative network scale · separate from interactive sample">
          <p className="muted">
            Requested presentation benchmarks. The cards above and interactive reports use the
            actual fictional records loaded in this browser.
          </p>
          <div className="benchmark-grid">
            <div>
              <strong>12,450</strong>
              <small>{t("Total patients")}</small>
            </div>
            <div>
              <strong>245</strong>
              <small>{t("Workers")}</small>
            </div>
            <div>
              <strong>65</strong>
              <small>{t("Sales")}</small>
            </div>
            <div>
              <strong>14,800</strong>
              <small>{t("Total surveys")}</small>
            </div>
          </div>
        </Panel>
      )}
      {session.role === "worker" && (
        <Panel title="Illustrative worker target · separate from interactive sample">
          <div className="benchmark-grid">
            <div>
              <strong>150</strong>
              <small>{t("Total surveys")}</small>
            </div>
            <div>
              <strong>120</strong>
              <small>{t("Total patients")}</small>
            </div>
            <div>
              <strong>110</strong>
              <small>{t("Eligible registrations")}</small>
            </div>
            <div>
              <strong>{money(110 * store.rules.rate)}</strong>
              <small>110 × {money(store.rules.rate)} · Example</small>
            </div>
          </div>
        </Panel>
      )}
    </>
  );
}

export function Charts() {
  const { store, session, t } = useWellness();
  const patients = visiblePatients(store, session);
  const orders = useOrders();
  const worker = session.role === "worker";
  const sales = session.role === "sales";
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => ({
    name: new Date(year, i, 1).toLocaleDateString("en", { month: "short" }),
    registrations: patients.filter((p) =>
      p.joined.startsWith(`${year}-${String(i + 1).padStart(2, "0")}`),
    ).length,
    sales: orders
      .filter(
        (o) =>
          o.date.startsWith(`${year}-${String(i + 1).padStart(2, "0")}`) &&
          o.status !== "Cancelled",
      )
      .reduce((sum, o) => sum + o.amount, 0),
  }));
  const performance = store.team
    .filter((w) => w.role === "worker" && (!worker || w.id === session.id))
    .map((w) => ({
      name: w.name.split(" ")[0],
      patients: patients.filter((p) => p.worker === w.id).length,
    }));
  const incentives = store.incentives.filter(
    (i) => session.role === "admin" || i.workerId === session.id,
  );
  const pie = ["Pending", "Approved", "Paid", "Rejected"]
    .map((name) => ({
      name: t(name),
      value: incentives
        .filter((i) =>
          name === "Paid" ? i.payment === "Paid" : i.approval === name && i.payment !== "Paid",
        )
        .reduce((sum, i) => sum + i.amount, 0),
    }))
    .filter((i) => i.value > 0);
  const stateData = [...new Set(patients.map((p) => p.state))].map((state) => ({
    name: state,
    registrations: patients.filter((p) => p.state === state).length,
  }));
  return (
    <div className="chart-grid">
      {!sales && (
        <Panel title={t("Registration activity")}>
          <p className="chart-caption">{year} · Interactive fictional records</p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months}>
                <defs>
                  <linearGradient id="registration-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#168B65" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#168B65" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="registrations"
                  stroke="#168B65"
                  strokeWidth={3}
                  fill="url(#registration-fill)"
                  name={t("Patients")}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
      {!worker && (
        <Panel title={t("Sales activity")}>
          <p className="chart-caption">
            {year} ·{" "}
            {money(
              orders.filter((o) => o.status !== "Cancelled").reduce((sum, o) => sum + o.amount, 0),
            )}
          </p>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="name" tickLine={false} />
                <YAxis />
                <Tooltip />
                <Bar
                  isAnimationActive={false}
                  dataKey="sales"
                  name={t("Total sales")}
                  fill="#168B65"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
      {!sales && (
        <>
          <Panel title={t("Performance")}>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance} layout="vertical">
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Bar
                    isAnimationActive={false}
                    dataKey="patients"
                    fill="#3D8EAD"
                    radius={[0, 5, 5, 0]}
                    name={t("Patients")}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title={t("Distribution")}>
            <div className="chart-box">
              {pie.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={pie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={88}
                      paddingAngle={4}
                      label
                    >
                      {pie.map((p, i) => (
                        <Cell key={p.name} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </div>
            <div className="chart-legend">
              {pie.map((p, i) => (
                <span key={p.name}>
                  <i style={{ background: colors[i % colors.length] }} />
                  {p.name}: {money(p.value)}
                </span>
              ))}
            </div>
          </Panel>
          <Panel title={t("State registrations")}>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    isAnimationActive={false}
                    dataKey="registrations"
                    name={t("Patients")}
                    fill="#D4A853"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

export function Reports() {
  const { store, session, t } = useWellness();
  const orders = useOrders();
  const [worker, setWorker] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const patients = visiblePatients(store, session).filter(
    (p) =>
      (!worker || p.worker === worker) &&
      (!state || p.state === state) &&
      (!district || p.district === district) &&
      (!from || p.joined >= from) &&
      (!to || p.joined <= to),
  );
  const ids = new Set(patients.map((p) => p.id));
  const incentiveRows = store.incentives.filter(
    (i) => ids.has(i.patientId) && (!status || i.payment === status || i.approval === status),
  );
  const orderRows = orders.filter(
    (o) =>
      ids.has(o.patientId) &&
      (!from || o.date >= from) &&
      (!to || o.date <= to) &&
      (!status || o.payment === status || o.status === status),
  );
  const workers = store.team.filter((w) => w.role === "worker" && (!worker || w.id === worker));
  const workerRows = workers.map((w) => {
    const inc = incentiveRows.filter((i) => i.workerId === w.id);
    return {
      id: w.id,
      name: w.name,
      registrations: patients.filter((p) => p.worker === w.id).length,
      eligible: inc.length,
      earned: inc.filter((i) => i.approval !== "Rejected").reduce((s, i) => s + i.amount, 0),
      approved: inc.filter((i) => i.approval === "Approved").reduce((s, i) => s + i.amount, 0),
      paid: inc.filter((i) => i.payment === "Paid").reduce((s, i) => s + i.amount, 0),
      pending: inc
        .filter((i) => i.approval !== "Rejected" && i.payment !== "Paid")
        .reduce((s, i) => s + i.amount, 0),
    };
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">OPERATIONS INSIGHTS</span>
          <h1>{t("Reports")}</h1>
          <p>
            Filters and exports use fictional records. Charts below show the complete accessible
            sample.
          </p>
        </div>
        <button
          className="btn secondary"
          onClick={() =>
            session.role === "admin"
              ? csvDownload("worker-performance", [
                  [
                    "Worker ID",
                    "Name",
                    "Registrations",
                    "Eligible",
                    "Earned",
                    "Approved",
                    "Paid",
                    "Pending",
                  ],
                  ...workerRows.map((w) => [
                    w.id,
                    w.name,
                    w.registrations,
                    w.eligible,
                    w.earned,
                    w.approved,
                    w.paid,
                    w.pending,
                  ]),
                ])
              : csvDownload("sales-report", [
                  ["Order", "Patient", "Date", "Amount", "Payment", "Status"],
                  ...orderRows.map((o) => [
                    o.id,
                    o.patientId,
                    o.date,
                    o.amount,
                    o.payment,
                    o.status,
                  ]),
                ])
          }
        >
          {t("Export")}
        </button>
      </div>
      <Panel title={t("Reports")}>
        <div className="report-filters">
          {session.role === "admin" && (
            <Field label={t("Worker")}>
              <select value={worker} onChange={(e) => setWorker(e.target.value)}>
                <option value="">{t("All")}</option>
                {store.team
                  .filter((w) => w.role === "worker")
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          <Field label={t("State")}>
            <select value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">{t("All")}</option>
              {[...new Set(store.patients.map((p) => p.state))].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label={t("District")}>
            <select value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">{t("All")}</option>
              {[...new Set(store.patients.map((p) => p.district))].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label={t("Date from")}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label={t("Date to")}>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label={t("Status")}>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{t("All")}</option>
              {["Pending", "Approved", "Paid", "Simulated paid", "Rejected"].map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="table-wrap">
          {session.role === "admin" ? (
            <table>
              <thead>
                <tr>
                  {[
                    "Worker ID",
                    "Name",
                    "Patients",
                    "Eligible registrations",
                    "Earned",
                    "Approved",
                    "Paid amount",
                    "Pending amount",
                  ].map((k) => (
                    <th key={k}>{t(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workerRows.map((w) => (
                  <tr key={w.id}>
                    <td>{w.id}</td>
                    <td>{w.name}</td>
                    <td>{w.registrations}</td>
                    <td>{w.eligible}</td>
                    <td>{money(w.earned)}</td>
                    <td>{money(w.approved)}</td>
                    <td>{money(w.paid)}</td>
                    <td>{money(w.pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  {["Orders", "Customer", "Registration date", "Total", "Status"].map((k) => (
                    <th key={k}>{t(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderRows.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{store.patients.find((p) => p.id === o.patientId)?.name}</td>
                    <td>{o.date}</td>
                    <td>{money(o.amount)}</td>
                    <td>
                      <Badge value={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
      <Charts />
    </>
  );
}
