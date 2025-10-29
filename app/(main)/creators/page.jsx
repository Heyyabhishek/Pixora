import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SPECIALTIES } from "@/lib/specialities";
import Link from "next/link";

const SpecialitiesPage = () => {
    return <>
    <div className="flex flex-col items-center justify-center mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-title">
          Find Your Creator
        </h1>
        <p className="text-muted-foreground text-lg">
          Find photographers, videographers, and more by speciality, or see all creators on Pixora.
        </p>
    </div>
     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {SPECIALTIES.map((speciality) => (
          <Link key={speciality.name} href={`/creators/${speciality.name}`}>

            <Card className="hover:border-emerald-700/40 transition-all cursor-pointer border-emerald-900/20 h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                <div className="w-12 h-12 rounded-full bg-emerald-900/20 flex items-center justify-center mb-4">
                  <div className="text-emerald-400">{speciality.icon}</div>
                </div>
                <h3 className="font-medium text-white">{speciality.name}</h3>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>;
};

export default SpecialitiesPage;