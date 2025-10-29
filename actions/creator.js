"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function setAvailabilitySlots(formData) {
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

    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    if (!startTime || !endTime) {
      throw new Error("Start time and end time are required");
    }

    if (startTime >= endTime) {
      throw new Error("Start time must be before end time");
    }

    const existingSlots = await db.availability.findMany({
      where: {
        creatorId: creator.id,
      },
    });

    if (existingSlots.length > 0) {
      const slotsWithNoAppointments = existingSlots.filter(
        (slot) => !slot.appointment
      );

      if (slotsWithNoAppointments.length > 0) {
        await db.availability.deleteMany({
          where: {
            id: {
              in: slotsWithNoAppointments.map((slot) => slot.id),
            },
          },
        });
      }
    }
    const newSlot = await db.availability.create({
        data: {
            creatorId: creator.id,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: "AVAILABLE",
        },
    });

    revalidatePath("/creator");
    return { success: true, slot: newSlot };

  } catch (error) {
    throw new Error("Failed to set availability: " + error.message);
  }
}

export async function getCreatorAvailability() {
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

    const availabilitySlots = await db.availability.findMany({
      where: {
        creatorId: creator.id,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { slots: availabilitySlots };
  } catch (error) {
    throw new Error("Failed to fetch availability slots " + error.message);
  }
}

export async function getCreatorAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const creator = await db.user.findFirst({
      where: {
        clerkUserId: userId,
        role: "CREATOR",
      },
    });

    if (!creator) {
      throw new Error("Creator not found");
    }

    const appointments = await db.appointment.findMany({
      where: {
        creatorId: creator.id,
        status: {
          in: ["SCHEDULED"],
        },
      },
      include: {
        User_Appointment_clientIdToUser: true,
        User_Appointment_creatorIdToUser: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appointments };
  } catch (error) {
    throw new Error("Failed to fetch appointments: " + error.message);
  }
}


/**
 * Cancel an appointment (can be done by both creator and client)
 */
export async function cancelAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    // ⭐ FIXED: Use correct relation names
    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        User_Appointment_clientIdToUser: true,
        User_Appointment_creatorIdToUser: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the user is either the creator or the client for this appointment
    if (appointment.creatorId !== user.id && appointment.clientId !== user.id) {
      throw new Error("You are not authorized to cancel this appointment");
    }

    // Perform cancellation in a transaction
    await db.$transaction(async (tx) => {
      // Update the appointment status to CANCELLED
      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "CANCELLED",
        },
      });

      // Always refund credits to client and deduct from creator
      // Create credit transaction for client (refund)
      await tx.creditTransaction.create({
        data: {
          userId: appointment.clientId,
          amount: 2,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Create credit transaction for creator (deduction)
      await tx.creditTransaction.create({
        data: {
          userId: appointment.creatorId,
          amount: -2,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Update client's credit balance (increment)
      await tx.user.update({
        where: {
          id: appointment.clientId,
        },
        data: {
          credits: {
            increment: 2,
          },
        },
      });

      // Update creator's credit balance (decrement)
      await tx.user.update({
        where: {
          id: appointment.creatorId,
        },
        data: {
          credits: {
            decrement: 2,
          },
        },
      });
    });

    // Determine which path to revalidate based on user role
    if (user.role === "CREATOR") {
      revalidatePath("/creator");
    } else if (user.role === "CLIENT") {
      revalidatePath("/appointments");
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    throw new Error("Failed to cancel appointment: " + error.message);
  }
}

/**
 * Add notes to an appointment
 */
export async function addAppointmentNotes(formData) {
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

    const appointmentId = formData.get("appointmentId");
    const notes = formData.get("notes");

    if (!appointmentId || !notes) {
      throw new Error("Appointment ID and notes are required");
    }

    // Verify the appointment belongs to this creator
    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        creatorId: creator.id,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Update the appointment notes
    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        notes,
      },
    });

    revalidatePath("/creator");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error("Failed to add appointment notes:", error);
    throw new Error("Failed to update notes: " + error.message);
  }
}

/**
 * Mark an appointment as completed (only by creator after end time)
 */
export async function markAppointmentCompleted(formData) {
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

    const appointmentId = formData.get("appointmentId");

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    // ⭐ FIXED: Use correct relation name
    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        creatorId: creator.id,
      },
      include: {
        User_Appointment_clientIdToUser: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found or not authorized");
    }

    // Check if appointment is currently scheduled
    if (appointment.status !== "SCHEDULED") {
      throw new Error("Only scheduled appointments can be marked as completed");
    }

    // Check if current time is after the appointment end time
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      throw new Error(
        "Cannot mark appointment as completed before the scheduled end time"
      );
    }

    // Update the appointment status to COMPLETED
    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        status: "COMPLETED",
      },
    });

    revalidatePath("/creator");
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error("Failed to mark appointment as completed:", error);
    throw new Error(
      "Failed to mark appointment as completed: " + error.message
    );
  }
}