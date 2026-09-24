import { NextFunction, RequestHandler, Response } from "express";
import { AuthedRequest } from "./auth";
import prisma from "../prisma";

export const requireSubscription: RequestHandler = async (
  req,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthedRequest).userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }

    if (user.role === "ADMIN") {
      next();
      return;
    }

    const active =
      user.subscription === "ACTIVE" &&
      user.subscriptionExpiresAt !== null &&
      user.subscriptionExpiresAt > new Date();

    if (!active) {
      res.status(403).json({
        error:
          "An active subscription is required to use Study Flow features. Complete the demo activation in /demo-payment.",
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};