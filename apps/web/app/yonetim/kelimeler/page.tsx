import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { listWords, pool } from "@/lib/admin/data";
import DbMissing from "@/components/admin/DbMissing";
import Flash from "@/components/admin/Flash";
import WordForm from "@/components/admin/WordForm";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { fmtDate } from "@/components/admin/format";
import { deleteWordAction } from "../actions";

export const metadata: Metadata = { title: "Yasaklı kelimeler" };

export default async function WordsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  if (!pool()) return <DbMissing />;
  const words = await listWords();
  return (
    <>
      <Flash sonuc={sp.sonuc} canli={sp.canli} />
      <h1>Yasaklı kelimeler</h1>
      <p className="muted small">
        Koddaki hazır küfür listesine ek olarak buradan kelime eklenir. Sohbet sunucusu listeyi hemen (ulaşılamazsa en geç 5 dakikada) yeniler.
        Bu kelimeleri içeren mesajlar ve köşe başlıkları gönderilmez.
      </p>
      <WordForm />
      <h2>Liste ({words.length})</h2>
      {words.length === 0 ? <p className="card">Panelden eklenmiş kelime yok.</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Kelime</th><th>Eşleşme</th><th>Eklenme</th><th /></tr></thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.id}>
                  <td><code>{w.pattern}</code></td>
                  <td>{w.kind === "prefix" ? "Bu kökle başlayanlar" : "Kelimenin tamamı"}</td>
                  <td>{fmtDate(w.created_at)}</td>
                  <td>
                    <form action={deleteWordAction}>
                      <input type="hidden" name="id" value={w.id} />
                      <ConfirmButton message={`"${w.pattern}" listeden silinsin mi?`}>Sil</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
