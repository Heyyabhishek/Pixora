import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  try {
    // 👇 Safe call with error handling
    const user = await currentUser();

    if (!user) {
      return null;
    }

    // ✅ Try to find existing user in DB
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
      include: {
        transactions: {
          where: {
            type: "CREDIT_PURCHASE",
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    // ✅ Create user if not found
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name: name || "New User",
        imageUrl: user.imageUrl,
        email: user.emailAddresses?.[0]?.emailAddress ?? "",
        transactions: {
          create: {
            type: "CREDIT_PURCHASE",
            packageId: "free_user",
            amount: 2,
          },
        },
      },
    });

    return newUser;
  } catch (error) {
    console.error("❌ checkUser() failed:", error);
    return null; // Prevents "An error occurred in the Server Components render"
  }
};
