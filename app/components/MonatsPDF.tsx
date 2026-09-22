// React PDF Document — kein "use client" nötig, läuft nur client-side via PDFButton
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { Abgleich, Employer, MinusEintrag, Settings, Shift } from "@/lib/types"
import { berechneMonatsSumme, vergleicheAbgleich, type MonatsSumme } from "@/lib/calc/aggregate"
import { berechneSchicht } from "@/lib/calc/lohn"
import { schichtIntervall, bruttoMinuten as calcBrutto, pauseMinuten as calcPause } from "@/lib/calc/time"
import { pruefePause } from "@/lib/calc/pause"
import { feiertagName, istSonntag } from "@/lib/calc/holidays"
import { parseISO } from "date-fns"
import {
  formatDatum,
  formatStundenDezimal,
  formatWochentag,
} from "@/lib/calc/format"
import type { Bundesland } from "@/lib/types"

const MONATE = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember",
]

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 9, color: "#1c1917" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  headerLeft: { flexDirection: "column" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1c1917" },
  subtitle: { fontSize: 10, color: "#78716c", marginTop: 2 },
  accentBar: { height: 3, borderRadius: 2, marginBottom: 16 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  summaryBox: {
    flex: 1, borderRadius: 6, padding: 10,
    backgroundColor: "#f5f5f4",
  },
  summaryLabel: { fontSize: 7, color: "#78716c", marginBottom: 3, textTransform: "uppercase" },
  summaryValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 7, textTransform: "uppercase", color: "#78716c",
    marginBottom: 6, fontFamily: "Helvetica-Bold", letterSpacing: 0.5,
  },
  table: { borderRadius: 4, overflow: "hidden" },
  tableHead: { flexDirection: "row", backgroundColor: "#f5f5f4", paddingVertical: 5, paddingHorizontal: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: "#e7e5e4" },
  tableRowSonntag: { backgroundColor: "#f5f5f4" },
  tableRowFeiertag: { backgroundColor: "#fef2f2" },
  tableRowPause: { backgroundColor: "#fffbeb" },
  tableRowMinus: { backgroundColor: "#fff1f2" },
  tdMinus: { flex: 1, fontSize: 8, color: "#dc2626" },
  tdMinusStd: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#dc2626", textAlign: "right" as const },
  thDatum: { width: 65, fontSize: 7, color: "#78716c", fontFamily: "Helvetica-Bold" },
  thWochentag: { width: 60, fontSize: 7, color: "#78716c", fontFamily: "Helvetica-Bold" },
  thTime: { width: 38, fontSize: 7, color: "#78716c", fontFamily: "Helvetica-Bold" },
  thRight: { flex: 1, fontSize: 7, color: "#78716c", fontFamily: "Helvetica-Bold", textAlign: "right" },
  tdDatum: { width: 65, fontSize: 8 },
  tdWochentag: { width: 60, fontSize: 8, color: "#57534e" },
  tdTime: { width: 38, fontSize: 8, color: "#57534e" },
  tdRight: { flex: 1, fontSize: 8, textAlign: "right", fontFamily: "Helvetica-Bold" },
  tdRightNormal: { flex: 1, fontSize: 8, textAlign: "right", color: "#57534e" },
  abgleichRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#e7e5e4" },
  abgleichLabel: { fontSize: 8, color: "#57534e" },
  abgleichGruen: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#059669" },
  abgleichGelb: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#d97706" },
  abgleichRot: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#dc2626" },
  footer: { marginTop: "auto", paddingTop: 12, borderTopWidth: 0.5, borderTopColor: "#e7e5e4" },
  footerText: { fontSize: 7, color: "#a8a29e" },
})

interface Props {
  employer: Employer
  monat: number
  jahr: number
  schichten: Shift[]
  settings: Pick<Settings, "steuerklasse" | "kirchensteuer" | "kurzfristigPauschal">
  bundesland: Bundesland
  abgleich: Abgleich | null
  minusEintraege?: MinusEintrag[]
}

