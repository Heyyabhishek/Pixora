import { redirect } from "next/navigation";
//import { getCreatorsBySpecialty } from "@/actions/creators-listing";
//import { CreatorCard } from "../components/creator-card";
//import { PageHeader } from "@/components/page-header";

export default async function CreatorSpecialtyPage({ params }) {
  const { specialty } = await params;

  // Redirect to main creators page if no specialty is provided
  if (!specialty) {
    redirect("/creators");
  }

  // Fetch creators by specialty
  const { creators, error } = await getCreatorsBySpecialty(specialty);

  if (error) {
    console.error("Error fetching creators:", error);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={specialty.split("%20").join(" ")}
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
            There are currently no verified creators in this specialty. Please
            check back later or choose another specialty.
          </p>
        </div>
      )}
    </div>
  );
}