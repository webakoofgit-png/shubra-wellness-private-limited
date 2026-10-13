import { describe, it, expect } from "vitest";
import {
  accountFor,
  assignPatient,
  createOrder,
  ensureEligibility,
  loadDemo,
  registerPatient,
  seedStore,
  STORE_KEY,
  visiblePatients,
  visibleSurveys,
} from "@/lib/wellness-service";

const input = {
  name: "Fictional Neha",
  mobile: "9876543220",
  address: "Demo Street",
  district: "Pune",
  state: "Maharashtra",
  pin: "411038",
  dob: "1994-04-01",
  gender: "Female",
  reference: "REF-HW1001",
};
describe("Phase 1 account and care rules", () => {
  it("completes an existing pending registration without changing its worker or duplicating its ID", () => {
    const base = seedStore();
    const pending = base.patients.find((p) => !p.verified)!;
    const result = registerPatient(base, { ...pending, reference: "REF-HW1001" });
    expect(result.patient.id).toBe(pending.id);
    expect(result.patient.worker).toBe(pending.worker);
    expect(result.patient.verified).toBe(true);
    expect(result.store.patients).toHaveLength(base.patients.length);
    expect(result.store.incentives.filter((i) => i.patientId === pending.id)).toHaveLength(1);
    expect(registerPatient(result.store, pending).store.incentives).toHaveLength(
      result.store.incentives.length,
    );
  });
  it("registers a verified patient with explicit worker attribution and one incentive", () => {
    const result = registerPatient(seedStore(), input);
    expect(result.patient.worker).toBe("HW1001");
    expect(result.patient.verified).toBe(true);
    expect(result.store.incentives.filter((i) => i.patientId === result.patient.id)).toHaveLength(
      1,
    );
  });
  it("restores the same ID and worker even if a different worker reference is supplied", () => {
    const first = registerPatient(seedStore(), input);
    const again = registerPatient(first.store, { ...input, reference: "REF-HW1002" });
    expect(again.restored).toBe(true);
    expect(again.patient.id).toBe(first.patient.id);
    expect(again.patient.worker).toBe("HW1001");
    expect(again.store.incentives).toEqual(first.store.incentives);
  });
  it("rejects invalid worker references and team mobile duplicates", () => {
    expect(() => registerPatient(seedStore(), { ...input, reference: "REF-UNKNOWN" })).toThrow();
    expect(() => registerPatient(seedStore(), { ...input, mobile: "9876543211" })).toThrow();
  });
  it("applies configurable rates and survey eligibility without duplicate incentives", () => {
    const base = seedStore();
    base.rules = { ...base.rules, rate: 75, requireSurvey: true };
    const result = registerPatient(base, input);
    expect(result.store.incentives.filter((i) => i.patientId === result.patient.id)).toHaveLength(
      0,
    );
    result.store.surveys.push({
      id: "TEST",
      patientId: result.patient.id,
      workerId: "HW1001",
      date: "2026-10-12",
      conditions: [],
      medication: "",
      notes: "",
      consent: true,
      status: "Completed",
    });
    const eligible = ensureEligibility(result.store, result.patient.id);
    expect(eligible.incentives.find((i) => i.patientId === result.patient.id)?.amount).toBe(75);
    expect(ensureEligibility(eligible, result.patient.id).incentives).toHaveLength(
      eligible.incentives.length,
    );
  });
  it("scopes medical information to patients and their assigned worker", () => {
    const store = seedStore();
    expect(
      visiblePatients(store, { role: "worker", id: "HW1001" }).every((p) => p.worker === "HW1001"),
    ).toBe(true);
    expect(
      visibleSurveys(store, { role: "patient", id: "PT10001" }).every(
        (s) => s.patientId === "PT10001",
      ),
    ).toBe(true);
    expect(visibleSurveys(store, { role: "sales", id: "SR0204" })).toEqual([]);
  });
  it("requires an admin, active worker and reason for reassignment, retaining incentive attribution", () => {
    const store = seedStore();
    expect(() =>
      assignPatient(store, { role: "worker", id: "HW1001" }, "PT10001", "HW1002", "Reason"),
    ).toThrow();
    expect(() =>
      assignPatient(store, { role: "admin", id: "ADM001" }, "PT10001", "HW1002", ""),
    ).toThrow();
    expect(() =>
      assignPatient(store, { role: "admin", id: "ADM001" }, "PT10001", "INVALID", "Reason"),
    ).toThrow();
    const next = assignPatient(
      store,
      { role: "admin", id: "ADM001" },
      "PT10001",
      "HW1002",
      "Local support requested",
    );
    expect(next.patients.find((p) => p.id === "PT10001")?.worker).toBe("HW1002");
    expect(next.incentives.find((i) => i.patientId === "PT10001")?.workerId).toBe("HW1001");
    expect(next.audit[0]?.reason).toBe("Local support requested");
    expect(
      visibleSurveys(next, { role: "worker", id: "HW1001" }).some((s) => s.patientId === "PT10001"),
    ).toBe(false);
  });
  it("persists and reloads the demo while retaining account relationships", () => {
    const first = registerPatient(seedStore(), input);
    localStorage.setItem(STORE_KEY, JSON.stringify(first.store));
    const loaded = loadDemo();
    expect(loaded.patients.find((p) => p.id === first.patient.id)).toEqual(first.patient);
    localStorage.removeItem(STORE_KEY);
  });
  it("rejects inactive or mismatched demo sessions", () => {
    expect(accountFor(seedStore(), { role: "admin", id: "HW1001" })).toBeUndefined();
    const store = seedStore();
    store.team[0]!.status = "Inactive";
    expect(accountFor(store, { role: "worker", id: "HW1001" })).toBeUndefined();
  });
});
describe("Demo checkout", () => {
  it("snapshots selected items, decrements stock and records simulated payment", () => {
    const store = seedStore();
    const next = createOrder(
      store,
      { role: "patient", id: "PT10001" },
      "PT10001",
      { "MED-01": 2 },
      "Demo Pune address",
      "UPI",
    );
    expect(next.orders[0]?.amount).toBe(698);
    expect(next.orders[0]?.payment).toBe("Simulated paid");
    expect(next.medicines[0]?.stock).toBe(store.medicines[0]!.stock - 2);
    expect(next.orders[0]?.patientId).toBe("PT10001");
  });
  it("honors selected sales customer and leaves cash on delivery pending", () => {
    const next = createOrder(
      seedStore(),
      { role: "sales", id: "SR0204" },
      "PT10002",
      { "MED-02": 3 },
      "Demo Satara",
      "Cash on delivery",
    );
    expect(next.orders[0]?.patientId).toBe("PT10002");
    expect(next.orders[0]?.salesId).toBe("SR0204");
    expect(next.orders[0]?.payment).toBe("Pending");
  });
  it("rejects overselling, fractional quantities, empty carts and patient impersonation", () => {
    const store = seedStore();
    const s = { role: "patient" as const, id: "PT10001" };
    expect(() => createOrder(store, s, "PT10001", { "MED-01": 999 }, "Demo Pune", "UPI")).toThrow();
    expect(() => createOrder(store, s, "PT10001", { "MED-01": 1.5 }, "Demo Pune", "UPI")).toThrow();
    expect(() => createOrder(store, s, "PT10001", {}, "Demo Pune", "UPI")).toThrow();
    expect(() => createOrder(store, s, "PT10002", { "MED-01": 1 }, "Demo Pune", "UPI")).toThrow();
  });
});
