// React-PDF-Dokument für den Verfügbarkeitsnachweis.
// Wird nur client-seitig gerendert (via PDFVerfuegbarkeitButton).
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { Bundesland } from "@/lib/types"
import type { VerfuegbarkeitsBlock } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import { tkWoche } from "@/lib/verfuegbarkeit/kwBerechnung"
import { feiertagName } from "@/lib/calc/holidays"
import { wochenDaten } from "@/lib/verfuegbarkeit/wochenDaten"

const MITARBEITER = "Iso Rahmonov"
const PERSONALNUMMER = "220264766"

const WOCHENTAGE_KURZ = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
const WOCHENTAGE_LANG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
const MONATE_LANG = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]

function parseDatum(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  // Mittag Lokalzeit — vermeidet Randeffekte bei Zeitzonenumrechnung
  return new Date(y, m - 1, d, 12, 0, 0)
}

function formatDatumKurz(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`
}

function formatDatumLang(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d}. ${MONATE_LANG[m - 1]} ${y}`
}

function blockKey(b: VerfuegbarkeitsBlock): string {
  return `${b.datum}|${b.start}|${b.ende}`
}

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 9, color: "#1c1917" },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  headerMeta: { fontSize: 9, color: "#57534e" },
  accentBar: { height: 2, backgroundColor: "#2563eb", borderRadius: 1, marginBottom: 20 },
  wocheContainer: { marginBottom: 20 },
  wocheKopf: {
    fontSize: 10, fontFamily: "Helvetica-Bold",
    marginBottom: 8, color: "#1c1917",
  },
  table: { borderRadius: 3, overflow: "hidden" },
  tableHead: {
    flexDirection: "row", backgroundColor: "#f5f5f4",
    paddingVertical: 5, paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5, paddingHorizontal: 6,
    borderBottomWidth: 0.5, borderBottomColor: "#e7e5e4",
  },
  rowFeiertag: { backgroundColor: "#fef2f2" },
  rowSonntag: { backgroundColor: "#f5f5f4" },
  thWt: { width: 65, fontSize: 7, color: "#78716c", fontFamily: "Helvetica-Bold" },
  thDatum: { width: 70, fontSize: 7, color: "#78716c", fontFamily: "Helvetica-Bold" },
  thZeit: { flex: 1, fontSize: 7, color: "#78716c", fontFamily: "Helvetica-Bold" },
  tdWt: { width: 65, fontSize: 8 },
  tdDatum: { width: 70, fontSize: 8, color: "#57534e" },
  tdZeit: { flex: 1, fontSize: 8 },
  tdNv: { flex: 1, fontSize: 8, color: "#a8a29e" },
  summeRow: {
    flexDirection: "row", justifyContent: "flex-end",
    paddingTop: 6, marginTop: 2,
  },
  summeText: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40 },
  footerText: { fontSize: 7, color: "#a8a29e", textAlign: "center" },
})

interface Props {
  startSonntagStr: string
  anzahlWochen: number
  ausgewaehlt: VerfuegbarkeitsBlock[]
  bundesland: Bundesland
  kwAnker: string
}

export function VerfuegbarkeitPDF({
  startSonntagStr,
  anzahlWochen,
  ausgewaehlt,
  bundesland,
  kwAnker,
}: Props) {
  const ausgewaehlteKeys = new Set(ausgewaehlt.map(blockKey))
  const wochen = wochenDaten(startSonntagStr, anzahlWochen)

  return (
    <Document title="Verfügbarkeit" author={MITARBEITER}>
      <Page size="A4" style={s.page}>
        {/* Kopf */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Verfügbarkeit</Text>
          <Text style={s.headerMeta}>Mitarbeiter: {MITARBEITER}</Text>
          <Text style={s.headerMeta}>Personalnummer: {PERSONALNUMMER}</Text>
        </View>
        <View style={s.accentBar} />

        {/* Pro Woche */}
        {wochen.map((wocheDaten) => {
          const sonntag = wocheDaten[0]
          const samstag = wocheDaten[6]
          const kwNr = tkWoche(sonntag, kwAnker)

          // Summe der ausgewählten Blöcke in dieser Woche
          const wocheMin = ausgewaehlt
            .filter((b) => b.datum >= sonntag && b.datum <= samstag)
            .reduce((s, b) => s + b.dauerMin, 0)
          const wocheStunden = (wocheMin / 60).toFixed(1).replace(".", ",")

          return (
            <View key={sonntag} style={s.wocheContainer} wrap={false}>
              <Text style={s.wocheKopf}>
                KW {kwNr} · Datum: {formatDatumLang(sonntag)} bis {formatDatumLang(samstag)}
              </Text>

              <View style={s.table}>
                {/* Tabellenkopf */}
                <View style={s.tableHead}>
                  <Text style={s.thWt}>Wochentag</Text>
                  <Text style={s.thDatum}>Datum</Text>
                  <Text style={s.thZeit}>Verfügbare Zeit</Text>
                </View>

                {/* Zeilen So–Sa */}
                {wocheDaten.map((datum, idx) => {
                  const date = parseDatum(datum)
                  const feiertag = feiertagName(date, bundesland)
                  const istSo = idx === 0

                  // Ausgewählte Blöcke für diesen Tag
                  const tagesBlöcke = ausgewaehlt.filter(
                    (b) => b.datum === datum && ausgewaehlteKeys.has(blockKey(b)),
                  )
                  const nichtVerfuegbar = istSo || tagesBlöcke.length === 0

                  return (
                    <View
                      key={datum}
                      style={[
                        s.tableRow,
                        feiertag ? s.rowFeiertag : istSo ? s.rowSonntag : {},
                      ]}
                    >
                      <Text style={s.tdWt}>{WOCHENTAGE_LANG[idx]}</Text>
                      <Text style={[s.tdDatum, feiertag ? { color: "#dc2626" } : {}]}>
                        {formatDatumKurz(datum)}
                        {feiertag ? ` (${feiertag})` : ""}
                      </Text>
                      {nichtVerfuegbar ? (
                        <Text style={s.tdNv}>nicht verfügbar</Text>
                      ) : (
                        <Text style={s.tdZeit}>
                          {tagesBlöcke.map((b) => `${b.start}–${b.ende}`).join(" · ")}
                        </Text>
                      )}
                    </View>
                  )
                })}
              </View>

              {/* Wochensumme */}
              <View style={s.summeRow}>
                <Text style={s.summeText}>Summe: {wocheStunden} Std</Text>
              </View>
            </View>
          )
        })}

        {/* Fußzeile */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Stundenfassen</Text>
        </View>
      </Page>
    </Document>
  )
}
