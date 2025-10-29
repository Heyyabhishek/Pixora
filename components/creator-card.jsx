import React from "react";
import { Card, CardContent } from "./ui/card";
import { Star, User } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import Link from "next/link";
import { Calendar } from "lucide-react";

const CreatorCard = ({ creator }) => {
  return (
    <Card className="border-emerald-900/20 hover:border-emerald-700/40 transition-all">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            {creator.imageUrl ? (
              <img
                src={creator.imageUrl}
                alt={creator.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-emerald-400" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <h3 className="font-medium text-white text-lg">{creator.name}</h3>
              
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-900/20 border-emerald-900/20 text-emerald-700 self-start"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Verified
                </Badge>

                {creator.credentialUrl && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-900/20 border-emerald-900/20 text-emerald-400 self-start"
                  >
                    <a
                      href={creator.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      //className="underline"
                    >
                      My Work
                    </a>
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-1">
              {creator.speciality} . {creator.experience} years experience
            </p>

            <div className="mt-4 line-clamp-2 text-sm text-muted-foreground mb-2">
              {creator.description}
            </div>

            <Button
              asChild
              className="w-full bg-emerald-500 hover:bg-emerald-600 mt-2"
            >
              <Link href={`/creators/${creator.speciality}/${creator.id}`}>
                <Calendar className="h-4 w-4 mr-2" />
                View Profile & Book
              </Link>
            </Button>

          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorCard;
