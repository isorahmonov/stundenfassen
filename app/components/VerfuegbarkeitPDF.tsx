// React-PDF-Dokument für den Verfügbarkeitsnachweis.
// Wird nur client-seitig gerendert (via PDFVerfuegbarkeitButton).
import "@/lib/pdf/fonts"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { Bundesland, MinusEintrag } from "@/lib/types"
import type { VerfuegbarkeitsBlock } from "@/lib/verfuegbarkeit/verfuegbarkeit"
import { tkWoche } from "@/lib/verfuegbarkeit/kwBerechnung"
import { feiertagName } from "@/lib/calc/holidays"
import { wochenDaten } from "@/lib/verfuegbarkeit/wochenDaten"
import type { Locale } from "@/lib/i18n"
import { pdfStrings } from "@/lib/pdf/pdfStrings"
import { APP_NAME } from "@/lib/brand"

type KwSystem = "tkmaxx" | "iso" | "keine"

function isoWoche(datum: string): number {
  const [y, m, d] = datum.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const dayOfWeek = date.getUTCDay() || 7
  const thursday = new Date(Date.UTC(y, m - 1, d + 4 - dayOfWeek))
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))
  return Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

function berechneKw(datum: string, kwSystem: KwSystem, kwAnker?: string): number | null {
  if (kwSystem === "tkmaxx" && kwAnker) return tkWoche(datum, kwAnker)
  if (kwSystem === "iso") return isoWoche(datum)
  return null
}

function parseDatum(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  // Mittag Lokalzeit — vermeidet Randeffekte bei Zeitzonenumrechnung
  return new Date(y, m - 1, d, 12, 0, 0)
}

function formatDatumKurz(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`
}

function formatDatumLang(iso: string, monate: string[]): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d}. ${monate[m - 1]} ${y}`
}

function blockKey(b: VerfuegbarkeitsBlock): string {
  return `${b.datum}|${b.start}|${b.ende}`
}

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "NotoSans", fontSize: 9, color: "#1c1917" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 14, fontFamily: "NotoSans", fontWeight: 700, marginBottom: 4 },
  headerMeta: { fontSize: 9, color: "#57534e" },
  minusBox: { alignItems: "flex-end" as const },
  minusLabel: { fontSize: 7, fontFamily: "NotoSans", fontWeight: 700, color: "#dc2626", textTransform: "uppercase" as const, marginBottom: 3 },
  minusZeile: { fontSize: 7, color: "#dc2626", marginBottom: 1 },
  minusGesamt: { fontSize: 7, fontFamily: "NotoSans", fontWeight: 700, color: "#dc2626", marginTop: 3 },
  accentBar: { height: 2, backgroundColor: "#2563eb", borderRadius: 1, marginBottom: 20 },
  wocheContainer: { marginBottom: 20 },
  wocheKopf: {
    fontSize: 10, fontFamily: "NotoSans", fontWeight: 700,
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
  thWt: { width: 65, fontSize: 7, color: "#78716c", fontFamily: "NotoSans", fontWeight: 700 },
  thDatum: { width: 70, fontSize: 7, color: "#78716c", fontFamily: "NotoSans", fontWeight: 700 },
  thZeit: { flex: 1, fontSize: 7, color: "#78716c", fontFamily: "NotoSans", fontWeight: 700 },
  tdWt: { width: 65, fontSize: 8 },
  tdDatum: { width: 70, fontSize: 8, color: "#57534e" },
  tdZeit: { flex: 1, fontSize: 8 },
  tdNv: { flex: 1, fontSize: 8, color: "#a8a29e" },
  summeRow: {
    flexDirection: "row", justifyContent: "flex-end",
    paddingTop: 6, marginTop: 2,
  },
  summeText: { fontSize: 8, fontFamily: "NotoSans", fontWeight: 700 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40 },
  footerText: { fontSize: 7, color: "#a8a29e", textAlign: "center" },
})

interface Props {
  startSonntagStr: string
  anzahlWochen: number
  ausgewaehlt: VerfuegbarkeitsBlock[]
  bundesland: Bundesland
  kwSystem: KwSystem
  kwAnker?: string
  wochenStart: "sonntag" | "montag"
  minusEintraege?: MinusEintrag[]
  mitarbeiterName: string
  personalnummer?: string
  fusszeilenText?: string
  locale?: Locale
}