export function MonatsPDF({ employer, monat, jahr, schichten, settings, bundesland, abgleich, minusEintraege = [] }: Props) {
  const monatsSumme: MonatsSumme = berechneMonatsSumme(schichten, employer, settings, minusEintraege)
  const abgleichErgebnis = abgleich ? vergleicheAbgleich(monatsSumme, abgleich) : null

  const zeilen = [...schichten].sort((a, b) => a.datum.localeCompare(b.datum)).map((shift) => {
    const datum = parseISO(shift.datum)
    const intervall = schichtIntervall(shift)
    const { nettoMinuten } = berechneSchicht(shift, employer)
    const brutto = calcBrutto(intervall)
    const pause = calcPause(intervall)
    const { ausreichend } = pruefePause(brutto, pause)
    return {
      shift, datum,
      feiertag: feiertagName(datum, bundesland),
      sonntag: istSonntag(datum),
      zuKurzePause: !ausreichend,
      nettoMinuten,
    }
  })

  function ampelStyle(ampel: string) {
    if (ampel === "rot") return s.abgleichRot
    if (ampel === "gelb") return s.abgleichGelb
    return s.abgleichGruen
  }

  return (
    <Document title={`${employer.name} – ${MONATE[monat - 1]} ${jahr}`} author="Stundenfassen">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.title}>{employer.name}</Text>
            <Text style={s.subtitle}>{MONATE[monat - 1]} {jahr}</Text>
          </View>
          <Text style={{ fontSize: 8, color: "#a8a29e", marginTop: 4 }}>Stundenfassen</Text>
        </View>

        {/* Akzent-Balken in Employer-Farbe */}
        <View style={[s.accentBar, { backgroundColor: employer.farbe }]} />

        {/* Zusammenfassung */}
        <View style={s.summaryRow}>
          <View style={s.summaryBox}>
            <Text style={s.summaryLabel}>Stunden</Text>
            <Text style={[s.summaryValue, { color: employer.farbe }]}>
              {formatStundenDezimal(monatsSumme.nettoMinuten)}
            </Text>
          </View>
        </View>

        {/* Schichttabelle */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Schichten</Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={s.thDatum}>Datum</Text>
              <Text style={s.thWochentag}>Wochentag</Text>
              <Text style={s.thTime}>Start</Text>
              <Text style={s.thTime}>P.von</Text>
              <Text style={s.thTime}>P.bis</Text>
              <Text style={s.thTime}>Ende</Text>
              <Text style={s.thRight}>Std</Text>
            </View>
            {zeilen.map((z) => (
              <View
                key={z.shift.id}
                style={[
                  s.tableRow,
                  z.feiertag ? s.tableRowFeiertag : z.sonntag ? s.tableRowSonntag : z.zuKurzePause ? s.tableRowPause : {},
                ]}
              >
                <Text style={s.tdDatum}>{formatDatum(z.shift.datum)}</Text>
                <Text style={s.tdWochentag}>{formatWochentag(z.datum, true)}</Text>
                <Text style={s.tdTime}>{z.shift.start}</Text>
                <Text style={s.tdTime}>{z.shift.pauseVon ?? "—"}</Text>
                <Text style={s.tdTime}>{z.shift.pauseBis ?? "—"}</Text>
                <Text style={s.tdTime}>{z.shift.ende}</Text>
                <Text style={s.tdRight}>{formatStundenDezimal(z.nettoMinuten)}</Text>
              </View>
            ))}
            {[...minusEintraege].sort((a, b) => a.datum.localeCompare(b.datum)).map((e) => (
              <View key={e.id} style={[s.tableRow, s.tableRowMinus]}>
                <Text style={s.tdDatum}>{formatDatum(e.datum)}</Text>
                <Text style={s.tdMinus}>
                  {"Minusstunden" + (e.notiz ? ` · ${e.notiz}` : "")}
                </Text>
                <Text style={s.tdMinusStd}>{"−" + formatStundenDezimal(e.minuten)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Abgleich */}
        {abgleich && abgleichErgebnis && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Abgleich</Text>
            {abgleichErgebnis.differenzStunden !== null && (
              <View style={s.abgleichRow}>
                <Text style={s.abgleichLabel}>
                  Stunden: {formatStundenDezimal(abgleich.lautAbrechnungStunden! * 60)} laut Abr. · {formatStundenDezimal(monatsSumme.nettoMinuten)} erfasst
                </Text>
                <Text style={ampelStyle(abgleichErgebnis.ampelStunden)}>
                  {abgleichErgebnis.differenzStunden >= 0 ? "+" : ""}{formatStundenDezimal(Math.round(Math.abs(abgleichErgebnis.differenzStunden) * 60) * (abgleichErgebnis.differenzStunden < 0 ? -1 : 1))}
                </Text>
              </View>
            )}
          </View>
        )}

      </Page>
    </Document>
  )
}
