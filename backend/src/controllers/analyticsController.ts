import { NextFunction, Request, RequestHandler, Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import prisma from "../prisma";

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

export const recordDemoPurchase = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const { productId, productName, amountInRs } = req.body ?? {};

    if (typeof productId !== "string" || productId.trim().length < 1) {
      res.status(400).json({ error: "productId is required" });
      return;
    }
    if (typeof productName !== "string" || productName.trim().length < 1) {
      res.status(400).json({ error: "productName is required" });
      return;
    }
    if (
      typeof amountInRs !== "number" ||
      !Number.isFinite(amountInRs) ||
      amountInRs <= 0
    ) {
      res.status(400).json({ error: "amountInRs must be a positive number" });
      return;
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "purchase",
        metadata: {
          productId: productId.trim(),
          productName: productName.trim(),
          amountInRs,
          currency: "INR",
          demo: true,
        },
      },
    });

    res.status(201).json({ event });
  }
);