import { initialPatients, medicines as seedMedicines, type Role } from "./demo-data";

export type Person = {
  id: string;
  name: string;
  mobile: string;
  role: Role;
  address: string;
  state: string;
  district: string;
  joined: string;
  status: string;
};
export type PatientRecord = Person & {
  worker: string;
  dob: string;
  gender: string;
  pin: string;
  verified: boolean;
  reference: string;
};
export type Medicine = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  ingredients: string;
  usage: string;
  image: string;
};
export type Survey = {
  id: string;
  patientId: string;
  workerId: string;
  date: string;
  conditions: string[];
  medication: string;
  notes: string;
  consent: boolean;
  status: string;
};
export type Order = {
  id: string;
  patientId: string;
  salesId: string;
  date: string;
  items: { medicineId: string; name: string; price: number; quantity: number }[];
  amount: number;
  address: string;
  method: string;
  payment: string;
  status: string;
};
export type Incentive = {
  id: string;
  patientId: string;
  workerId: string;
  date: string;
  amount: number;
  approval: string;
  payment: string;
  reference: string;
  paidDate: string;
};
export type Audit = { id: string; date: string; actor: string; action: string; reason: string };
export type Notice = {
  id: string;
  userId: string;
  title: string;
  detail: string;
  date: string;
  read: boolean;
};
export type Recovery = {
  id: string;
  patientId: string;
  mobile: string;
  reason: string;
  status: string;
  date: string;
};
export type Store = {
  version: 1;
  patients: PatientRecord[];
  team: Person[];
  medicines: Medicine[];
  surveys: Survey[];
  orders: Order[];
  incentives: Incentive[];
  audit: Audit[];
  notices: Notice[];
  recovery: Recovery[];
  rules: { rate: number; requireSurvey: boolean; requireApproval: boolean; conditions: string[] };
  categories: string[];
};
export type Session = { role: Role; id: string };
export const STORE_KEY = "ssw-demo-v1";
export const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
export const uid = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
export const normalizeMobile = (value: string) =>
  value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
export const validMobile = (value: string) => /^[6-9]\d{9}$/.test(normalizeMobile(value));

