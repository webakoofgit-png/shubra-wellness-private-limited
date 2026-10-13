import { useState } from "react";
import { Field } from "./context";
import { today, type PatientRecord, type Person } from "@/lib/wellness-service";
export type RegistrationInput = Omit<
  PatientRecord,
  "id" | "role" | "worker" | "joined" | "status" | "verified"
>;
export function PatientForm({
  t,
  mobile = "",
  reference = "",
  workers,
  onSave,
}: {
  t: (key: string) => string;
  mobile?: string;
  reference?: string;
  workers: Person[];
  onSave: (input: RegistrationInput) => void;
}) {
  const [consent, setConsent] = useState(false);
  return (
    <form
      className="form-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!consent) return;
        const f = new FormData(e.currentTarget);
        onSave({
          name: String(f.get("name")),
          mobile: String(f.get("mobile")),
          dob: String(f.get("dob")),
          gender: String(f.get("gender")),
          address: String(f.get("address")),
          state: String(f.get("state")),
          district: String(f.get("district")),
          pin: String(f.get("pin")),
          reference: String(f.get("reference")),
        });
      }}
    >
      <div className="form-grid">
        <Field label={t("Name")}>
          <input name="name" minLength={2} maxLength={100} required autoComplete="name" />
        </Field>
        <Field label={t("Mobile")}>
          <input
            name="mobile"
            defaultValue={mobile}
            readOnly={Boolean(mobile)}
            required
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
        <Field label={t("DOB")}>
          <input name="dob" type="date" max={today()} min="1900-01-01" required />
        </Field>
        <Field label={t("Gender")}>
          <select name="gender" required>
            <option value="">{t("Gender")}</option>
            {["Male", "Female", "Other", "Prefer not to say"].map((value) => (
              <option value={value} key={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Address")}>
          <input name="address" required maxLength={250} autoComplete="street-address" />
        </Field>
        <Field label={t("State")}>
          <select name="state" required>
            <option>Maharashtra</option>
            <option>Karnataka</option>
            <option>Goa</option>
            <option>Gujarat</option>
            <option>Madhya Pradesh</option>
          </select>
        </Field>
        <Field label={t("District")}>
          <input name="district" required maxLength={80} />
        </Field>
        <Field label={t("PIN")}>
          <input
            name="pin"
            required
            pattern="[0-9]{6}"
            maxLength={6}
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </Field>
        <Field label={t("Reference")}>
          <select name="reference" defaultValue={reference} required>
            <option value="">{t("Reference")}</option>
            {workers.map((w) => (
              <option key={w.id} value={`REF-${w.id}`}>
                REF-{w.id} · {w.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span>{t("Registration consent")}</span>
      </label>
      <button className="btn" disabled={!consent}>
        {t("Register")}
      </button>
    </form>
  );
}
