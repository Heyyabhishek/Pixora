"use server";

import { db } from "@/lib/prisma";


export async function getCreatorsBySpeciality(speciality) {
  try {
    const creators = await db.user.findMany({
      where: {
        role: "CREATOR",
        verificationStatus: "VERIFIED",
        speciality: speciality.split("%20").join(" "),
      },
      orderBy: {
        name: "asc",
      },
    });

    return { creators };
  } catch (error) {
    console.error("Failed to fetch creators by speciality:", error);
    return { error: "Failed to fetch creators" };
  }
}