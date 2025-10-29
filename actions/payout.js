"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const CREDIT_VALUE = 10; // $10 per credit total
const PLATFORM_FEE_PER_CREDIT = 2; // $2 platform fee
const CREATOR_EARNINGS_PER_CREDIT = 8; // $8 to creator

/**
 * Request payout for all remaining credits
 */
export async function requestPayout(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const creator = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "CREATOR",
      },
    });

    if (!creator) {
      throw new Error("Creator not found");
    }

    const paypalEmail = formData.get("paypalEmail");

    if (!paypalEmail) {
      throw new Error("PayPal email is required");
    }

    // Check if creator has any pending payout requests
    const existingPendingPayout = await db.payout.findFirst({
      where: {
        creatorId: creator.id,
        status: "PROCESSING",
      },
    });

    if (existingPendingPayout) {
      throw new Error(
        "You already have a pending payout request. Please wait for it to be processed."
      );
    }

    // Get creator's current credit balance
    const creditCount = creator.credits;

    if (creditCount === 0) {
      throw new Error("No credits available for payout");
    }

    if (creditCount < 1) {
      throw new Error("Minimum 1 credit required for payout");
    }

    const totalAmount = creditCount * CREDIT_VALUE;
    const platformFee = creditCount * PLATFORM_FEE_PER_CREDIT;
    const netAmount = creditCount * CREATOR_EARNINGS_PER_CREDIT;

    // Create payout request
    const payout = await db.payout.create({
      data: {
        creatorId: creator.id,
        amount: totalAmount,
        credits: creditCount,
        platformFee,
        netAmount,
        paypalEmail,
        status: "PROCESSING",
      },
    });

    revalidatePath("/creator");
    return { success: true, payout };
  } catch (error) {
    console.error("Failed to request payout:", error);
    throw new Error("Failed to request payout: " + error.message);
  }
}

/**
 * Get creator's payout history
 */
export async function getCreatorPayouts() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const creator = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "CREATOR",
      },
    });

    if (!creator) {
      throw new Error("Creator not found");
    }

    const payouts = await db.payout.findMany({
      where: {
        creatorId: creator.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { payouts };
  } catch (error) {
    throw new Error("Failed to fetch payouts: " + error.message);
  }
}

/**
 * Get creator's earnings summary
 */
export async function getCreatorEarnings() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const creator = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: "CREATOR",
      },
    });

    if (!creator) {
      throw new Error("Creator not found");
    }

    // Get all completed appointments for this creator
    const completedAppointments = await db.appointment.findMany({
      where: {
        creatorId: creator.id,
        status: "COMPLETED",
      },
    });

    // Calculate this month's completed appointments
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthAppointments = completedAppointments.filter(
      (appointment) => new Date(appointment.createdAt) >= currentMonth
    );

    // Use creator's actual credits from the user model
    const totalEarnings = creator.credits * CREATOR_EARNINGS_PER_CREDIT; // $8 per credit to creator

    // Calculate this month's earnings (2 credits per appointment * $8 per credit)
    const thisMonthEarnings =
      thisMonthAppointments.length * 2 * CREATOR_EARNINGS_PER_CREDIT;

    // Simple average per month calculation
    const averageEarningsPerMonth =
      totalEarnings > 0
        ? totalEarnings / Math.max(1, new Date().getMonth() + 1)
        : 0;

    // Get current credit balance for payout calculations
    const availableCredits = creator.credits;
    const availablePayout = availableCredits * CREATOR_EARNINGS_PER_CREDIT;

    return {
      earnings: {
        totalEarnings,
        thisMonthEarnings,
        completedAppointments: completedAppointments.length,
        averageEarningsPerMonth,
        availableCredits,
        availablePayout,
      },
    };
  } catch (error) {
    throw new Error("Failed to fetch creator earnings: " + error.message);
  }
}