export function VerfuegbarkeitPDF({
  startSonntagStr,
  anzahlWochen,
  ausgewaehlt,
  bundesland,
  kwSystem,
  kwAnker,
  wochenStart,
  minusEintraege = [],
  mitarbeiterName,
  personalnummer,
  fusszeilenText,
  locale = "de",
}: Props) {
  const str = pdfStrings[locale]
  const ausgewaehlteKeys = new Set(ausgewaehlt.map(blockKey))
  const wochen = wochenDaten(startSonntagStr, anzahlWochen)

  return (
    <Document title={str.verfuegbarkeit} author={mitarbeiterName}>
      <Page size="A4" style={s.page}>
        {/* Kopf */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>{str.verfuegbarkeit}</Text>
            <Text style={s.headerMeta}>{str.mitarbeiter}: {mitarbeiterName}</Text>
            {personalnummer && (
              <Text style={s.headerMeta}>{str.personalnummer}: {personalnummer}</Text>
            )}
          </View>
          {minusEintraege.length > 0 && (
            <View style={s.minusBox}>
              <Text style={s.minusLabel}>{str.minusKontoVerfueg}</Text>
              <Text style={s.minusGesamt}>
                {"−"}{(minusEintraege.reduce((acc, e) => acc + e.minuten, 0) / 60).toFixed(1).replace(".", ",")} {str.std}.
              </Text>
            </View>
          )}
        </View>
        <View style={s.accentBar} />

        {/* Pro Woche */}
        {wochen.map((wocheDaten) => {
          const sonntag = wocheDaten[0]
          const samstag = wocheDaten[6]
          // Bei wochenStart="montag": Montag (Index 1) als Referenz für ISO-KW
          const kwRefDatum = wochenStart === "montag" ? wocheDaten[1] : sonntag
          const kwNr = berechneKw(kwRefDatum, kwSystem, kwAnker)

          // Tage in Anzeigereihenfolge: wochenStart="montag" → Mo zuerst (1–6, dann 0)
          const tageIdx = wochenStart === "montag"
            ? [1, 2, 3, 4, 5, 6, 0]
            : [0, 1, 2, 3, 4, 5, 6]

          const wocheMin = ausgewaehlt
            .filter((b) => b.datum >= sonntag && b.datum <= samstag)
            .reduce((acc, b) => acc + b.dauerMin, 0)
          const wocheStunden = (wocheMin / 60).toFixed(1).replace(".", ",")

          return (
            <View key={sonntag} style={s.wocheContainer} wrap={false}>
              <Text style={s.wocheKopf}>
                {kwNr !== null ? `${str.kwPrefix} ${kwNr} · ` : ""}
                {wochenStart === "montag"
                  ? `${formatDatumLang(wocheDaten[1], str.monate)} bis ${formatDatumLang(wocheDaten[0], str.monate)}`
                  : `${formatDatumLang(sonntag, str.monate)} bis ${formatDatumLang(samstag, str.monate)}`
                }
              </Text>

              <View style={s.table}>
                {/* Tabellenkopf */}
                <View style={s.tableHead}>
                  <Text style={s.thWt}>{str.wochentag}</Text>
                  <Text style={s.thDatum}>{str.datum}</Text>
                  <Text style={s.thZeit}>{str.verfuegbareZeit}</Text>
                </View>

                {/* Zeilen in Anzeigereihenfolge */}
                {tageIdx.map((idx) => {
                  const datum = wocheDaten[idx]
                  const date = parseDatum(datum)
                  const feiertag = feiertagName(date, bundesland)
                  const istSo = idx === 0

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
                      <Text style={s.tdWt}>{str.wochentangeLang[idx]}</Text>
                      <Text style={[s.tdDatum, feiertag ? { color: "#dc2626" } : {}]}>
                        {formatDatumKurz(datum)}
                        {feiertag ? ` (${feiertag})` : ""}
                      </Text>
                      {nichtVerfuegbar ? (
                        <Text style={s.tdNv}>{str.nichtVerfuegbar}</Text>
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
                <Text style={s.summeText}>{str.summe}: {wocheStunden} {str.std}</Text>
              </View>
            </View>
          )
        })}

        {/* Fußzeile */}
        {(fusszeilenText !== undefined ? fusszeilenText : APP_NAME) ? (
          <View style={s.footer} fixed>
            <Text style={s.footerText}>{fusszeilenText ?? APP_NAME}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
