import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HIDE_MESSAGE_REPORTS, PRIVACY_VERSION, REPORT_REASONS, ROOM_CAPACITY, SNAPSHOT_SIZE, TERMS_VERSION,
} from "@sark/shared";
import RemovalForm from "@/components/RemovalForm";

/*
 * TASLAK yasal metinler. Köşeli parantez içindeki alanlar doldurulmalı ve metinler
 * yayından önce bir bilişim / KVKK avukatı tarafından gözden geçirilmelidir.
 */

const DS = {
  name: "[VERİ SORUMLUSU ADI / UNVANI]",
  address: "[ADRES]",
  email: "[kvkk@alanadi.com]",
  contact: "[iletisim@alanadi.com]",
  mersis: "[MERSİS / VERGİ NO]",
  kep: "[KEP ADRESİ]",
};

const Draft = () => (
  <p className="draft">
    <b>TASLAK:</b> Bu metin yayın öncesi hukuki incelemeden geçirilecektir. Köşeli parantez içindeki bilgiler henüz doldurulmamıştır.
  </p>
);

const DOCS: Record<string, { title: string; body: () => React.ReactNode }> = {
  "kullanim-kosullari": {
    title: "Kullanım Koşulları",
    body: () => (
      <>
        <p className="muted">Sürüm: {TERMS_VERSION}</p>
        <Draft />
        <h2>1. Hizmetin tanımı</h2>
        <p>
          Şark Köşesi (&quot;Platform&quot;), kullanıcıların kayıt olmadan, kendilerine otomatik olarak verilen takma adlarla, şehir bazlı
          ve konulu sohbet odalarında (&quot;köşe&quot;) anlık yazışmasını sağlayan bir hizmettir. Platform {DS.name} tarafından işletilir.
          Platform, 5651 sayılı Kanun kapsamında kullanıcıların oluşturduğu içeriklere aracılık eden <b>yer sağlayıcı</b> sıfatıyla hareket eder.
        </p>
        <h2>2. Yaş sınırı</h2>
        <p>Platform yalnızca <b>18 yaş ve üzeri</b> kişilere açıktır. 18 yaşından küçük olduğu anlaşılan kullanıcıların erişimi engellenir.</p>
        <h2>3. Kullanıcının sorumluluğu</h2>
        <p>
          Kullanıcı, yazdığı mesajlardan ve açtığı köşe konularından bizzat sorumludur. Kullanıcı; Topluluk Kuralları&apos;na, yürürlükteki
          mevzuata ve başkalarının kişilik haklarına uygun davranmayı kabul eder.
        </p>
        <h2>4. Yasaklı içerik ve davranışlar</h2>
        <p>Ayrıntılar <Link href="/yasal/topluluk-kurallari">Topluluk Kuralları</Link>&apos;nda yer alır. Özetle şunlar yasaktır:</p>
        <ul>
          <li>Küfür, hakaret, taciz, tehdit, nefret söylemi ve ayrımcılık</li>
          <li>Belirli bir kişiyi hedef alan, kişisel bilgilerini ifşa eden içerikler</li>
          <li>Telefon, adres, kimlik numarası, IBAN, e-posta veya sosyal medya hesabı paylaşmak ya da istemek</li>
          <li>Müstehcenlik, çocukların istismarı, yasa dışı bahis ve kumar, uyuşturucu, intihara yönlendirme ve diğer suç teşkil eden içerikler</li>
          <li>Reklam, spam, dolandırıcılık ve otomatik (bot) kullanım</li>
        </ul>
        <h2>5. Moderasyon ve yaptırımlar</h2>
        <p>
          Mesajlar gönderilmeden önce otomatik bir filtreden geçer. Kurallara aykırı mesajlar gönderilmez. Kullanıcılar mesajları ve
          köşeleri bildirebilir; yeterli sayıda bildirim alan içerik otomatik olarak gizlenebilir. Platform, kurallara aykırı davranan
          kullanıcıların erişimini önceden bildirimde bulunmaksızın geçici veya süresiz olarak kısıtlayabilir.
        </p>
        <h2>6. İçeriklerin süresi</h2>
        <p>
          Kullanıcıların açtığı köşeler en fazla 24 saat açık kalır; 3 saat boyunca mesaj yazılmayan köşeler daha erken kapanır. Mesajlar
          kalıcı olarak saklanmaz. Bildirilen köşelerin son {SNAPSHOT_SIZE} mesajı inceleme amacıyla saklanır
          (bkz. <Link href="/yasal/aydinlatma-metni">Aydınlatma Metni</Link>).
        </p>
        <h2>7. Hukuka aykırı içerik bildirimi</h2>
        <p>
          Kişilik haklarının ihlal edildiğini düşünen herkes <Link href="/yasal/icerik-kaldirma">İçerik Kaldırma Talebi</Link> formunu
          kullanabilir. Talepler en geç 24 saat içinde sonuçlandırılır.
        </p>
        <h2>8. Sorumluluğun sınırı</h2>
        <p>
          Platform, kullanıcıların oluşturduğu içerikleri önceden denetlemekle yükümlü değildir; hukuka aykırı içerikten haberdar
          edildiğinde mevzuata uygun şekilde içeriği kaldırır. Platform kesintisiz veya hatasız hizmet garantisi vermez.
        </p>
        <h2>9. Değişiklikler</h2>
        <p>Bu koşullar güncellenebilir. Önemli değişikliklerde kullanıcıdan yeniden onay alınır.</p>
        <h2>10. Uygulanacak hukuk</h2>
        <p>Bu koşullara Türkiye Cumhuriyeti hukuku uygulanır.</p>
      </>
    ),
  },

  "topluluk-kurallari": {
    title: "Topluluk Kuralları",
    body: () => (
      <>
        <p>Şark köşesinde herkes misafirdir. Birkaç basit kural:</p>
        <ol>
          <li><b>Kişileri hedef alma.</b> Özel kişilerin adını, fotoğrafını, okulunu, iş yerini yazma. Konular olaylar, yerler ve fikirler hakkında olsun.</li>
          <li><b>Saygılı ol.</b> Küfür, hakaret, nefret söylemi ve ayrımcılık yok.</li>
          <li><b>Kişisel bilgi paylaşma, isteme.</b> Telefon, adres, sosyal medya hesabı, kimlik no paylaşılmaz.</li>
          <li><b>Reklam, spam, bahis yok.</b></li>
          <li><b>18 yaş altı giremez.</b> Reşit olmadığını düşündüğün birini gördüysen bildir.</li>
          <li><b>Rahatsız olursan bildir.</b> Bildirimin anonimdir. Bir mesaj {HIDE_MESSAGE_REPORTS} farklı kişi tarafından bildirilirse herkes için gizlenir.</li>
        </ol>
        <p>Her köşede en fazla {ROOM_CAPACITY} kişi oturur. Birini sadece kendi ekranında gizleyebilir, ona çay ikram edebilirsin ☕</p>
        <p>Bildirim sebepleri: {Object.values(REPORT_REASONS).join(" · ")}</p>
      </>
    ),
  },

  "aydinlatma-metni": {
    title: "KVKK Aydınlatma Metni",
    body: () => (
      <>
        <p className="muted">Sürüm: {PRIVACY_VERSION}</p>
        <Draft />
        <h2>1. Veri sorumlusu</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca veri sorumlusu {DS.name} ({DS.address}, {DS.mersis}).
          İletişim: {DS.email}, KEP: {DS.kep}.
        </p>
        <h2>2. İşlenen veriler, amaçları ve hukuki sebepleri</h2>
        <table>
          <thead><tr><th>Veri</th><th>Amaç</th><th>Hukuki sebep (KVKK md. 5)</th><th>Saklama süresi</th></tr></thead>
          <tbody>
            <tr><td>Oturum kimliği (rastgele, çerezde)</td><td>Hizmeti sunmak, oturumu sürdürmek, yaptırımları uygulamak</td><td>Sözleşmenin kurulması ve ifası</td><td>30 gün</td></tr>
            <tr><td>Onay kaydı (metin sürümü, zaman, IP adresinin tek yönlü özeti, tarayıcı bilgisi)</td><td>Onayın alındığını ispat</td><td>Hukuki yükümlülük, meşru menfaat</td><td>2 yıl</td></tr>
            <tr><td>Trafik bilgileri (IP adresi, port, bağlantı zamanı, oturum kimliği)</td><td>5651 sayılı Kanun kapsamındaki yükümlülük, güvenlik</td><td>Kanunlarda açıkça öngörülmesi, hukuki yükümlülük</td><td>5651 kapsamında 2 yıl; IP adresleri şifreli tutulur</td></tr>
            <tr><td>Mesajlar ve köşe başlıkları</td><td>Sohbet hizmeti</td><td>Sözleşmenin ifası</td><td>Kalıcı olarak saklanmaz; köşe kapanınca (en geç 24 saat) silinir</td></tr>
            <tr><td>Bildirilen köşenin son {SNAPSHOT_SIZE} mesajı ve ilgili oturum kimlikleri</td><td>Şikâyeti incelemek, hukuka aykırılığı önlemek, adli makamların taleplerini karşılamak</td><td>Hukuki yükümlülük, meşru menfaat, bir hakkın tesisi ve korunması</td><td>180 gün; hukuki süreç varsa süreç boyunca</td></tr>
            <tr><td>Seçilen şehir</td><td>Köşe ve takma ad eşleştirmesi</td><td>Sözleşmenin ifası</td><td>Oturum süresince</td></tr>
            <tr><td>Tarayıcıda saklanan tercihler (müzik açık/kapalı, ses düzeyi)</td><td>Tercihleri hatırlamak</td><td>Meşru menfaat</td><td>Cihazında, sen silene kadar</td></tr>
          </tbody>
        </table>
        <p>Konum bilgisi alınmaz; şehir senin beyanındır. Ad, soyad, telefon veya e-posta istenmez.</p>
        <h2>3. Toplama yöntemi</h2>
        <p>Veriler, Platform&apos;u kullanman sırasında elektronik ortamda otomatik yollarla toplanır.</p>
        <h2>4. Aktarım</h2>
        <p>
          Veriler; yalnızca yetkili kamu kurum ve kuruluşlarının (mahkemeler, savcılıklar, kolluk, BTK) usulüne uygun talepleri üzerine ve
          hizmetin sunulması için gerekli barındırma hizmet sağlayıcılarına [BARINDIRMA SAĞLAYICISI, ÜLKE] aktarılabilir.
          [Yurt dışına aktarım varsa KVKK md. 9 kapsamındaki mekanizma burada belirtilecektir.]
        </p>
        <h2>5. Haklarınız (KVKK md. 11)</h2>
        <p>
          Kişisel verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, amacını öğrenme, aktarıldığı üçüncü kişileri bilme,
          düzeltme, silme veya yok edilmesini isteme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsin. Başvurularını
          {" "}{DS.email} adresine iletebilirsin; en geç 30 gün içinde yanıtlanır. Oturumunu ve onayını istediğin zaman sona erdirebilirsin
          (çerezler silinir).
        </p>
      </>
    ),
  },

  "cerez-politikasi": {
    title: "Çerez Politikası",
    body: () => (
      <>
        <Draft />
        <table>
          <thead><tr><th>Çerez / kayıt</th><th>Tür</th><th>Amaç</th><th>Süre</th></tr></thead>
          <tbody>
            <tr><td>sk_session</td><td>Zorunlu</td><td>Onayının ve oturumunun doğrulanması</td><td>30 gün</td></tr>
            <tr><td>sk_analytics</td><td>Zorunlu (tercih kaydı)</td><td>Analitik çerez tercihini hatırlamak</td><td>30 gün</td></tr>
            <tr><td>sk_music, sk_volume (yerel depolama)</td><td>İşlevsel</td><td>Fon müziği tercihini hatırlamak</td><td>Sen silene kadar</td></tr>
          </tbody>
        </table>
        <p>Şu an analitik veya reklam çerezi kullanılmamaktadır. Kullanılırsa yalnızca açık rızanla etkinleştirilir.</p>
      </>
    ),
  },

  kunye: {
    title: "İletişim / Künye",
    body: () => (
      <>
        <Draft />
        <p>5651 sayılı Kanun md. 3 uyarınca tanıtıcı bilgiler:</p>
        <table>
          <tbody>
            <tr><th>Unvan</th><td>{DS.name}</td></tr>
            <tr><th>Adres</th><td>{DS.address}</td></tr>
            <tr><th>Vergi / MERSİS</th><td>{DS.mersis}</td></tr>
            <tr><th>E-posta</th><td>{DS.contact}</td></tr>
            <tr><th>KVKK başvuruları</th><td>{DS.email}</td></tr>
            <tr><th>KEP</th><td>{DS.kep}</td></tr>
          </tbody>
        </table>
        <p>Kişilik hakkı ihlali bildirimleri için <Link href="/yasal/icerik-kaldirma">İçerik Kaldırma Talebi</Link> formunu kullanın.</p>
      </>
    ),
  },

  "icerik-kaldirma": {
    title: "İçerik Kaldırma Talebi",
    body: () => (
      <>
        <p>
          Platform&apos;da kişilik haklarını ihlal eden bir içerik olduğunu düşünüyorsan bu formu doldur. Talepler 5651 sayılı Kanun md. 9
          uyarınca <b>en geç 24 saat</b> içinde sonuçlandırılır. Giriş yapman gerekmez.
        </p>
        <RemovalForm />
        <p className="muted small">Acil bir tehlike varsa 112&apos;yi ara. Çocuk istismarı içeren içerikleri ayrıca ihbarweb.org.tr üzerinden bildirebilirsin.</p>
      </>
    ),
  },
};

type Props = { params: Promise<{ doc: string }> };

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  return { title: DOCS[doc]?.title ?? "Yasal" };
}

export default async function LegalPage({ params }: Props) {
  const { doc } = await params;
  const d = DOCS[doc];
  if (!d) notFound();
  return (
    <article className="legal">
      <h1>{d.title}</h1>
      {d.body()}
    </article>
  );
}
