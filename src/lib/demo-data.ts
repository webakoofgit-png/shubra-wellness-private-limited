export type Role = "patient" | "worker" | "sales" | "admin";

export type Patient = {
  id: string;
  name: string;
  mobile: string;
  worker: string;
  district: string;
  joined: string;
  survey: string;
  status: string;
};

export type AssignmentEvent = {
  patientId: string;
  from: string;
  to: string;
  reason: string;
  date: string;
};

export const demoPeople: Record<Role, { name: string; title: string; initials: string }> = {
  patient: { name: "Amit Patil", title: "Patient", initials: "AP" },
  worker: { name: "Rahul Patil", title: "Health Worker", initials: "RP" },
  sales: { name: "Sneha Kulkarni", title: "Sales Representative", initials: "SK" },
  admin: { name: "Prajakta Inamke", title: "Super Admin", initials: "PI" },
};

export const initialPatients: Patient[] = [
  { id: "PT10001", name: "Amit Patil", mobile: "+91 98765 43210", worker: "HW1001", district: "Pune", joined: "12 Oct 2026", survey: "Completed", status: "Active" },
  { id: "PT10002", name: "Maya Deshmukh", mobile: "+91 98220 11448", worker: "HW1001", district: "Satara", joined: "10 Oct 2026", survey: "In review", status: "Active" },
  { id: "PT10003", name: "Arjun Jadhav", mobile: "+91 97654 32018", worker: "HW1002", district: "Nashik", joined: "08 Oct 2026", survey: "Pending", status: "Pending" },
  { id: "PT10004", name: "Kavita Pawar", mobile: "+91 98901 77234", worker: "HW1002", district: "Pune", joined: "06 Oct 2026", survey: "Completed", status: "Active" },
  { id: "PT10005", name: "Rohan Shinde", mobile: "+91 99224 50831", worker: "HW1003", district: "Kolhapur", joined: "02 Oct 2026", survey: "Completed", status: "Active" },
];

export const medicines = [
  { id: "MED-01", name: "Ashwagandha Capsules", category: "Daily wellness", price: 349, stock: 42, description: "A traditional herbal supplement for everyday wellbeing." },
  { id: "MED-02", name: "Triphala Churna", category: "Herbal powder", price: 225, stock: 28, description: "A classic blend of three dried fruits." },
  { id: "MED-03", name: "Brahmi Tablets", category: "Herbal tablets", price: 289, stock: 16, description: "A carefully prepared botanical wellness product." },
];

export const initialOrders = [
  { id: "SSW-2048", customer: "Amit Patil", date: "12 Oct 2026", items: "Ashwagandha Capsules × 2", amount: 698, payment: "Demo · UPI", status: "Processing" },
  { id: "SSW-2047", customer: "Maya Deshmukh", date: "10 Oct 2026", items: "Triphala Churna × 1", amount: 225, payment: "Cash on delivery", status: "Shipped" },
  { id: "SSW-2046", customer: "Kavita Pawar", date: "08 Oct 2026", items: "Brahmi Tablets × 1", amount: 289, payment: "Demo · Card", status: "Delivered" },
];

export const initialIncentives = [
  { id: "INC-0184", patientId: "PT10001", worker: "Rahul Patil", amount: 50, approval: "Approved", payment: "Pending" },
  { id: "INC-0183", patientId: "PT10002", worker: "Rahul Patil", amount: 50, approval: "Pending", payment: "Pending" },
  { id: "INC-0182", patientId: "PT10003", worker: "Arjun Jadhav", amount: 50, approval: "Approved", payment: "Paid" },
];

export function calculateIncentive(eligibleRegistrations: number, configuredRate: number): number {
  if (!Number.isFinite(eligibleRegistrations) || !Number.isFinite(configuredRate)) return 0;
  return Math.max(0, Math.floor(eligibleRegistrations)) * Math.max(0, configuredRate);
}

export function reassignPatient(
  patients: Patient[],
  history: AssignmentEvent[],
  patientId: string,
  nextWorker: string,
  reason: string,
  date = "12 Oct 2026",
): { patients: Patient[]; history: AssignmentEvent[] } | null {
  const current = patients.find((patient) => patient.id === patientId);
  const cleanReason = reason.trim();
  if (!current || !nextWorker || !cleanReason || current.worker === nextWorker) return null;

  return {
    patients: patients.map((patient) => patient.id === patientId ? { ...patient, worker: nextWorker } : patient),
    history: [{ patientId, from: current.worker, to: nextWorker, reason: cleanReason, date }, ...history],
  };
}