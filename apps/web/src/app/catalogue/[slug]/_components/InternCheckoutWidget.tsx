"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/toast";
import type { PackageDetail } from "@/lib/api-types";
import {
  IconCode,
  IconServer,
  IconShieldLock,
  IconPalette,
  IconChartBar,
  IconRobot,
  IconBuildingBank,
  IconCheck,
  IconBriefcase,
  IconSchool,
  IconUser,
  IconMail,
  IconPhone,
  IconStar,
  IconArrowRight,
} from "@tabler/icons-react";

type Step =
  | "form"
  | "creating_order"
  | "processing_payment"
  | "verifying"
  | "complete"
  | "error";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface ApplyResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: string;
}

type InternField = {
  id: string;
  name: string;
  description: string | null;
  fee: number;
};

interface Props {
  pkg: PackageDetail;
}

// ── Mock data shown when the live backend is unavailable (demo mode) ─────────
const MOCK_FIELDS: InternField[] = [
  {
    id: "mock-web",
    name: "Web Development",
    description: "React, Next.js, Node.js — build modern web apps",
    fee: 299900,
  },
  {
    id: "mock-backend",
    name: "Backend Development",
    description: "APIs, databases, and scalable server architecture",
    fee: 349900,
  },
  {
    id: "mock-cyber",
    name: "Cybersecurity",
    description: "Ethical hacking, network security, and compliance",
    fee: 399900,
  },
  {
    id: "mock-uiux",
    name: "UI/UX Design",
    description: "Figma, design systems, and user research",
    fee: 279900,
  },
  {
    id: "mock-data",
    name: "Data Analytics",
    description: "SQL, Python, dashboards, and storytelling with data",
    fee: 249900,
  },
];

const FIELD_ICONS: Record<string, React.ReactNode> = {
  Web: <IconCode size={22} stroke={1.6} />,
  Backend: <IconServer size={22} stroke={1.6} />,
  Cyber: <IconShieldLock size={22} stroke={1.6} />,
  UI: <IconPalette size={22} stroke={1.6} />,
  Data: <IconChartBar size={22} stroke={1.6} />,
};

function fieldIcon(name: string): React.ReactNode {
  if (/web/i.test(name)) return FIELD_ICONS.Web;
  if (/back/i.test(name)) return FIELD_ICONS.Backend;
  if (/cyber|secur|hack/i.test(name)) return FIELD_ICONS.Cyber;
  if (/ui|ux|design/i.test(name)) return FIELD_ICONS.UI;
  if (/data|analyt/i.test(name)) return FIELD_ICONS.Data;
  return <IconRobot size={22} stroke={1.6} />;
}

function fieldColor(name: string): string {
  if (/web/i.test(name)) return "from-sky-500 to-blue-600";
  if (/back/i.test(name)) return "from-emerald-500 to-teal-600";
  if (/cyber|secur|hack/i.test(name)) return "from-rose-500 to-red-600";
  if (/ui|ux|design/i.test(name)) return "from-fuchsia-500 to-purple-600";
  if (/data|analyt/i.test(name)) return "from-amber-500 to-orange-600";
  return "from-indigo-500 to-violet-600";
}

