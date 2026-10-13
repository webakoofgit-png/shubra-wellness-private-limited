import { useState } from "react";
import { Leaf, Plus, ShoppingCart, PackageCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge, Empty, Field, Panel, csvDownload, useWellness } from "./context";
import {
  addNotice,
  createOrder,
  money,
  today,
  uid,
  visiblePatients,
  type Medicine,
  type Order,
} from "@/lib/wellness-service";
import productImage from "@/assets/ayurvedic-products.jpg";

export function Catalogue() {
  const { store, session, t, cart, setCart, go, update, notify } = useWellness();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [detail, setDetail] = useState<Medicine | null>(null);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [categories, setCategories] = useState(false);
  const admin = session.role === "admin";
  const products = store.medicines.filter(
    (m) =>
      `${m.name} ${m.description}`.toLowerCase().includes(search.toLowerCase()) &&
      (!category || m.category === category),
  );
  function add(m: Medicine, buy = false) {
    if ((cart[m.id] ?? 0) >= m.stock) {
      notify("Quantity exceeds available stock");
      return;
    }
    setCart({ ...cart, [m.id]: (cart[m.id] ?? 0) + 1 });
    notify(`${t("Add to cart")} · ${m.name}`);
    if (buy) go("Cart");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">AYURVEDIC WELLNESS</span>
          <h1>{t("Medicines")}</h1>
          <p>
            Traditional wellness essentials. Consult a qualified practitioner; no treatment or cure
            claims.
          </p>
        </div>
        {admin ? (
          <div className="button-row">
            <button className="btn secondary" onClick={() => setCategories(true)}>
              {t("Category")}
            </button>
            <button
              className="btn"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={17} />
              {t("Add medicine")}
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => go("Cart")}>
            <ShoppingCart size={17} />
            {t("Cart")} ({Object.values(cart).reduce((sum, q) => sum + q, 0)})
          </button>
        )}
      </div>
      <div className="toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t("Search")}
          placeholder={t("Search")}
        />
        <select
          aria-label={t("Category")}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t("All")}</option>
          {store.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span>
          {products.length} {t("Medicines")}
        </span>
      </div>
      <div className="product-grid">
        {products.map((m, i) => (
          <article className="product-card" key={m.id}>
            <button
              className={`product-art tone-${i % 3}`}
              onClick={() => setDetail(m)}
              aria-label={`${t("Details")} ${m.name}`}
            >
              {m.image ? (
                <img src={m.image} alt={m.name} />
              ) : (
                <>
                  <div className="bottle">
                    <div className="bottle-cap" />
                    <div className="bottle-label">
                      <Leaf size={23} />
                      <small>SHRI SHUBHRA</small>
                      <strong>{m.name.split(" ")[0]}</strong>
                      <span>AYURVEDIC WELLNESS</span>
                    </div>
                  </div>
                  <Leaf className="product-leaf" size={76} strokeWidth={1} />
                </>
              )}
              <span className="stock-tag">
                {t("Stock")}: {m.stock}
              </span>
            </button>
            <div className="product-copy">
              <small>{m.category}</small>
              <h3>{m.name}</h3>
              <p>{m.description}</p>
              <div className="product-footer">
                <strong>{money(m.price)}</strong>
                <button className="btn small" disabled={!m.stock} onClick={() => add(m)}>
                  <Plus size={16} />
                  {t("Add to cart")}
                </button>
              </div>
              <div className="button-row">
                <button className="text-btn" onClick={() => setDetail(m)}>
                  {t("Details")}
                </button>
                {admin && (
                  <>
                    <button
                      className="text-btn"
                      onClick={() => {
                        setEditing(m);
                        setOpen(true);
                      }}
                    >
                      {t("Edit")}
                    </button>
                    <button className="text-btn danger" onClick={() => setDeleting(m.id)}>
                      {t("Delete")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!products.length && <Empty />}
      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="wide-dialog">
          <DialogTitle>{detail?.name}</DialogTitle>
          <DialogDescription>Ayurvedic wellness product · Fictional catalogue</DialogDescription>
          {detail && (
            <>
              <div className="medicine-gallery">
                <img src={detail.image || productImage} alt={detail.name} />
                <div>
                  <Leaf size={42} />
                  <strong>{detail.name}</strong>
                </div>
              </div>
              <div className="details-grid">
                {[
                  ["Description", detail.description],
                  ["Ingredients", detail.ingredients],
                  ["Usage", detail.usage],
                  ["Stock", String(detail.stock)],
                  ["Price", money(detail.price)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <small>{t(k!)}</small>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
              <div className="button-row">
                <button className="btn" disabled={!detail.stock} onClick={() => add(detail)}>
                  {t("Add to cart")}
                </button>
                <button
                  className="btn secondary"
                  disabled={!detail.stock}
                  onClick={() => {
                    add(detail, true);
                    setDetail(null);
                  }}
                >
                  {t("Buy now")}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="wide-dialog">
          <DialogTitle>{t(editing ? "Edit" : "Add medicine")}</DialogTitle>
          <DialogDescription>
            Descriptions must not make unverified medical claims.
          </DialogDescription>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const row: Medicine = {
                id: editing?.id ?? uid("MED"),
                name: String(f.get("name")),
                category: String(f.get("category")),
                price: Number(f.get("price")),
                stock: Number(f.get("stock")),
                description: String(f.get("description")),
                ingredients: String(f.get("ingredients")),
                usage: String(f.get("usage")),
                image: editing?.image ?? "",
              };
              if (
                !Number.isFinite(row.price) ||
                row.price < 0 ||
                !Number.isInteger(row.stock) ||
                row.stock < 0
              ) {
                notify(t("Invalid"));
                return;
              }
              const file = f.get("image");
              const save = (image: string) => {
                update((s) => ({
                  ...s,
                  medicines: editing
                    ? s.medicines.map((m) => (m.id === editing.id ? { ...row, image } : m))
                    : [...s.medicines, { ...row, image }],
                }));
                setOpen(false);
                notify(t("Saved"));
              };
              if (file instanceof File && file.size) {
                if (
                  file.size > 750000 ||
                  !["image/png", "image/jpeg", "image/webp"].includes(file.type)
                ) {
                  notify("Upload a PNG, JPEG or WebP under 750 KB");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => save(String(reader.result));
                reader.onerror = () => notify(t("Invalid"));
                reader.readAsDataURL(file);
              } else save(row.image);
            }}
          >
            <div className="form-grid">
              <Field label={t("Name")}>
                <input name="name" defaultValue={editing?.name} required maxLength={120} />
              </Field>
              <Field label={t("Category")}>
                <select name="category" defaultValue={editing?.category}>
                  {store.categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("Price")}>
                <input
                  name="price"
                  type="number"
                  min={0}
                  max={100000}
                  step="0.01"
                  defaultValue={editing?.price}
                  required
                />
              </Field>
              <Field label={t("Stock")}>
                <input
                  name="stock"
                  type="number"
                  min={0}
                  max={100000}
                  step={1}
                  defaultValue={editing?.stock}
                  required
                />
              </Field>
            </div>
            {[
              ["Description", "description"],
              ["Ingredients", "ingredients"],
              ["Usage", "usage"],
            ].map(([label, key]) => (
              <Field key={key} label={t(label!)}>
                <textarea
                  name={key}
                  defaultValue={editing ? (editing as unknown as Record<string, string>)[key!] : ""}
                  required
                  maxLength={1500}
                />
              </Field>
            ))}
            <Field label="Product image · PNG / JPEG / WebP · 750 KB max">
              <input name="image" type="file" accept="image/png,image/jpeg,image/webp" />
            </Field>
            <button className="btn">{t("Save")}</button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting("");
        }}
      >
        <DialogContent>
          <DialogTitle>{t("Delete")}</DialogTitle>
          <DialogDescription>
            Remove this medicine from the demo catalogue? Existing order snapshots will be retained.
          </DialogDescription>
          <button
            className="btn danger"
            onClick={() => {
              update((s) => ({ ...s, medicines: s.medicines.filter((m) => m.id !== deleting) }));
              const next = { ...cart };
              delete next[deleting];
              setCart(next);
              setDeleting("");
              notify(t("Saved"));
            }}
          >
            {t("Delete")}
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={categories} onOpenChange={setCategories}>
        <DialogContent>
          <DialogTitle>{t("Category")}</DialogTitle>
          <DialogDescription>Manage catalogue categories</DialogDescription>
          {store.categories.map((c) => (
            <div className="list-row" key={c}>
              <span>{c}</span>
              <button
                className="text-btn danger"
                disabled={
                  store.medicines.some((m) => m.category === c) || store.categories.length === 1
                }
                onClick={() =>
                  update((s) => ({ ...s, categories: s.categories.filter((x) => x !== c) }))
                }
              >
                {t("Delete")}
              </button>
            </div>
          ))}
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              const name = String(new FormData(e.currentTarget).get("category")).trim();
              if (!name || store.categories.includes(name)) {
                notify(t("Invalid"));
                return;
              }
              update((s) => ({ ...s, categories: [...s.categories, name] }));
              e.currentTarget.reset();
            }}
          >
            <Field label={t("Category")}>
              <input name="category" required maxLength={80} />
            </Field>
            <button className="btn">{t("Save")}</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Checkout() {
  const { store, session, t, cart, setCart, go, update, notify } = useWellness();
  const patients = visiblePatients(store, session).filter((p) => p.status === "Active");
  const [customer, setCustomer] = useState(
    session.role === "patient" ? session.id : (patients[0]?.id ?? ""),
  );
  const [address, setAddress] = useState(
    patients.find((p) => p.id === (session.role === "patient" ? session.id : patients[0]?.id))
      ?.address ?? "",
  );
  const [method, setMethod] = useState("Cash on delivery");
  const [confirmed, setConfirmed] = useState<Order | null>(null);
  const items = Object.entries(cart)
    .filter(([id, q]) => q > 0 && store.medicines.some((m) => m.id === id))
    .map(([id, q]) => ({ medicine: store.medicines.find((m) => m.id === id)!, quantity: q }));
  const total = items.reduce((sum, i) => sum + i.medicine.price * i.quantity, 0);
  if (confirmed)
    return (
      <div className="success-state panel">
        <PackageCheck size={55} />
        <span className="eyebrow">DEMO ORDER CONFIRMATION</span>
        <h1>{t("Success")}</h1>
        <p>{confirmed.id}</p>
        <strong>
          {money(confirmed.amount)} · {t(confirmed.payment)}
        </strong>
        <p>{confirmed.address}</p>
        <p className="notice">No payment was taken and no real shipment will be made.</p>
        <div className="button-row">
          <button className="btn" onClick={() => go("Orders")}>
            {t("Orders")}
          </button>
          <button className="btn secondary" onClick={() => go("Medicines")}>
            {t("Medicines")}
          </button>
        </div>
      </div>
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SIMULATED CHECKOUT</span>
          <h1>{t("Cart")}</h1>
          <p>No real payment credentials are collected.</p>
        </div>
        <button className="btn secondary" onClick={() => go("Medicines")}>
          {t("Medicines")}
        </button>
      </div>
      {!items.length ? (
        <Panel title={t("Cart")}>
          <Empty />
          <button className="btn" onClick={() => go("Medicines")}>
            {t("Medicines")}
          </button>
        </Panel>
      ) : (
        <div className="two-col">
          <Panel title={t("Cart")}>
            {items.map(({ medicine: m, quantity: q }) => (
              <div className="cart-row" key={m.id}>
                <span className="cart-icon">
                  <Leaf />
                </span>
                <div>
                  <strong>{m.name}</strong>
                  <p>
                    {money(m.price)} · {t("Stock")}: {m.stock}
                  </p>
                </div>
                <Field label={t("Quantity")}>
                  <input
                    aria-label={`${t("Quantity")} ${m.name}`}
                    type="number"
                    min={1}
                    max={m.stock}
                    value={q}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isInteger(n) && n >= 1 && n <= m.stock)
                        setCart({ ...cart, [m.id]: n });
                    }}
                  />
                </Field>
                <strong>{money(m.price * q)}</strong>
                <button
                  className="text-btn danger"
                  onClick={() => {
                    const next = { ...cart };
                    delete next[m.id];
                    setCart(next);
                  }}
                >
                  {t("Remove")}
                </button>
              </div>
            ))}
          </Panel>
          <Panel title={t("Place order")}>
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  const next = createOrder(store, session, customer, cart, address, method);
                  update(() => next);
                  setConfirmed(next.orders[0]!);
                  setCart({});
                } catch (error) {
                  notify(error instanceof Error ? t(error.message) : t("Invalid"));
                }
              }}
            >
              <Field label={t("Customer")}>
                <select
                  value={customer}
                  disabled={session.role === "patient"}
                  onChange={(e) => {
                    setCustomer(e.target.value);
                    setAddress(patients.find((p) => p.id === e.target.value)?.address ?? "");
                  }}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.id}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Address")}>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  minLength={5}
                  maxLength={500}
                />
              </Field>
              <Field label={t("Payment method")}>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  {["Cash on delivery", "UPI", "Debit Card", "Credit Card", "Net Banking"].map(
                    (m) => (
                      <option key={m} value={m}>
                        {t(m)}
                      </option>
                    ),
                  )}
                </select>
              </Field>
              <p className="notice">
                {method === "Cash on delivery"
                  ? "No money collected. Demo payment remains pending."
                  : "Demo success only. No bank or card details required."}
              </p>
              <div className="checkout-total">
                <span>{t("Total")}</span>
                <strong>{money(total)}</strong>
              </div>
              <button className="btn">{t("Place order")}</button>
            </form>
          </Panel>
        </div>
      )}
    </>
  );
}

