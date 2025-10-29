import { getCreatorById, getAvailableTimeSlots } from "@/actions/appointments";
import { CreatorProfile } from "./_components/creator-profile";
import { redirect } from "next/navigation";

export default async function CreatorProfilePage({ params }) {
  const { id } = await params;

  try {
    // Fetch creator data and available slots in parallel
    const [creatorData, slotsData] = await Promise.all([
      getCreatorById(id),
      getAvailableTimeSlots(id),
    ]);

    return (
      <CreatorProfile
        creator={creatorData.creator}
        availableDays={slotsData.days || []}
      />
    );
  } catch (error) {
    console.error("Error loading creator profile:", error);
    redirect("/creators");
  }
}