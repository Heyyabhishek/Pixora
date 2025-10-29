"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";


const PLAN_CREDITS = {
  free_user: 100, // Basic plan: 2 credits
  standard: 150, // Standard plan: 10 credits per month
  premium: 200, // Premium plan: 24 credits per month
};

const APPOINTMENT_CREDIT_COST = 2;


export async function checkAndAllocateCredits(user) {
  try {
    if (!user) {
      return null;
    }

    if (user.role !== "CLIENT") {
      return user;
    }

    const { has } = await auth();

    const hasBasic = has({ plan: "free_user" });
    const hasStandard = has({ plan: "standard" });
    const hasPremium = has({ plan: "premium" });

    let currentPlan = null;
    let creditsToAllocate = 0;

    if (hasPremium) {
      currentPlan = "premium";
      creditsToAllocate = PLAN_CREDITS.premium;
    } else if (hasStandard) {
      currentPlan = "standard";
      creditsToAllocate = PLAN_CREDITS.standard;
    } else if (hasBasic) {
      currentPlan = "free_user";
      creditsToAllocate = PLAN_CREDITS.free_user;
    }
    if (!currentPlan) {
      return user;
    }

    const currentMonth = format(new Date(), "yyyy-MM");

    if (user.transactions.length > 0) {
      const latestTransaction = user.transactions[0];
      const transactionMonth = format(
        new Date(latestTransaction.createdAt),
        "yyyy-MM"
      );
      const transactionPlan = latestTransaction.packageId;

      if (
        transactionMonth === currentMonth &&
        transactionPlan === currentPlan
      ) {
        return user;
      }
    }

    const updatedUser = await db.$transaction(async (tx) => {
      
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: creditsToAllocate,
          type: "CREDIT_PURCHASE",
          packageId: currentPlan,
        },
      });

      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          credits: {
            increment: creditsToAllocate,
          },
        },
      });

      return updatedUser;
    });

    revalidatePath("/creators");
    revalidatePath("/appointments");

    return updatedUser;
  } catch (error) {
    console.error(
      "Failed to check subscription and allocate credits:",
      error.message
    );
    return null;
  }
}


export async function deductCreditsForAppointment(userId, creatorId) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    const creator = await db.user.findUnique({
      where: { id: creatorId },
    });

    // Ensure user has sufficient credits
    if (user.credits < APPOINTMENT_CREDIT_COST) {
      throw new Error("Insufficient credits to book an appointment");
    }

    if (!creator) {
      throw new Error("Creator not found");
    }

    // Deduct credits from patient and add to creator
    const result = await db.$transaction(async (tx) => {
      // Create transaction record for patient (deduction)
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Create transaction record for creator (addition)
      await tx.creditTransaction.create({
        data: {
          userId: creator.id,
          amount: APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION", // Using same type for consistency
        },
      });

      // Update patient's credit balance (decrement)
      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          credits: {
            decrement: APPOINTMENT_CREDIT_COST,
          },
        },
      });

      // Update creator's credit balance (increment)
      await tx.user.update({
        where: {
          id: creator.id,
        },
        data: {
          credits: {
            increment: APPOINTMENT_CREDIT_COST,
          },
        },
      });

      return updatedUser;
    });

    return { success: true, user: result };
  } catch (error) {
    console.error("Failed to deduct credits:", error);
    return { success: false, error: error.message };
  }

}