"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Verifies if current user has admin role
 */
export async function verifyAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Failed to verify admin:", error);
    return false;
  }
}

/**
 * Gets all creators with pending verification
 */
export async function getPendingCreators() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const pendingCreators = await db.user.findMany({
      where: {
        role: "CREATOR",
        verificationStatus: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { creators: pendingCreators };
  } catch (error) {
    throw new Error("Failed to fetch pending creators");
  }
}

/**
 * Gets all verified creators
 */
export async function getVerifiedCreators() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const verifiedCreators = await db.user.findMany({
      where: {
        role: "CREATOR",
        verificationStatus: "VERIFIED",
      },
      orderBy: {
        name: "asc",
      },
    });

    return { creators: verifiedCreators };
  } catch (error) {
    console.error("Failed to get verified creators:", error);
    return { error: "Failed to fetch verified creators" };
  }
}

/**
 * Updates a creator's verification status
 */
export async function updateCreatorStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const creatorId = formData.get("creatorId");
  const status = formData.get("status");

  if (!creatorId || !["VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid input");
  }

  try {
    await db.user.update({
      where: {
        id: creatorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update creator status:", error);
    throw new Error(`Failed to update creator status: ${error.message}`);
  }
}

/**
 * Suspends or reinstates a creator
 */
export async function updateCreatorActiveStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const creatorId = formData.get("creatorId");
  const suspend = formData.get("suspend") === "true";

  if (!creatorId) {
    throw new Error("Creator ID is required");
  }

  try {
    const status = suspend ? "PENDING" : "VERIFIED";

    await db.user.update({
      where: {
        id: creatorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update creator active status:", error);
    throw new Error(`Failed to update creator status: ${error.message}`);
  }
}

/**
 * Gets all pending payouts that need admin approval
 */
export async function getPendingPayouts() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const pendingPayouts = await db.payout.findMany({
      where: {
        status: "PROCESSING",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            speciality: true,
            credits: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { payouts: pendingPayouts };
  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);
    throw new Error("Failed to fetch pending payouts");
  }
}

/**
 * Approves a payout request and deducts credits from creator's account
 */
export async function approvePayout(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const payoutId = formData.get("payoutId");

  if (!payoutId) {
    throw new Error("Payout ID is required");
  }

  try {
    // Get admin user info
    const { userId } = await auth();
    const admin = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    // Find the payout request
    const payout = await db.payout.findUnique({
      where: {
        id: payoutId,
        status: "PROCESSING",
      },
      include: {
        creator: true,
      },
    });

    if (!payout) {
      throw new Error("Payout request not found or already processed");
    }

    // Check if creator has enough credits
    if (payout.creator.credits < payout.credits) {
      throw new Error("Creator doesn't have enough credits for this payout");
    }

    // Process the payout in a transaction
    await db.$transaction(async (tx) => {
      // Update payout status to PROCESSED
      await tx.payout.update({
        where: {
          id: payoutId,
        },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          processedBy: admin?.id || "unknown",
        },
      });

      // Deduct credits from creator's account
      await tx.user.update({
        where: {
          id: payout.creatorId,
        },
        data: {
          credits: {
            decrement: payout.credits,
          },
        },
      });

      // Create a transaction record for the deduction
      await tx.creditTransaction.create({
        data: {
          userId: payout.creatorId,
          amount: -payout.credits,
          type: "ADMIN_ADJUSTMENT",
        },
      });
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve payout:", error);
    throw new Error(`Failed to approve payout: ${error.message}`);
  }
}