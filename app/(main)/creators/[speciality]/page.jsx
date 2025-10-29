import { redirect } from "next/navigation";
import { getCreatorsBySpeciality } from "@/actions/creators.listing";
//import { CreatorCard } from "../components/creator-card";
import { PageHeader } from "@/components/page-header";
import CreatorCard from "@/components/creator-card";

export default async function CreatorSpecialtyPage({ params }) {
  const { speciality } = params;

  // Redirect to main creators page if no speciality is provided
  if (!speciality) {
    redirect("/creators");
  }

  // Fetch creators by speciality
  const { creators, error } = await getCreatorsBySpeciality(speciality);

  if (error) {
    console.error("Error fetching creators:", error);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={speciality.split("%20").join(" ")}
        backLink="/creators"
        backLabel="All Specialties"
      />

      {creators && creators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-white mb-2">
            No creators available
          </h3>
          <p className="text-muted-foreground">
            There are currently no verified creators in this speciality. Please
            check back later or choose another speciality.
          </p>
        </div>
      )}
    </div>
  );
}