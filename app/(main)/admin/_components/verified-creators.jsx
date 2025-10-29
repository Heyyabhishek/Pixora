"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Ban, Loader2, User, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateCreatorActiveStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export function VerifiedCreators({ creators }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [targetCreator, setTargetCreator] = useState(null);
  const [actionType, setActionType] = useState(null);

  const {
    loading,
    data,
    fn: submitStatusUpdate,
  } = useFetch(updateCreatorActiveStatus);

  const filteredCreators = creators.filter((creator) => {
    const query = searchTerm.toLowerCase();
    return (
      creator.name.toLowerCase().includes(query) ||
      creator.speciality.toLowerCase().includes(query) ||
      creator.email.toLowerCase().includes(query)
    );
  });

  const handleStatusChange = async (creator, suspend) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${suspend ? "suspend" : "reinstate"} ${
        creator.name
      }?`
    );
    if (!confirmed || loading) return;

    const formData = new FormData();
    formData.append("creatorId", creator.id);
    formData.append("suspend", suspend ? "true" : "false");

    setTargetCreator(creator);
    setActionType(suspend ? "SUSPEND" : "REINSTATE");

    await submitStatusUpdate(formData);
  };

  useEffect(() => {
    if (data?.success && targetCreator && actionType) {
      const actionVerb = actionType === "SUSPEND" ? "Suspended" : "Reinstated";
      toast.success(`${actionVerb} ${targetCreator.name} successfully!`);
      setTargetCreator(null);
      setActionType(null);
    }
  }, [data]);

  return (
    <div>
      <Card className="bg-muted/20 border-emerald-900/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Manage Creators
              </CardTitle>
              <CardDescription>
                View and manage all verified creators
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
                className="pl-8 bg-background border-emerald-900/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredCreators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No creators match your search criteria."
                : "No verified creators available."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCreators.map((creator) => {
                const isSuspended = creator.verificationStatus === "REJECTED";
                return (
                  <Card
                    key={creator.id}
                    className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted/20 rounded-full p-2">
                            <User className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">
                              {creator.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {creator.speciality} • {creator.experience} years
                              experience
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {creator.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          {isSuspended ? (
                            <>
                              <Badge
                                variant="outline"
                                className="bg-red-900/20 border-red-900/30 text-red-400"
                              >
                                Suspended
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(creator, false)
                                }
                                disabled={loading}
                                className="border-emerald-900/30 hover:bg-muted/80"
                              >
                                {loading && targetCreator?.id === creator.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Reinstate
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge
                                variant="outline"
                                className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                              >
                                Active
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(creator, true)}
                                disabled={loading}
                                className="border-red-900/30 hover:bg-red-900/10 text-red-400"
                              >
                                {loading && targetCreator?.id === creator.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Ban className="h-4 w-4 mr-1" />
                                )}
                                Suspend
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}