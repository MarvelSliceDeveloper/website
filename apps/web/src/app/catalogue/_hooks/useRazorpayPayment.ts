"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/toast";

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
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface BatchOption {
  id: string;
  name: string;
  course?: { id: string; title: string };
  startDate?: string;
  seatsAvailable?: number | null;
}

interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: string;
  isNewUser?: boolean;
}

export function useRazorpayPayment() {
  const [step, setStep] = useState<CheckoutStep>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setStep("idle");
    setName("");
    setEmail("");
    setErrorMsg("");
    setPaymentId(null);
    setBatches([]);
    setSelectedBatchId("");
    setLoading(false);
  }, []);

  const createOrder = useCallback(
    async (pkgId: string, pkgName: string, pkgPrice: number) => {
      setStep("creating_order");
      setLoading(true);
      setErrorMsg("");

      try {
        const result = await api.post<CreateOrderResult>(
          "/api/payments/create-order",
          { packageId: pkgId, name, email }
        );

        setIsNewUser(result.isNewUser ?? false);
        setPaymentId(result.paymentId);

        await openRazorpayCheckout(result, pkgName, pkgId);
      } catch (err: unknown) {
        const msg = getErrorMessage(err);
        setErrorMsg(msg);
        setStep("error");
      } finally {
        setLoading(false);
      }
    },
    [name, email]
  );

  const openRazorpayCheckout = (
    orderData: {
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    },
    pkgName: string,
    pkgId: string
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
          description: pkgName,
          order_id: orderData.orderId,
          handler: async function (response: RazorpayResponse) {
            setStep("verifying");
            try {
              await api.post("/api/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              const batchData = await api.get<BatchOption[]>(
                "/api/payments/batches",
                { packageId: pkgId }
              );
              setBatches(batchData || []);

              if (batchData && batchData.length > 0) {
                setStep("selecting_batch");
              } else {
                await submitConsent();
              }
              resolve();
            } catch (err: unknown) {
              const msg = getErrorMessage(err);
              setErrorMsg(msg);
              setStep("error");
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              setStep("idle");
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

  const submitEnroll = useCallback(async () => {
    if (!paymentId || !selectedBatchId) return;
    setLoading(true);

    try {
      const result = await api.post<{ isNewUser: boolean; email: string }>(
        "/api/payments/enroll",
        { paymentId, batchId: selectedBatchId, name, email }
      );

      if (result.isNewUser && result.email) {
        // toast handled in component
      }

      setStep("complete");
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      setStep("error");
    } finally {
      setLoading(false);
    }
  }, [paymentId, selectedBatchId, name, email]);

  const submitConsent = useCallback(async () => {
    if (!paymentId) return;
    setLoading(true);

    try {
      await api.post("/api/payments/consent", { paymentId, name, email });
      setStep("complete");
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      setStep("error");
    } finally {
      setLoading(false);
    }
  }, [paymentId, name, email]);

  const startCheckout = useCallback(
    async (pkg: { id: string; name: string; price: number | null }) => {
      if (!pkg.price) return;
      setErrorMsg("");

      try {
        const me = await api.get<{ user: { name: string; email: string } }>(
          "/api/auth/me"
        );
        if (me?.user) {
          setName(me.user.name);
          setEmail(me.user.email);
          await createOrder(pkg.id, pkg.name, pkg.price);
          return;
        }
      } catch {
        // Not logged in — show info collection form
      }

      setStep("collecting_info");
    },
    [createOrder]
  );

  const infoSubmit = useCallback(
    async (pkg: { id: string; name: string; price: number | null }) => {
      if (!pkg.price) return;
      await createOrder(pkg.id, pkg.name, pkg.price);
    },
    [createOrder]
  );

  return {
    // State
    step,
    name,
    email,
    isNewUser,
    paymentId,
    batches,
    selectedBatchId,
    errorMsg,
    loading,
    // Setters
    setName,
    setEmail,
    setSelectedBatchId,
    setErrorMsg,
    // Actions
    startCheckout,
    infoSubmit,
    submitEnroll,
    submitConsent,
    reset,
  };
}
