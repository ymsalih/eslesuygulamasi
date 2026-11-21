import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCity, isValidCitySlug } from "@sark/shared";
import { getSession } from "@/lib/session";
import CityApp from "@/components/CityApp";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  return { title: city ? `${city.genitive} köşeleri` : "Şehir" };
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidCitySlug(slug)) notFound();
  if (!(await getSession())) redirect("/");
  const city = getCity(slug)!;
  return <CityApp city={slug} cityName={city.name} genitive={city.genitive} />;
}
