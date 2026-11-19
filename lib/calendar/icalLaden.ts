import type { TerminRoh } from "@/lib/verfuegbarkeit/eventCache"

const BERLIN = "Europe/Berlin"

export interface KalenderQuelle {
  id: string
  name: string
  farbe: string
  defaultStatus: "LOCKED" | "FLEXIBLE"
}

export interface IcalAnzeigeTermin {
  uid: string
  titel: string
  datum: string      // "yyyy-MM-dd" Berlin, event start date
  datumBis: string   // "yyyy-MM-dd" Berlin, inclusive end (= datum for zeitgebunden single-day)
  startMin: number   // minutes since midnight Berlin; 0 for ganztaegig
  endMin: number     // may exceed 1440 for midnight-crossing; 0 for ganztaegig
  ganztaegig: boolean
  quelleId: string
  quelleName: string
  quelleFarbe: string
}

function berlinDatumStr(d: Date): string {
  return d.toLocaleDateString("sv", { timeZone: BERLIN })
}

function berlinMin(d: Date): number {
  const dtf = new Intl.DateTimeFormat("de-DE", {
    timeZone: BERLIN, hour: "2-digit", minute: "2-digit", hour12: false,
  })
  const [h, m] = dtf.format(d).split(":").map(Number)
  return (h % 24) * 60 + m
}

/** Convert raw API termine to display-ready objects for the Kalender tab. Pure, no I/O. */
export function rohZuAnzeigeTermine(
  roh: TerminRoh[],
  quelle: KalenderQuelle,
): IcalAnzeigeTermin[] {
  return roh.map(t => {
    const beginn = new Date(t.beginn)
    const ende = new Date(t.ende)
    const datum = berlinDatumStr(beginn)

    if (t.ganztaegig) {
      // iCal VALUE=DATE end is exclusive (3-day "Dec 26–28" → ende = Dec 29 UTC midnight).
      // Subtract 1 full day to stay clear of DST boundary at midnight.
      const datumBis = berlinDatumStr(new Date(ende.getTime() - 24 * 60 * 60 * 1000))
      return {
        uid: `${quelle.id}::${t.uid}`,
        titel: t.titel,
        datum,
        datumBis,
        startMin: 0,
        endMin: 0,
        ganztaegig: true,
        quelleId: quelle.id,
        quelleName: quelle.name,
        quelleFarbe: quelle.farbe,
      }
    }

    const startMin = berlinMin(beginn)
    let endMin = berlinMin(ende)
    if (endMin <= startMin) endMin += 24 * 60   // midnight-crossing

    return {
      uid: `${quelle.id}::${t.uid}`,
      titel: t.titel,
      datum,
      datumBis: datum,
      startMin,
      endMin,
      ganztaegig: false,
      quelleId: quelle.id,
      quelleName: quelle.name,
      quelleFarbe: quelle.farbe,
    }
  })
}
