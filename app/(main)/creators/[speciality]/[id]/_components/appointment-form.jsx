"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2, Clock, ArrowLeft, Calendar, CreditCard } from "lucide-react";
import { bookAppointment } from "@/actions/appointments";
import { toast } from "sonner";

export function AppointmentForm({ creatorId, slot, onBack }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("creatorId", creatorId);
      formData.append("startTime", slot.startTime);
      formData.append("endTime", slot.endTime);
      formData.append("description", description);

      const response = await bookAppointment(formData);

      if (response.success) {
        toast.success("Appointment booked successfully!");
        router.push("/appointments"); // redirect after success
      } else {
        toast.error(response.error || "Failed to book appointment");
      }
    } catch (err) {
      toast.error(err.message || "Failed to book appointment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-emerald-400 mr-2" />
          <span className="text-white font-medium">
            {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-emerald-400 mr-2" />
          <span className="text-white">{slot.formatted}</span>
        </div>
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-emerald-400 mr-2" />
          <span className="text-muted-foreground">
            Cost: <span className="text-white font-medium">2 credits</span>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Describe your medical concern (optional)
        </Label>
        <Textarea
          id="description"
          placeholder="Please provide any details about your medical concern or what you'd like to discuss in the appointment..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-background border-emerald-900/20 h-32"
        />
        <p className="text-sm text-muted-foreground">
          This information will be shared with the creator before your
          appointment.
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="border-emerald-900/30"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change Time Slot
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Booking...
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>
      </div>
    </form>
  );
}
