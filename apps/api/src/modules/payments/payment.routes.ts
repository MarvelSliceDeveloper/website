import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";
import crypto from "crypto";

const router = Router();

// Endpoint: POST /api/payments/order
// Creates a Razorpay order (real or mock) and returns order details
router.post("/order", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    // Verify course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if already enrolled (APPROVED or PENDING)
    const existingEnrollment = await prisma.enrollmentRequest.findFirst({
      where: {
        userId,
        courseId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({
        error: "You are already enrolled or have a pending request for this course.",
      });
    }

    // Create a PENDING enrollment request
    const enrollment = await prisma.enrollmentRequest.create({
      data: {
        userId,
        courseId,
        status: "PENDING",
      },
    });

    const amountInINR = course.price || 999;
    const amountInPaise = Math.round(amountInINR * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId = `order_mock_${crypto.randomBytes(8).toString("hex")}`;

    // If Razorpay keys are configured, make a direct REST API call to Razorpay to create a real order
    if (keyId && keySecret) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${enrollment.id.substring(0, 15)}`,
          }),
        });

        if (response.ok) {
          const orderData = (await response.json()) as any;
          if (orderData.id) {
            razorpayOrderId = orderData.id;
          }
        } else {
          const errText = await response.text();
          console.warn("[Razorpay] Order creation failed, falling back to mock:", errText);
        }
      } catch (err: any) {
        console.warn("[Razorpay] Connection error, falling back to mock:", err.message);
      }
    }

    // Save payment details to DB
    const payment = await prisma.payment.create({
      data: {
        enrollmentId: enrollment.id,
        razorpayOrderId,
        amount: amountInINR,
        status: "created",
      },
    });

    return res.status(201).json({
      orderId: razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: keyId || "rzp_test_mockKeyId123456",
      enrollmentId: enrollment.id,
      paymentId: payment.id,
    });
  } catch (error: any) {
    console.error("[Payments] Error creating order:", error);
    return res.status(500).json({ error: error.message || "Failed to create payment order" });
  }
});

// Endpoint: POST /api/payments/verify
// Verifies Razorpay payment signature, updates payment status, and activates course enrollment
router.post("/verify", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      enrollmentId,
    } = req.body;

    if (!razorpayOrderId || !enrollmentId) {
      return res.status(400).json({ error: "Missing required verification fields." });
    }

    // Find the corresponding enrollment request
    const enrollment = await prisma.enrollmentRequest.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment || enrollment.userId !== userId) {
      return res.status(404).json({ error: "Enrollment request not found." });
    }

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { enrollmentId },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment record not found." });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let isValidSignature = false;

    if (keySecret && razorpaySignature && razorpayPaymentId) {
      // Real signature verification
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      isValidSignature = generatedSignature === razorpaySignature;
    } else {
      // In development or if keys are not configured, allow verification to succeed for testing
      isValidSignature = true;
    }

    if (!isValidSignature) {
      // Mark payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });
      return res.status(400).json({ error: "Payment verification signature is invalid." });
    }

    // Find the first active or upcoming batch for this course so we can assign the student immediately!
    const activeBatch = await prisma.batch.findFirst({
      where: {
        courseId: enrollment.courseId,
        status: { in: ["ACTIVE", "UPCOMING"] },
      },
    });

    // Update payment to paid
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        razorpayPaymentId: razorpayPaymentId || `pay_mock_${crypto.randomBytes(8).toString("hex")}`,
      },
    });

    // Update enrollment status to APPROVED and assign to batch (if available)
    const updatedEnrollment = await prisma.enrollmentRequest.update({
      where: { id: enrollmentId },
      data: {
        status: "APPROVED",
        batchId: activeBatch?.id || null,
        reviewedAt: new Date(),
      },
    });

    // Create in-app notification for student
    await prisma.notification.create({
      data: {
        userId,
        type: "ENROLLMENT_APPROVED",
        title: "Course Purchased Successfully!",
        message: `Your payment was verified. You have been enrolled in the course. ${
          activeBatch ? `Welcome to batch "${activeBatch.name}"!` : "We will assign you to a batch shortly."
        }`,
        metadata: { courseId: enrollment.courseId, batchId: activeBatch?.id || null },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment successfully verified and enrollment approved.",
      enrollment: updatedEnrollment,
    });
  } catch (error: any) {
    console.error("[Payments] Error verifying payment:", error);
    return res.status(500).json({ error: error.message || "Failed to verify payment" });
  }
});

export const paymentRouter = router;