export function useOrders() {
  const { store, session } = useWellness();
  return store.orders.filter(
    (o) =>
      session.role === "admin" ||
      (session.role === "patient" && o.patientId === session.id) ||
      (session.role === "sales" && o.salesId === session.id),
  );
}
export function Orders() {
  const { store, session, t, update, notify, go } = useWellness();
  const orders = useOrders();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const rows = orders.filter(
    (o) =>
      (!status || o.status === status) &&
      `${o.id} ${store.patients.find((p) => p.id === o.patientId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const admin = session.role === "admin";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ORDER MANAGEMENT</span>
          <h1>{t("Orders")}</h1>
          <p>Demo fulfilment and payment records</p>
        </div>
        <button className="btn" onClick={() => go("Medicines")}>
          <Plus size={17} />
          {t("Place order")}
        </button>
      </div>
      <Panel title={t("Orders")}>
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
            {["Placed", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map((s) => (
              <option key={s} value={s}>
                {t(s)}
              </option>
            ))}
          </select>
          <button
            className="btn secondary small"
            onClick={() =>
              csvDownload("orders", [
                ["ID", "Patient", "Date", "Amount", "Payment", "Status"],
                ...rows.map((o) => [o.id, o.patientId, o.date, o.amount, o.payment, o.status]),
              ])
            }
          >
            {t("Export")}
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Orders",
                  "Customer",
                  "Total",
                  "Payment method",
                  "Payments",
                  "Status",
                  "Details",
                ].map((k) => (
                  <th key={k}>{t(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong className="id">{o.id}</strong>
                    <small>{o.date}</small>
                  </td>
                  <td>
                    {store.patients.find((p) => p.id === o.patientId)?.name}
                    <small>{o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</small>
                  </td>
                  <td>{money(o.amount)}</td>
                  <td>{t(o.method)}</td>
                  <td>
                    <Badge value={o.payment} />
                  </td>
                  <td>
                    {admin ? (
                      <select
                        aria-label={`${t("Status")} ${o.id}`}
                        value={o.status}
                        onChange={(e) => {
                          const status = e.target.value;
                          update((s) => {
                            let next = {
                              ...s,
                              orders: s.orders.map((row) =>
                                row.id === o.id ? { ...row, status } : row,
                              ),
                              audit: [
                                {
                                  id: uid("AUD"),
                                  actor: session.id,
                                  date: today(),
                                  action: `${o.id}: ${status}`,
                                  reason: "Demo fulfilment update",
                                },
                                ...s.audit,
                              ],
                            };
                            if (status === "Shipped" || status === "Delivered")
                              next = addNotice(
                                next,
                                o.patientId,
                                status === "Shipped" ? "Order Shipped" : "Order Delivered",
                                o.id,
                              );
                            return next;
                          });
                          notify(t("Saved"));
                        }}
                      >
                        {[
                          "Placed",
                          "Confirmed",
                          "Processing",
                          "Shipped",
                          "Delivered",
                          "Cancelled",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {t(s)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge value={o.status} />
                    )}
                  </td>
                  <td>
                    <button className="text-btn" onClick={() => setDetail(o)}>
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
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{detail?.id}</DialogTitle>
          <DialogDescription>{detail?.date} · Demo order</DialogDescription>
          {detail && (
            <>
              <div className="order-timeline">
                {["Placed", "Confirmed", "Processing", "Shipped", "Delivered"].map((s, i) => (
                  <span
                    key={s}
                    className={
                      i <=
                      ["Placed", "Confirmed", "Processing", "Shipped", "Delivered"].indexOf(
                        detail.status,
                      )
                        ? "complete"
                        : ""
                    }
                  >
                    {t(s)}
                  </span>
                ))}
              </div>
              {detail.items.map((i) => (
                <div className="list-row" key={i.medicineId}>
                  <span>
                    {i.name} × {i.quantity}
                  </span>
                  <strong>{money(i.price * i.quantity)}</strong>
                </div>
              ))}
              <p>
                {t("Address")}: {detail.address}
              </p>
              <p>
                {t("Payment method")}: {t(detail.method)} · {t(detail.payment)}
              </p>
              <strong>
                {t("Total")}: {money(detail.amount)}
              </strong>
              {detail.status === "Cancelled" && <Badge value="Cancelled" />}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Payments() {
  const { store, session, t } = useWellness();
  const orders = useOrders();
  const [status, setStatus] = useState("");
  const incentives = store.incentives.filter(
    (i) => session.role === "admin" || (session.role === "worker" && i.workerId === session.id),
  );
  const rows = [
    ...orders.map((o) => ({
      id: o.id,
      date: o.date,
      amount: o.amount,
      method: o.method,
      status: o.payment,
      reference: "Demo order",
    })),
    ...incentives.map((i) => ({
      id: i.id,
      date: i.paidDate || i.date,
      amount: i.amount,
      method: "Incentive",
      status: i.payment,
      reference: i.reference || "—",
    })),
  ].filter((r) => !status || r.status === status);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">DEMO LEDGER</span>
          <h1>{t("Payments")}</h1>
          <p>Fictional payment history. No bank transfers or payment gateway calls.</p>
        </div>
        <button
          className="btn secondary"
          onClick={() =>
            csvDownload("payments", [
              ["Reference", "Date", "Amount", "Method", "Status", "Payment reference"],
              ...rows.map((r) => [r.id, r.date, r.amount, r.method, r.status, r.reference]),
            ])
          }
        >
          {t("Export")}
        </button>
      </div>
      <Panel title={t("Payments")}>
        <div className="toolbar">
          <select
            aria-label={t("Status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("All")}</option>
            {["Pending", "Paid", "Simulated paid"].map((s) => (
              <option key={s} value={s}>
                {t(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Reference",
                  "Payment date",
                  "Total",
                  "Payment method",
                  "Status",
                  "Payment reference",
                ].map((k) => (
                  <th key={k}>{t(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="id">{r.id}</td>
                  <td>{r.date}</td>
                  <td>{money(r.amount)}</td>
                  <td>{t(r.method)}</td>
                  <td>
                    <Badge value={r.status} />
                  </td>
                  <td>{r.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty />}
        </div>
      </Panel>
    </>
  );
}