function CheckoutLogoHeader({ pkg }: { pkg: PackageDetail }) {
  return (
    <div className="mb-6 px-5 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Image
            src="/images/logo.svg"
            alt="Marvel Slice"
            width={28}
            height={28}
            className="h-7 w-auto"
          />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Marvel Slice
          </p>
          <p className="text-sm font-bold text-foreground">
            {pkg.name || "Internship Program"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function InternCheckoutWidget({ pkg }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [fields, setFields] = useState<InternField[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api
      .get<{ fields: InternField[] }>("/api/interns/fields")
      .then((res) => {
        const live = res.fields ?? [];
        if (live.length > 0) {
          setFields(live);
        } else {
          setFields(MOCK_FIELDS);
        }
      })
      .catch(() => setFields(MOCK_FIELDS))
      .finally(() => setLoadingFields(false));
  }, []);

  const selectedField = useMemo(
    () => fields.find((f) => f.id === fieldId) ?? null,
    [fields, fieldId],
  );

  const fee = selectedField?.fee && selectedField.fee > 0 ? selectedField.fee : null;

  const formatPrice = (amount: number) =>
    `₹${(amount / 100).toLocaleString("en-IN")}`;

  const openRazorpayCheckout = (orderData: ApplyResult): Promise<void> => {
    return new Promise((resolve, reject) => {
      setStep("processing_payment");

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Marvel Slice",
          description: selectedField
            ? `${pkg.name} — ${selectedField.name}`
            : pkg.name,
          image: "/images/Marvel_logo.png",
          order_id: orderData.orderId,
          handler: async function (response: RazorpayResponse) {
            setStep("verifying");
            try {
              await api.post("/api/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setStep("complete");
              resolve();
            } catch (err: unknown) {
              setErrorMsg(getErrorMessage(err));
              setStep("error");
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setStep("form");
              reject(new Error("Payment cancelled"));
            },
          },
          prefill: {
            name,
            email,
            contact: phone || undefined,
          },
          theme: { color: "#6d7dff" },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        setErrorMsg("Failed to load payment gateway. Please try again.");
        setStep("error");
        reject(new Error("Failed to load Razorpay SDK"));
      };

      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await api.post<ApplyResult>("/api/interns/apply", {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        designation,
        fieldId,
      });
      await openRazorpayCheckout(result);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  // ── Main application form ────────────────────────────────────────────────────
  if (step === "form" || step === "error") {
    return (
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-primary/5">
        <CheckoutLogoHeader pkg={pkg} />

        <div className="px-6 pb-6">
          {/* Step indicator */}
          <div className="mb-5 flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    n === 1
                      ? "bg-primary text-white"
                      : "bg-muted text-white"
                  }`}
                >
                  {n}
                </div>
                <div
                  className={`h-0.5 flex-1 rounded ${
                    n < 3 ? "bg-border" : ""
                  }`}
                />
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal details */}
            <section>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <IconUser size={14} /> Your Details
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <IconUser
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="field w-full text-sm"
                      style={{ paddingLeft: "2.4rem" }}
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Email <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <IconMail
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field w-full text-sm"
                      style={{ paddingLeft: "2.4rem" }}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Phone
                  </label>
                  <div className="relative">
                    <IconPhone
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="field w-full text-sm"
                      style={{ paddingLeft: "2.4rem" }}
                      placeholder="Your phone number"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Designation */}
            <section>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <IconBriefcase size={14} /> Designation
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "WORKING", label: "Working", icon: <IconBriefcase size={16} /> },
                  { value: "STUDYING", label: "Studying", icon: <IconSchool size={16} /> },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setDesignation(opt.value)}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                      designation === opt.value
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border text-muted-foreground hover:bg-card-hover"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Field selection */}
            <section>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <IconStar size={14} /> Choose Your Field{" "}
                <span className="text-danger">*</span>
              </p>
              {loadingFields ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg border border-border bg-card-hover"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field) => {
                    const active = fieldId === field.id;
                    return (
                      <label
                        key={field.id}
                        className={`flex cursor-pointer items-center gap-3 overflow-hidden rounded-lg border px-3 py-2.5 transition-all ${
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-card-hover"
                        }`}
                      >
                        <input
                          type="radio"
                          name="intern-field"
                          value={field.id}
                          checked={active}
                          onChange={() => setFieldId(field.id)}
                          className="sr-only"
                        />
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm ${fieldColor(
                            field.name,
                          )}`}
                        >
                          {fieldIcon(field.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {field.name}
                          </p>
                          {field.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {field.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 text-sm font-bold ${
                            active ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {field.fee > 0 ? formatPrice(field.fee) : "Closed"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Fee summary */}
            {fee && (
              <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {selectedField?.name} — Internship Fee
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      One-time fee · No hidden charges
                    </p>
                  </div>
                  <p className="text-xl font-extrabold text-foreground">
                    {formatPrice(fee)}
                  </p>
                </div>
              </div>
            )}

            {step === "error" && errorMsg && (
              <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !designation || !fieldId || !fee || fields.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover disabled:opacity-50 disabled:shadow-none"
            >
              {loading
                ? "Please wait..."
                : fee
                  ? `Pay ${formatPrice(fee)} & Apply`
                  : "Select a field to continue"}
              {!loading && <IconArrowRight size={16} />}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <IconBuildingBank size={13} />
              Powered by Razorpay · Your details are safe with us
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (
    step === "creating_order" ||
    step === "processing_payment" ||
    step === "verifying"
  ) {
    return (
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card">
        <CheckoutLogoHeader pkg={pkg} />
        <div className="px-6 pb-6">
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-foreground">
              {step === "creating_order" && "Setting up your payment..."}
              {step === "processing_payment" && "Opening secure payment window..."}
              {step === "verifying" && "Verifying your payment..."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Please don&apos;t close this window
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card">
        <CheckoutLogoHeader pkg={pkg} />
        <div className="px-6 pb-6">
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
              <IconCheck size={32} className="text-success" stroke={2.5} />
            </div>
            <p className="text-base font-semibold text-foreground">
              Application submitted successfully!
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Thank you, {name.split(" ")[0] || "intern"}! Your internship
              application for{" "}
              <span className="font-medium text-foreground">
                {selectedField?.name ?? pkg.name}
              </span>{" "}
              has been received.
            </p>
            <div className="mt-5 rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-left">
              <p className="text-xs font-semibold text-success">
                What happens next?
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li>• You&apos;ll receive a confirmation email shortly.</li>
                <li>• Our team will reach out with session schedules.</li>
                <li>• Your certificate will be issued on completion.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card">
      <CheckoutLogoHeader pkg={pkg} />
      <div className="px-6 pb-6">
        <div className="py-6 text-center">
          <p className="text-sm text-danger">
            {errorMsg || "Something went wrong."}
          </p>
          <button
            onClick={() => setStep("form")}
            className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
