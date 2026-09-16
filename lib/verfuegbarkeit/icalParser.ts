import ICAL from "ical.js"

export interface KalenderTermin {
  uid: string
  titel: string
  beginn: Date
  ende: Date
  ganztaegig: boolean
  ort?: string
}

/**
 * Parst einen iCal-Text und gibt alle Termine im Bereich [vonDatum, bisDatum] zurück.
 *
 * Behandelt korrekt:
 * - RRULE: wiederkehrende Termine werden zu Einzelterminen aufgelöst
 * - EXDATE: ausgefallene Termine verschwinden
 * - RECURRENCE-ID: verschobene Einzeltermine ersetzen die Serieninstanz
 * - VTIMEZONE: Zeitzonen (inkl. Europe/Berlin mit Sommerzeitumstellung)
 * - DATE-only (VALUE=DATE): ganztägige Termine
 */
export function parseIcal(
  text: string,
  vonDatum: Date,
  bisDatum: Date,
): KalenderTermin[] {
  const jcal = ICAL.parse(text)
  const vcal = new ICAL.Component(jcal)
  const vevents = vcal.getAllSubcomponents("vevent")

  // Aufteilen in Haupttermine (ohne RECURRENCE-ID) und Ausnahmen (mit RECURRENCE-ID)
  const masterKomponenten = new Map<string, ICAL.Component>()
  const ausnahmenKomponenten = new Map<string, ICAL.Component[]>()

  for (const vevent of vevents) {
    const uid = vevent.getFirstPropertyValue("uid")
    if (typeof uid !== "string" || !uid) continue

    if (vevent.getFirstProperty("recurrence-id")) {
      const liste = ausnahmenKomponenten.get(uid) ?? []
      liste.push(vevent)
      ausnahmenKomponenten.set(uid, liste)
    } else {
      masterKomponenten.set(uid, vevent)
    }
  }

  const ergebnis: KalenderTermin[] = []
  const vonIcal = ICAL.Time.fromJSDate(vonDatum, true)
  const bisIcal = ICAL.Time.fromJSDate(bisDatum, true)

  for (const [uid, masterComp] of masterKomponenten) {
    const event = new ICAL.Event(masterComp)

    // Ausnahmen registrieren — ICAL.Event.relateException() sorgt dafür, dass
    // getOccurrenceDetails() bei diesem Zeitpunkt die Ausnahme zurückgibt
    for (const ausnahmeComp of ausnahmenKomponenten.get(uid) ?? []) {
      event.relateException(new ICAL.Event(ausnahmeComp))
    }

    if (event.isRecurring()) {
      const iter = event.iterator()
      let naechsteZeit: ICAL.Time | null

      while ((naechsteZeit = iter.next())) {
        // Sicherheitsstop: nach bisDatum abbrechen
        if (naechsteZeit.compare(bisIcal) > 0) break
        // Vor vonDatum überspringen
        if (naechsteZeit.compare(vonIcal) < 0) continue

        const detail = event.getOccurrenceDetails(naechsteZeit)
        ergebnis.push({
          uid,
          titel: detail.item.summary ?? "",
          beginn: detail.startDate.toJSDate(),
          ende: detail.endDate.toJSDate(),
          ganztaegig: detail.startDate.isDate,
          ort: detail.item.location || undefined,
        })
      }
    } else {
      // Einzeltermin
      const beginn = event.startDate.toJSDate()
      const ende = event.endDate.toJSDate()
      if (beginn <= bisDatum && ende >= vonDatum) {
        ergebnis.push({
          uid,
          titel: event.summary ?? "",
          beginn,
          ende,
          ganztaegig: event.startDate.isDate,
          ort: event.location || undefined,
        })
      }
    }
  }

  return ergebnis.sort((a, b) => a.beginn.getTime() - b.beginn.getTime())
}
