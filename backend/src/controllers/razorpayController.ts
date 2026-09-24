import { createHmac, timingSafeEqual } from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import Razorpay from "razorpay";
import { AuthedRequest } from "../middleware/auth";
import prisma from "../prisma";

const DEMO_AMOUNT_PAISE = 1000;
const DEMO_CURRENCY = "INR";
const DEMO_PRODUCT_ID = "study-flow-monthly-demo";
const DEMO_PRODUCT_NAME = "Study Flow Monthly Demo";
const DEMO_SUBSCRIPTION_DAYS = 30;

type AsyncHandler = RequestHandler;

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): AsyncHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

function getUserId(req: Request): string {
  const userId = (req as AuthedRequest).userId;
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}

function getRazorpay():
  | { keyId: string; keySecret: string; instance: Razorpay }
  | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return {
    keyId,
    keySecret,
    instance: new Razorpay({ key_id: keyId, key_secret: keySecret }),
  };
}

function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signature, "hex");
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export const createRazorpayOrder = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const razorpay = getRazorpay();
    if (!razorpay) {
      res.status(500).json({ error: "Razorpay is not configured" });
      return;
    }

    const order = await razorpay.instance.orders.create({
      amount: DEMO_AMOUNT_PAISE,
      currency: DEMO_CURRENCY,
      receipt: `demo_${userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        demo: "true",
        productId: DEMO_PRODUCT_ID,
      },
    });

    res.json({
      orderId: order.id,
      keyId: razorpay.keyId,
      amountPaise: Number(order.amount ?? DEMO_AMOUNT_PAISE),
      currency: order.currency ?? DEMO_CURRENCY,
      demo: true,
    });
  }
);

export const verifyRazorpayPayment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body ?? {};

    if (
      typeof razorpay_order_id !== "string" ||
      razorpay_order_id.trim().length < 1
    ) {
      res.status(400).json({ error: "razorpay_order_id is required" });
      return;
    }
    if (
      typeof razorpay_payment_id !== "string" ||
      razorpay_payment_id.trim().length < 1
    ) {
      res.status(400).json({ error: "razorpay_payment_id is required" });
      return;
    }
    if (
      typeof razorpay_signature !== "string" ||
      razorpay_signature.trim().length < 1
    ) {
      res.status(400).json({ error: "razorpay_signature is required" });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      res.status(500).json({ error: "Razorpay is not configured" });
      return;
    }

    if (
      !verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        keySecret
      )
    ) {
      res.status(400).json({ error: "Invalid payment signature" });
      return;
    }

    const existing = await prisma.analyticsEvent.findFirst({
      where: {
        userId,
        eventName: "purchase",
        metadata: {
          path: ["razorpayPaymentId"],
          equals: razorpay_payment_id,
        },
      },
    });

    if (existing) {
      res.json({ verified: true, alreadyRecorded: true, event: existing });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + DEMO_SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscription: "ACTIVE",
        planId: DEMO_PRODUCT_ID,
        subscribedAt: now,
        subscriptionExpiresAt: expiresAt,
      },
    });

    const event = await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "purchase",
        metadata: {
          productId: DEMO_PRODUCT_ID,
          productName: DEMO_PRODUCT_NAME,
          amountInRs: 10,
          currency: DEMO_CURRENCY,
          demo: true,
          subscriptionDays: DEMO_SUBSCRIPTION_DAYS,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
      },
    });

    res.status(201).json({ verified: true, event });
  }
);