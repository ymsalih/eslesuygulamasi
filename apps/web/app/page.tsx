import { redirect } from "next/navigation";
import { buildSceneSvg, themeFor } from "@sark/shared";
import { getSession } from "@/lib/session";
import ConsentForm from "@/components/ConsentForm";

export default async function Home() {
  if (await getSession()) redirect("/sehir");
  const scene = buildSceneSvg(themeFor("istanbul"));
  return (
    <div className="hero">
      <section className="intro">
        <h1>Gel otur, <em>bir çay iç.</em></h1>
        <p className="lead">
          Şehrinin şark köşelerinde, kayıt olmadan, şehrine özel bir takma adla sohbet et. Her köşenin bir konusu, her
          şehrin kendi manzarası ve fon müziği var.
        </p>
        <ul>
          <li>81 il ve Tüm Türkiye, her köşede en fazla 10 kişi</li>
          <li>Kayıt yok, fotoğraf yok, özel mesaj yok</li>
          <li>Köşeler 24 saat sonra kapanır, mesajlar saklanmaz</li>
          <li>Rahatsız eden olursa tek dokunuşla bildir</li>
        </ul>
      </section>
      {/* Sabit, sunucuda üretilen sahne çizimi (kullanıcı içeriği yok) */}
      <div className="hero-scene" dangerouslySetInnerHTML={{ __html: scene }} />
      <section className="card consent">
        <ConsentForm />
      </section>
    </div>
  );
}
