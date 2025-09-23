import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Onboarding - MediMeet",
  description: "Complete your profile to get started with MediMeet",
};

export default async function OnboardingLayout({ children }) {
  // Get complete user profile
  const user = await getCurrentUser();

  // Redirect users who have already completed onboarding
  if (user) {
    if (user.role === "CLIENT") {
      redirect("/creators");
    } else if (user.role === "CREATOR") {
      // Check verification status for creators
      if (user.verificationStatus === "VERIFIED") {
        redirect("/creator");
      } else {
        redirect("/creator/verification");
      }
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Pixora
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us how you want to use the platform
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}