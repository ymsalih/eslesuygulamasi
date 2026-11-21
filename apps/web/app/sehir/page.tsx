import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { citiesAlphabetical } from "@sark/shared";
import { getSession } from "@/lib/session";
import CityPicker from "@/components/CityPicker";

export const metadata: Metadata = { title: "Şehrini seç" };

export default async function CitiesPage() {
  if (!(await getSession())) redirect("/");
  const cities = citiesAlphabetical().map(({ plate, slug, name, region }) => ({ plate, slug, name, region }));
  return (
    <div className="container">
      <CityPicker cities={cities} />
    </div>
  );
}