export function seedStore(): Store {
  const team: Person[] = [
    {
      id: "HW1001",
      name: "Rahul Patil",
      mobile: "9876543211",
      role: "worker",
      address: "Kothrud",
      state: "Maharashtra",
      district: "Pune",
      joined: "2025-01-10",
      status: "Active",
    },
    {
      id: "HW1002",
      name: "Arjun Jadhav",
      mobile: "9876543212",
      role: "worker",
      address: "College Road",
      state: "Maharashtra",
      district: "Nashik",
      joined: "2025-03-01",
      status: "Active",
    },
    {
      id: "HW1003",
      name: "Meera Shinde",
      mobile: "9876543213",
      role: "worker",
      address: "Shahupuri",
      state: "Maharashtra",
      district: "Kolhapur",
      joined: "2025-04-01",
      status: "Active",
    },
    {
      id: "SR0204",
      name: "Sneha Kulkarni",
      mobile: "9876543214",
      role: "sales",
      address: "Baner",
      state: "Maharashtra",
      district: "Pune",
      joined: "2025-02-01",
      status: "Active",
    },
    {
      id: "ADM001",
      name: "Prajakta Inamke",
      mobile: "9876543215",
      role: "admin",
      address: "Pune",
      state: "Maharashtra",
      district: "Pune",
      joined: "2025-01-01",
      status: "Active",
    },
  ];
  const patients: PatientRecord[] = initialPatients.map((p, i) => ({
    id: p.id,
    name: p.name,
    mobile: normalizeMobile(p.mobile),
    role: "patient",
    address: `${12 + i}, Demo Wellness Lane`,
    state: "Maharashtra",
    district: p.district,
    joined: `2026-10-${String(12 - i * 2).padStart(2, "0")}`,
    status: p.status,
    worker: p.worker,
    dob: "1990-06-12",
    gender: i % 2 ? "Female" : "Male",
    pin: "411038",
    verified: p.status === "Active",
    reference: `REF-${p.worker}`,
  }));
  return {
    version: 1,
    patients,
    team,
    medicines: seedMedicines.map((m, i) => ({
      ...m,
      ingredients: ["Withania somnifera", "Amla, Haritaki, Bibhitaki", "Bacopa monnieri"][i] ?? "",
      usage:
        "Follow the product label and consult a qualified practitioner before use. Not a substitute for prescribed medication.",
      image: "",
    })),
    surveys: patients
      .filter((p) => p.verified)
      .map((p) => ({
        id: `SUR-${p.id}`,
        patientId: p.id,
        workerId: p.worker,
        date: p.joined,
        conditions: [],
        medication: "None reported",
        notes: "Routine fictional wellness check-in.",
        consent: true,
        status: "Completed",
      })),
    orders: [
      {
        id: "SSW-2048",
        patientId: "PT10001",
        salesId: "SR0204",
        date: "2026-10-12",
        items: [{ medicineId: "MED-01", name: "Ashwagandha Capsules", price: 349, quantity: 2 }],
        amount: 698,
        address: "12, Demo Wellness Lane, Pune 411038",
        method: "UPI",
        payment: "Simulated paid",
        status: "Processing",
      },
      {
        id: "SSW-2047",
        patientId: "PT10002",
        salesId: "SR0204",
        date: "2026-10-10",
        items: [{ medicineId: "MED-02", name: "Triphala Churna", price: 225, quantity: 1 }],
        amount: 225,
        address: "Satara, Maharashtra",
        method: "Cash on delivery",
        payment: "Pending",
        status: "Shipped",
      },
    ],
    incentives: patients
      .filter((p) => p.verified)
      .map((p, i) => ({
        id: `INC-${p.id}`,
        patientId: p.id,
        workerId: p.worker,
        date: p.joined,
        amount: 50,
        approval: i === 0 ? "Approved" : "Pending",
        payment: "Pending",
        reference: "",
        paidDate: "",
      })),
    audit: [],
    recovery: [],
    notices: [
      {
        id: "N1",
        userId: "PT10001",
        title: "Order Confirmed",
        detail: "SSW-2048 • Processing • Demo only",
        date: "2026-10-12",
        read: false,
      },
      {
        id: "N2",
        userId: "HW1001",
        title: "Registration Verified",
        detail: "PT10002 • Eligible registration",
        date: "2026-10-10",
        read: false,
      },
      {
        id: "N3",
        userId: "ADM001",
        title: "Pending Incentive Approval",
        detail: "Review the incentive queue",
        date: "2026-10-12",
        read: false,
      },
    ],
    rules: {
      rate: 50,
      requireSurvey: false,
      requireApproval: true,
      conditions: ["Blood Pressure", "Diabetes", "Asthma", "Other Conditions"],
    },
    categories: ["Daily wellness", "Herbal powder", "Herbal tablets"],
  };
}
export function loadDemo(): Store {
  if (typeof window === "undefined") return seedStore();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      if (parsed.version === 1 && Array.isArray(parsed.patients) && Array.isArray(parsed.recovery))
        return parsed;
    }
  } catch {
    /* recover gracefully from unavailable/corrupt demo storage */
  }
  return seedStore();
}
export function accountFor(store: Store, session: Session): Person | undefined {
  return [...store.patients, ...store.team].find(
    (p) => p.id === session.id && p.role === session.role && p.status === "Active",
  );
}
export function visiblePatients(store: Store, session: Session): PatientRecord[] {
  return store.patients.filter(
    (p) =>
      session.role === "admin" ||
      session.role === "sales" ||
      (session.role === "worker" && p.worker === session.id) ||
      (session.role === "patient" && p.id === session.id),
  );
}
export function visibleSurveys(store: Store, session: Session): Survey[] {
  if (session.role === "sales") return [];
  const ids = new Set(visiblePatients(store, session).map((p) => p.id));
  return store.surveys.filter((s) => ids.has(s.patientId));
}
export function registerPatient(
  store: Store,
  input: Omit<PatientRecord, "id" | "role" | "worker" | "joined" | "status" | "verified">,
): { store: Store; patient: PatientRecord; restored: boolean } {
  const mobile = normalizeMobile(input.mobile);
  if (!validMobile(mobile)) throw new Error("Enter a valid 10-digit mobile number");
  const existing = store.patients.find((p) => p.mobile === mobile);
  if (existing) {
    if (existing.status === "Inactive") throw new Error("Inactive");
    if (existing.verified) return { store, patient: existing, restored: true };
    const patient = { ...existing, verified: true, status: "Active" };
    let next = ensureEligibility(
      { ...store, patients: store.patients.map((p) => (p.id === patient.id ? patient : p)) },
      patient.id,
    );
    next = addNotice(
      next,
      patient.worker,
      "Registration Verified",
      `${patient.id} · ${patient.name}`,
    );
    return { store: next, patient, restored: true };
  }
  if (store.team.some((p) => p.mobile === mobile))
    throw new Error("This number belongs to an existing team account");
  const worker = store.team.find(
    (w) => w.role === "worker" && w.status === "Active" && `REF-${w.id}` === input.reference,
  );
  if (!worker) throw new Error("Enter a valid worker registration reference");
  if (
    !input.name.trim() ||
    !input.address.trim() ||
    !/^\d{6}$/.test(input.pin) ||
    !input.dob ||
    input.dob > today()
  )
    throw new Error("Complete all required patient details");
  const nextId =
    Math.max(10000, ...store.patients.map((p) => Number(p.id.replace("PT", "")) || 10000)) + 1;
  const patient: PatientRecord = {
    ...input,
    mobile,
    name: input.name.trim(),
    id: `PT${nextId}`,
    role: "patient",
    worker: worker.id,
    joined: today(),
    status: "Active",
    verified: true,
  };
  let next = { ...store, patients: [...store.patients, patient] };
  next = ensureEligibility(next, patient.id);
  next = addNotice(next, patient.id, "Registration Successful", `${patient.id} • ${worker.id}`);
  next = addNotice(next, worker.id, "New Patient Registered", `${patient.id} • ${patient.name}`);
  next = addNotice(next, "ADM001", "New Patient Registered", `${patient.id} · ${worker.id}`);
  return { store: next, patient, restored: false };
}
export function ensureEligibility(store: Store, patientId: string): Store {
  const p = store.patients.find((p) => p.id === patientId);
  if (
    !p?.verified ||
    p.status !== "Active" ||
    store.incentives.some((i) => i.patientId === patientId) ||
    (store.rules.requireSurvey &&
      !store.surveys.some(
        (s) => s.patientId === patientId && s.consent && s.status === "Completed",
      ))
  )
    return store;
  return {
    ...store,
    incentives: [
      ...store.incentives,
      {
        id: uid("INC"),
        patientId,
        workerId: p.worker,
        date: today(),
        amount: store.rules.rate,
        approval: store.rules.requireApproval ? "Pending" : "Approved",
        payment: "Pending",
        reference: "",
        paidDate: "",
      },
    ],
  };
}
export function assignPatient(
  store: Store,
  actor: Session,
  patientId: string,
  workerId: string,
  reason: string,
): Store {
  if (actor.role !== "admin" || !accountFor(store, actor)) throw new Error("Access denied");
  const p = store.patients.find((p) => p.id === patientId);
  if (
    !p ||
    p.worker === workerId ||
    !reason.trim() ||
    !store.team.some((w) => w.id === workerId && w.role === "worker" && w.status === "Active")
  )
    throw new Error("Choose another active worker and enter a reason");
  return {
    ...store,
    patients: store.patients.map((row) =>
      row.id === patientId ? { ...row, worker: workerId } : row,
    ),
    audit: [
      {
        id: uid("AUD"),
        date: today(),
        actor: actor.id,
        action: `${patientId}: ${p.worker} → ${workerId}`,
        reason: reason.trim(),
      },
      ...store.audit,
    ],
  };
}
export function addNotice(store: Store, userId: string, title: string, detail: string): Store {
  return {
    ...store,
    notices: [
      { id: uid("N"), userId, title, detail, date: today(), read: false },
      ...store.notices,
    ],
  };
}
export function createOrder(
  store: Store,
  actor: Session,
  patientId: string,
  cart: Record<string, number>,
  address: string,
  method: string,
): Store {
  if (
    !accountFor(store, actor) ||
    !["patient", "sales", "admin"].includes(actor.role) ||
    (actor.role === "patient" && patientId !== actor.id)
  )
    throw new Error("Access denied");
  if (!store.patients.some((p) => p.id === patientId && p.status === "Active") || !address.trim())
    throw new Error("Choose a customer and delivery address");
  const items = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => {
      const med = store.medicines.find((m) => m.id === id);
      if (!med || !Number.isInteger(q) || q < 1 || q > med.stock)
        throw new Error("Quantity exceeds available stock");
      return { medicineId: id, name: med.name, price: med.price, quantity: q };
    });
  if (!items.length) throw new Error("Your cart is empty");
  const order: Order = {
    id: uid("SSW"),
    patientId,
    salesId: actor.role === "sales" ? actor.id : "",
    date: today(),
    items,
    amount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    address,
    method,
    payment: method === "Cash on delivery" ? "Pending" : "Simulated paid",
    status: "Placed",
  };
  return addNotice(
    {
      ...store,
      orders: [order, ...store.orders],
      medicines: store.medicines.map((m) => ({ ...m, stock: m.stock - (cart[m.id] ?? 0) })),
    },
    patientId,
    "Order Confirmed",
    `${order.id} • ${money(order.amount)} • Demo only`,
  );
}
// Future adapters must enforce authorization server-side. These contracts carry no secrets.
export interface WellnessApi {
  requestOtp(mobile: string): Promise<{ challengeId: string }>;
  verifyOtp(challengeId: string, otp: string): Promise<{ user: Person }>;
  registerPatient(input: {
    profile: Omit<PatientRecord, "id" | "role" | "worker" | "joined" | "status" | "verified">;
    challengeId: string;
  }): Promise<PatientRecord>;
  getMyAccount(): Promise<PatientRecord | Person>;
  saveSurvey(input: Omit<Survey, "id" | "workerId" | "date">): Promise<Survey>;
  reassignPatient(patientId: string, workerId: string, reason: string): Promise<void>;
  createPaymentOrder(orderId: string): Promise<{ checkoutId: string }>;
  requestRecovery(
    patientId: string,
    newMobile: string,
    reason: string,
  ): Promise<{ requestId: string }>;
}
