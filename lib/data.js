import {
  Calendar,
  Video,
  CreditCard,
  User,
  FileText,
  ShieldCheck,
} from "lucide-react";

// JSON data for features
export const features = [
  {
    icon: <User className="h-6 w-6 text-emerald-400" />,
    title: "Create Your Profile",
    description:
      "Sign up and complete your profile to get matched with the perfect photographers, filmmakers, editors, and creative experts for your next project.",
  },
  {
    icon: <Calendar className="h-6 w-6 text-emerald-400" />,
    title: "Book Your Schedule",
    description:
      "Easily browse verified photographers, filmmakers, editors, and more. Check availability and schedule the perfect time to collaborate and bring your project to life.",
  },
  {
    icon: <Video className="h-6 w-6 text-emerald-400" />,
    title: "Instant Video Collaboration",
    description:
      "Collaborate with photographers, filmmakers, and editors through video calls — discuss your vision, clarify details, and make decisions faster.",
  },
  {
    icon: <CreditCard className="h-6 w-6 text-emerald-400" />,
    title: "Booking Credits",
    description:
      "Get easy credit packages that let you book photographers, filmmakers, editors, and more — pay as you go with no hassle.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-emerald-400" />,
    title: "Verified Creators",
    description:
      "Every photographer, filmmaker, and creative expert on Pixora is handpicked and verified, so you can collaborate with trusted professionals who bring passion, skill, and reliability to every project.",
  },
  {
    icon: <FileText className="h-6 w-6 text-emerald-400" />,
    title: "Project Records",
    description:
      "Easily access and manage your booking history, creative briefs, project notes, and communication logs with your photographers, filmmakers, and editors.",
  },
];

// JSON data for testimonials
export const testimonials = [
  {
  initials: "Ms",
  name: "Aditi K.",
  role: "Client",
  quote:
    "Booking a photographer through this platform was so simple! I scheduled a video call to discuss my event details without leaving home.",
},
{
  initials: "Mr",
  name: "Rohit S.",
  role: "Photographer",
  quote:
    "This platform has transformed how I work. I can now connect with clients, showcase my portfolio, and manage bookings — all in one place.",
},
{
  initials: "Ms",
  name: "Priya M.",
  role: "Client",
  quote:
    "The credit system is so convenient. I purchased a package and used it to book multiple creators for my wedding events effortlessly.",
},
];

// JSON data for credit system benefits
export const creditBenefits = [
  "Each consultation requires <strong class='text-emerald-400'>2 credits</strong> regardless of duration",
  "Credits <strong class='text-emerald-400'>never expire</strong> - use them whenever you need",
  "Monthly subscriptions give you <strong class='text-emerald-400'>fresh credits every month</strong>",
  "Cancel or change your subscription <strong class='text-emerald-400'>anytime</strong> without penalties",
];