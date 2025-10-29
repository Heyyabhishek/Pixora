import { getCreatorById } from "@/actions/appointments";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({ params }) {
  const { id } = await params;

  const { creator } = await getCreatorById(id);
  return {
    title: `Creator ${creator.name} - Pixora`,
    description: `Book an appointment with Creator ${creator.name}, ${creator.specialty} specialist with ${creator.experience} years of experience.`,
  };
}

export default async function CreatorProfileLayout({ children, params }) {
  const { id } = await params;
  const { creator } = await getCreatorById(id);

  if (!creator) redirect("/creators");

  return (
    <div className="container mx-auto">
      <PageHeader
        // icon={<Camera />}
        title={creator.name}
        backLink={`/creators/${creator.speciality}`}
        backLabel={`Back to ${creator.speciality}`}
      />

      {children}
    </div>
  );
}