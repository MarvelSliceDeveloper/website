"use client";

import { useState, useCallback } from "react";
import type { CataloguePackage } from "@/lib/api-types";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/toast";
import { toast } from "sonner";
import { PackageCard } from "./PackageCard";

type CheckoutStep =
  | "idle"
  | "collecting_info"
  | "creating_order"
  | "processing_payment"
  | "verifying"
  | "selecting_batch"
  | "complete"
  | "error";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface BatchOption {
  id: string;
  name: string;
  startDate: string;
  course: { id: string; title: string };
  seatsAvailable: number | null;
  status: string;
}

interface CataloguePageClientProps {
  packages: CataloguePackage[];
}

export function CataloguePageClient({ packages }: CataloguePageClientProps) {
  const [step, setStep] = useState<CheckoutStep>("idle");
  const [selectedPkg, setSelectedPkg] = useState<CataloguePackage | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const closeModal = useCallback(() => {
    setStep("idle");
    setSelectedPkg(null);
    setName("");
    setEmail("");
    setErrorMsg("");
    setPaymentId(null);
    setBatches([]);
    setSelectedBatchId("");
    setLoading(false);
  }, []);

  const handleBuyNow = useCallback(async (pkg: CataloguePackage) => {
    setSelectedPkg(pkg);
    setErrorMsg("");

    // Check if already logged in
    try {
      const me = await api.get<{ user: { name: string; email: string } }>("/api/auth/me");
      if (me?.user) {
        setName(me.user.name);
        setEmail(me.user.email);
        await createOrder(pkg, me.user.name, me.user.email);
        return;
      }
    } catch {
      // Not logged in — show the info collection form
    }

    setStep("collecting_info");
  }, []);

  const handleInfoSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;
    await createOrder(selectedPkg, name, email);
  }, [selectedPkg, name, email]);

  const createOrder = async (pkg: CataloguePackage, userName: string, userEmail: string) => {
    setStep("creating_order");
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await api.post<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        paymentId: string;
        isNewUser?: boolean;
      }>("/api/payments/create-order", {
        packageId: pkg.id,
        name: userName,
        email: userEmail,
      });

      setIsNewUser(result.isNewUser ?? false);
      setPaymentId(result.paymentId);

      await openRazorpayCheckout(result, pkg);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      setStep("error");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const openRazorpayCheckout = (
    orderData: { orderId: string; amount: number; currency: string; keyId: string },
    pkg: CataloguePackage,
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
          description: pkg.name,
          order_id: orderData.orderId,
          handler: async function (response: RazorpayResponse) {
            setStep("verifying");
            try {
              await api.post("/api/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              // Fetch available batches for post-payment selection
              const batchData = await api.get<BatchOption[]>("/api/payments/batches", {
                packageId: pkg.id,
              });
              setBatches(batchData || []);

              if (batchData && batchData.length > 0) {
                setStep("selecting_batch");
              } else {
                // No batches — submit consent enrollment
                await submitConsent();
              }
              resolve();
            } catch (err: unknown) {
              const msg = getErrorMessage(err);
              setErrorMsg(msg);
              setStep("error");
              toast.error(msg);
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setStep("idle");
              toast.error("Payment cancelled");
              reject(new Error("Payment cancelled"));
            },
          },
          prefill: {
            name,
            email,
          },
          theme: { color: "#6d7dff" },
        };

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

  const submitEnroll = async () => {
    if (!paymentId || !selectedBatchId) return;
    setLoading(true);

    try {
      const result = await api.post<{ isNewUser: boolean; email: string }>("/api/payments/enroll", {
        paymentId,
        batchId: selectedBatchId,
        name,
        email,
      });

      if (result.isNewUser && result.email) {
        toast.success(
          `Account created! Check ${result.email} for login credentials.`,
          { duration: 8000 },
        );
      }

      setStep("complete");
      toast.success("Enrolled successfully!");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitConsent = async () => {
    if (!paymentId) return;
    setLoading(true);

    try {
      await api.post("/api/payments/consent", { paymentId, name, email });
      setStep("complete");
      toast.success("Payment successful! An admin will contact you to complete enrollment.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!packages || packages.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No packages available at the moment.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} onBuyNow={handleBuyNow} />
        ))}
      </div>

      {/* Checkout Modal */}
      {step !== "idle" && selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {step === "collecting_info" && "Your Information"}
                {step === "selecting_batch" && "Select a Batch"}
                {step === "complete" && "Enrollment Complete!"}
                {(step === "creating_order" || step === "processing_payment" || step === "verifying") && "Processing..."}
                {step === "error" && "Error"}
              </h3>
              <button
                onClick={closeModal}
                className="text-muted hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info Collection Step */}
            {step === "collecting_info" && (
              <form onSubmit={handleInfoSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your details to continue with the purchase.
                </p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                    placeholder="your@email.com"
                  />
                </div>
                {errorMsg && (
                  <p className="text-sm text-danger">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {loading ? "Please wait..." : `Pay ₹${(selectedPkg.price! / 100).toLocaleString("en-IN")}`}
                </button>
              </form>
            )}

            {/* Batch Selection Step */}
            {step === "selecting_batch" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your payment was successful! Select a batch to enroll in:
                </p>
                {batches.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {batches.map((batch) => (
                      <label
                        key={batch.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedBatchId === batch.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border-hover"
                        }`}
                      >
                        <input
                          type="radio"
                          name="batch"
                          value={batch.id}
                          checked={selectedBatchId === batch.id}
                          onChange={(e) => setSelectedBatchId(e.target.value)}
                          className="accent-primary"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{batch.name}</p>
                          <p className="text-xs text-muted">
                            {batch.course?.title}{batch.startDate ? ` · Starts ${new Date(batch.startDate).toLocaleDateString()}` : ""}
                          </p>
                          {batch.seatsAvailable != null && (
                            <p className="text-xs text-muted">{batch.seatsAvailable} seats left</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">No batches available.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={submitConsent}
                    className="flex-1 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-card-hover transition-colors"
                  >
                    None — Contact me later
                  </button>
                  <button
                    onClick={submitEnroll}
                    disabled={!selectedBatchId || loading}
                    className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {loading ? "Enrolling..." : "Enroll Now"}
                  </button>
                </div>
              </div>
            )}

            {/* Complete Step */}
            {step === "complete" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-foreground">
                  Welcome aboard! {isNewUser && "Check your email for login credentials."}
                </p>
                <button
                  onClick={closeModal}
                  className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* Error Step */}
            {step === "error" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-danger text-sm">{errorMsg || "Something went wrong."}</p>
                <button
                  onClick={closeModal}
                  className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {/* Loading state for creating_order / processing_payment / verifying */}
            {(step === "creating_order" || step === "processing_payment" || step === "verifying") && (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {step === "creating_order" && "Setting up payment..."}
                  {step === "processing_payment" && "Opening payment window..."}
                  {step === "verifying" && "Verifying payment..."}
                </p>
              </div>
            )}

            {/* Price display for all pre-payment steps */}
            {(step === "collecting_info") && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{selectedPkg.name}</span>
                  <span className="font-semibold text-foreground">
                    ₹{(selectedPkg.price! / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
