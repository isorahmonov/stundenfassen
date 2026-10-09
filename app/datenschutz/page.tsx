import Link from "next/link"
import { LEGAL, assertKeinePlatzhalter } from "@/lib/legal"

export const metadata = { title: "Datenschutz – Stundenfassen" }

// Drittlandübermittlung-Formulierung: Vor Veröffentlichung juristisch prüfen,
// ob SCC, EU-US DPF oder beides zutrifft und aktuell gültig ist.
const DRITTLAND_HINWEIS =
  "Standardvertragsklauseln (SCC) und/oder EU-US Data Privacy Framework (DPF)"

export default function DatenschutzSeite() {
  assertKeinePlatzhalter()

  return (
    <main className="sf-page min-h-screen px-4 py-8 pb-12">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center gap-3 mb-2">
          <Link href="/profil" className="text-xs sf-text-3 hover:underline">
            ← Zurück
          </Link>
        </div>

        <h1 className="text-xl font-bold sf-text">Datenschutzerklärung</h1>

        {/* 1. Verantwortlicher */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">1. Verantwortlicher</h2>
          <p className="text-sm sf-text-2 leading-relaxed">
            Verantwortlich im Sinne der DSGVO ist:
          </p>
          <p className="text-sm sf-text leading-relaxed whitespace-pre-line">
            {LEGAL.NAME}{"\n"}{LEGAL.ANSCHRIFT}{"\n"}{LEGAL.EMAIL}
          </p>
        </section>

        {/* 2. Welche Daten */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-3">
          <h2 className="text-sm font-semibold sf-text">2. Welche Daten werden verarbeitet?</h2>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">Anmeldedaten (Google OAuth)</h3>
            <p className="text-sm sf-text-2 leading-relaxed">
              Die Anmeldung erfolgt ausschließlich über Google (OAuth 2.0). Dabei erhält die App
              von Google folgende Daten: interne Nutzer-ID (uid), E-Mail-Adresse, Anzeigename
              und Profilbild-URL. Es gibt keine eigene Passwort-Registrierung.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">App-Daten (Zeiterfassung)</h3>
            <p className="text-sm sf-text-2 leading-relaxed">
              In der App werden folgende arbeitsbezogene Daten gespeichert:
              Arbeitgeberdaten (Name, Farbe, Bundesland, Stundenlohn, Zuschläge, optionale
              Personalnummer), Schichteinträge (Datum, Zeiten, Pausen, optionale Notiz),
              Steuereinstellungen (Steuerklasse, Kirchensteuer), Minusstunden-Einträge
              (Datum, Minuten, optionale Notiz), geplante Schichten sowie E-Mail-Vorlagen
              (Empfänger, Betreff, Text) und Abrechnungsabgleiche.
            </p>
            <p className="text-sm sf-text-2 leading-relaxed">
              Personalnummern, Notizen und Arbeitgeberbezeichnungen können personenbezogene
              Daten enthalten.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">Kalenderinhalte (iCal-Integration)</h3>
            <p className="text-sm sf-text-2 leading-relaxed">
              Wenn du eine iCal-URL (z. B. Google Kalender, Hochschulportal) hinterlegst,
              speichert die App die URL inklusive des darin enthaltenen Authentifizierungstokens
              ausschließlich serverseitig. Die abgerufenen Kalenderinhalte (iCal-Text) werden
              serverseitig für maximal 5 Minuten zwischengespeichert. Kalendereinträge können
              persönliche Termine enthalten (z. B. Arzttermine, Lehrveranstaltungen).
              Wenn du einen Kalender entfernst, wird der zugehörige Cache sofort gelöscht.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">Gmail-App-Passwort (optional)</h3>
            {/* TODO: Diesen Absatz anpassen, sobald das App-Passwort verschlüsselt gespeichert
                wird. Aktuell liegt es im Klartext in Firestore /secrets/{uid} — nicht über den
                Browser lesbar (Regeln: allow: false), aber serverseitig unverschlüsselt. */}
            <p className="text-sm sf-text-2 leading-relaxed">
              Wenn du E-Mail-Versand konfigurierst, wird dein Gmail-App-Passwort serverseitig
              gespeichert. Es ist über den Browser nicht lesbar (gesichert durch
              Datenbankregeln). Es wird derzeit nicht verschlüsselt abgelegt; eine
              Verschlüsselung ist für eine spätere Version geplant.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">Server-Logs (Vercel)</h3>
            <p className="text-sm sf-text-2 leading-relaxed">
              Vercel erfasst technisch bedingt Zugriffsdaten wie IP-Adressen und
              Request-Metadaten in Server-Logs. Diese Logs sind für den Betrieb und
              die Fehlerdiagnose notwendig.
            </p>
          </div>
        </section>

        {/* 3. Zweck und Rechtsgrundlagen */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">3. Zweck und Rechtsgrundlagen</h2>
          <p className="text-sm sf-text-2 leading-relaxed">
            Die Verarbeitung erfolgt zur Erbringung der App-Funktionen (Zeiterfassung,
            Lohnberechnung, Kalenderabgleich) auf Basis des Vertrages mit dem Nutzer
            (Art. 6 Abs. 1 lit. b DSGVO) sowie auf Basis berechtigter Interessen
            (Art. 6 Abs. 1 lit. f DSGVO) für den sicheren und fehlerfreien Betrieb der App.
          </p>
          <p className="text-sm sf-text-2 leading-relaxed">
            Es findet keine Werbung, kein Profiling und kein Tracking statt.
          </p>
        </section>

        {/* 4. Auftragsverarbeiter / Drittanbieter */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-3">
          <h2 className="text-sm font-semibold sf-text">4. Auftragsverarbeiter und Drittanbieter</h2>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">Google Firebase (Auth &amp; Firestore)</h3>
            <p className="text-sm sf-text-2 leading-relaxed">
              Authentifizierung und Datenspeicherung erfolgen über Google Firebase
              (Google LLC, USA). Alle oben beschriebenen Nutzerdaten werden in Firestore
              gespeichert. Drittlandübermittlung auf Basis von {DRITTLAND_HINWEIS}.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">Vercel</h3>
            <p className="text-sm sf-text-2 leading-relaxed">
              Hosting und alle serverseitigen API-Funktionen werden über Vercel Inc. (USA)
              betrieben. Drittlandübermittlung auf Basis von {DRITTLAND_HINWEIS}.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">Gmail SMTP (optional)</h3>
            <p className="text-sm sf-text-2 leading-relaxed">
              Wenn du E-Mail-Versand konfigurierst, werden E-Mails über Googles SMTP-Server
              (Google LLC, USA) versendet. Dies gilt nur, wenn du diese Funktion aktiv
              einrichtest. Drittlandübermittlung auf Basis von {DRITTLAND_HINWEIS}.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold sf-text uppercase tracking-wide">Google Calendar / Hochschulportale (optional)</h3>
            <p className="text-sm sf-text-2 leading-relaxed">
              Wenn du eine iCal-URL hinterlegst, ruft der Server die Kalenderinhalte von
              dem jeweiligen Anbieter ab (z. B. Google LLC oder dein Hochschulportal).
              Dies gilt nur, wenn du diese Funktion aktiv einrichtest. Die iCal-URL
              (inklusive Authentifizierungstoken) verlässt dabei nie den Browser und
              wird nur serverseitig verwendet.
            </p>
          </div>
        </section>

        {/* 5. Drittlandübermittlung */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">5. Drittlandübermittlung</h2>
          {/* Formulierung vor Veröffentlichung juristisch prüfen: Sind SCC, DPF oder beide
              als Rechtsgrundlage für alle genannten Anbieter aktuell und korrekt? */}
          <p className="text-sm sf-text-2 leading-relaxed">
            Daten werden in die USA übermittelt. Grundlage sind {DRITTLAND_HINWEIS}.
            Alle genannten Anbieter (Google/Firebase, Vercel) haben sich verpflichtet,
            die DSGVO-Anforderungen für Drittlandübermittlungen einzuhalten.
          </p>
        </section>

        {/* 6. Speicherdauer */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">6. Speicherdauer</h2>
          <p className="text-sm sf-text-2 leading-relaxed">
            App-Daten (Schichten, Arbeitgeber, Einstellungen etc.) werden bis zur Löschung
            deines Kontos gespeichert. Du kannst dein Konto jederzeit löschen; dabei werden
            alle Daten unwiderruflich entfernt (inkl. iCal-Cache und SMTP-Zugangsdaten).
          </p>
          <p className="text-sm sf-text-2 leading-relaxed">
            Kalender-Cache: serverseitig maximal 5 Minuten. Nach Entfernen eines Kalenders
            wird der Cache sofort gelöscht.
          </p>
          <p className="text-sm sf-text-2 leading-relaxed">
            Vercel-Server-Logs: entsprechend der Aufbewahrungszeit von Vercel (typisch
            wenige Tage bis Wochen).
          </p>
        </section>

        {/* 7. Cookies / lokaler Speicher / Service Worker */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">7. Cookies, lokaler Speicher und Service Worker</h2>
          <p className="text-sm sf-text-2 leading-relaxed">
            Die App verwendet keine Tracking-Cookies. Im lokalen Speicher (localStorage)
            des Browsers werden technisch notwendige Daten gespeichert:
          </p>
          <ul className="text-sm sf-text-2 leading-relaxed list-disc list-inside space-y-1 pl-1">
            <li>
              <span className="font-mono text-xs">sf_ical2_*</span> – kurzzeitiger
              Kalender-Cache im Browser (max. 2 Minuten), um unnötige Server-Anfragen
              zu vermeiden.
            </li>
            <li>
              <span className="font-mono text-xs">sf_sel_*</span> – Merken der
              Blockauswahl pro Woche innerhalb der aktuellen Sitzung.
            </li>
          </ul>
          <p className="text-sm sf-text-2 leading-relaxed">
            Diese Einträge dienen ausschließlich der Funktionalität der App und werden
            beim Abmelden gelöscht. Es findet kein Tracking oder Profiling statt.
          </p>
          <p className="text-sm sf-text-2 leading-relaxed">
            Die App registriert einen Service Worker für schnelles Laden und
            Offline-Fähigkeit. Der Service Worker speichert App-Dateien (HTML, CSS, JS)
            im Browser-Cache, aber keine personenbezogenen Nutzerdaten.
          </p>
        </section>

        {/* 8. Betroffenenrechte */}
        <section className="sf-card rounded-2xl shadow-sm px-4 py-4 space-y-2">
          <h2 className="text-sm font-semibold sf-text">8. Deine Rechte</h2>
          <p className="text-sm sf-text-2 leading-relaxed">
            Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Datenübertragbarkeit sowie das Recht auf Widerspruch gegen
            die Verarbeitung (Art. 15–21 DSGVO). Zur Ausübung deiner Rechte wende
            dich an <span className="font-mono text-xs sf-text">{LEGAL.EMAIL}</span>.
          </p>
          <p className="text-sm sf-text-2 leading-relaxed">
            Du kannst dein Konto und alle gespeicherten Daten jederzeit selbst in der
            App unter Profil → Konto löschen.
          </p>
          <p className="text-sm sf-text-2 leading-relaxed">
            Du hast außerdem das Recht, dich bei einer Datenschutz-Aufsichtsbehörde
            zu beschweren.
          </p>
        </section>

        <div className="flex justify-center gap-4 pt-2">
          <Link href="/impressum" className="text-xs sf-text-3 hover:underline">
            Impressum
          </Link>
          <span className="text-xs sf-text-3">·</span>
          <Link href="/profil" className="text-xs sf-text-3 hover:underline">
            Zurück zur App
          </Link>
        </div>
      </div>
    </main>
  )
}
