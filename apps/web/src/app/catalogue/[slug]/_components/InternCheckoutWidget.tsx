"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/toast";
import type { PackageDetail } from "@/lib/api-types";

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
};

interface InternshipProgram {
  id: string;
  name: string;
  price: number;
}

interface Props {
  pkg: PackageDetail;
}

export function InternCheckoutWidget({ pkg }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [fields, setFields] = useState<InternField[]>([]);
  const [program, setProgram] = useState<InternshipProgram | null>(null);
  const [loadingFields, setLoadingFields] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api
      .get<{ fields: InternField[] }>("/api/interns/fields")
      .then((res) => setFields(res.fields ?? []))
      .catch(() => setFields([]))
      .finally(() => setLoadingFields(false));
    api
      .get<{ program: InternshipProgram | null }>("/api/interns/program")
      .then((res) => setProgram(res.program ?? null))
      .catch(() => setProgram(null));
  }, []);

  const selectedField = fields.find((f) => f.id === fieldId) ?? null;

  const programFee = program?.price && program.price > 0 ? program.price : null;

  const formatPrice = (amount: number) =>
    `₹${(amount / 100).toLocaleString("en-IN")}`;

  const openRazorpayCheckout = (
    orderData: ApplyResult,
  ): Promise<void> => {
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
          name: "LMS Portal",
          description: selectedField
            ? `${pkg.name} — ${selectedField.name}`
            : pkg.name,
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

  // Form / collecting info
  if (step === "form" || step === "error") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Internship Application
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose your field of interest and pay the internship fee.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field w-full text-sm"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="field w-full text-sm"
              placeholder="Your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field w-full text-sm"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Designation
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "WORKING", label: "Working" },
                { value: "STUDYING", label: "Studying" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setDesignation(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    designation === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-card-hover"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Choose Your Field <span className="text-danger">*</span>
            </label>
            {loadingFields ? (
              <div className="h-24 w-full animate-pulse rounded-lg bg-card-hover border border-border" />
            ) : fields.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border px-3 py-3">
                No internship fields are currently open.
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field) => (
                  <label
                    key={field.id}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      fieldId === field.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-card-hover"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="intern-field"
                        value={field.id}
                        checked={fieldId === field.id}
                        onChange={() => setFieldId(field.id)}
                        className="accent-primary"
                      />
                      <span className="font-medium text-foreground">
                        {field.name}
                      </span>
                    </span>
                    {field.description && (
                      <span className="hidden sm:block text-xs text-muted-foreground text-right">
                        {field.description}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {programFee && (
            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5">
              <span className="text-sm font-medium text-foreground">
                Internship Fee
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatPrice(programFee)}
              </span>
            </div>
          )}

          {step === "error" && errorMsg && (
            <p className="text-sm text-danger">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={
              loading || !designation || !fieldId || !programFee || fields.length === 0
            }
            className="w-full py-3 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : programFee
                ? `Pay ${formatPrice(programFee)} & Apply`
                : "Internship applications are closed"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            🔒 Secure payment via Razorpay
          </p>
        </form>
      </div>
    );
  }

  // Processing states
  if (
    step === "creating_order" ||
    step === "processing_payment" ||
    step === "verifying"
  ) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
        <div className="text-center py-8">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {step === "creating_order" && "Setting up payment..."}
            {step === "processing_payment" && "Opening payment window..."}
            {step === "verifying" && "Verifying payment..."}
          </p>
        </div>
      </div>
    );
  }

  // Complete
  if (step === "complete") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-foreground font-medium">
            Application submitted successfully!
          </p>
          <p className="text-sm text-muted-foreground">
            Thank you, {name.split(" ")[0] || "intern"}! Your internship
            application for{" "}
            <span className="font-medium text-foreground">
              {selectedField?.name}
            </span>{" "}
            has been received. Keep an eye on your email for session
            schedules.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
