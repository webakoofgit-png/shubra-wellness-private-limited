import { describe, expect, it } from "vitest";

import { calculateIncentive, initialPatients, reassignPatient } from "@/lib/demo-data";

describe("demo rules", () => {
  it("calculates incentive using the configured rate, not a fixed amount", () => {
    expect(calculateIncentive(110, 75)).toBe(8250);
  });

  it("keeps one primary worker and adds an auditable reassignment event", () => {
    const result = reassignPatient(initialPatients, [], "PT10001", "HW1002", "Patient requested local support");
    expect(result?.patients.find((patient) => patient.id === "PT10001")?.worker).toBe("HW1002");
    expect(result?.history).toEqual([{
      patientId: "PT10001",
      from: "HW1001",
      to: "HW1002",
      reason: "Patient requested local support",
      date: "12 Oct 2026",
    }]);
  });

  it("does not reassign without a reason or create an event for the current worker", () => {
    expect(reassignPatient(initialPatients, [], "PT10001", "HW1002", "  ")).toBeNull();
    expect(reassignPatient(initialPatients, [], "PT10001", "HW1001", "Keep current assignment")).toBeNull();
  });
});