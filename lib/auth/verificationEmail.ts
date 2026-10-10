import { type Locale, DEFAULT_LOCALE } from "@/lib/i18n"
import { APP_NAME } from "@/lib/brand"

// Verifizierungs-E-Mail in 4 Sprachen. Einzige personenbezogene Angabe ist der
// Bestätigungslink (enthält die E-Mail-Adresse) — sonst neutraler Markentext.

export interface MailInhalt {
  betreff: string
  html: string
  text: string
}

interface Vorlage {
  betreff: string
  titel: string
  absatz: string
  button: string
  fallback: string
  ignorieren: string
}

const VORLAGEN: Record<Locale, Vorlage> = {
  de: {
    betreff: `${APP_NAME}: E-Mail bestätigen`,
    titel: "Bestätige deine E-Mail-Adresse",
    absatz: `Klicke auf den Button, um deine E-Mail-Adresse für ${APP_NAME} zu bestätigen.`,
    button: "E-Mail bestätigen",
    fallback: "Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:",
    ignorieren: "Wenn du dich nicht registriert hast, kannst du diese E-Mail ignorieren.",
  },
  en: {
    betreff: `${APP_NAME}: Confirm your email`,
    titel: "Confirm your email address",
    absatz: `Click the button to confirm your email address for ${APP_NAME}.`,
    button: "Confirm email",
    fallback: "If the button doesn't work, copy this link into your browser:",
    ignorieren: "If you didn't sign up, you can safely ignore this email.",
  },
  ru: {
    betreff: `${APP_NAME}: подтвердите e-mail`,
    titel: "Подтвердите адрес электронной почты",
    absatz: `Нажмите кнопку, чтобы подтвердить адрес электронной почты для ${APP_NAME}.`,
    button: "Подтвердить e-mail",
    fallback: "Если кнопка не работает, скопируйте эту ссылку в браузер:",
    ignorieren: "Если вы не регистрировались, просто проигнорируйте это письмо.",
  },
  fr: {
    betreff: `${APP_NAME} : confirmez votre e-mail`,
    titel: "Confirmez votre adresse e-mail",
    absatz: `Cliquez sur le bouton pour confirmer votre adresse e-mail pour ${APP_NAME}.`,
    button: "Confirmer l'e-mail",
    fallback: "Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :",
    ignorieren: "Si vous ne vous êtes pas inscrit, ignorez simplement cet e-mail.",
  },
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function verifizierungsEmail(locale: Locale, link: string): MailInhalt {
  const v = VORLAGEN[locale] ?? VORLAGEN[DEFAULT_LOCALE]
  const l = escape(link)
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
  <h1 style="font-size:20px;margin:0 0 16px">${escape(v.titel)}</h1>
  <p style="font-size:15px;line-height:1.5;margin:0 0 24px">${escape(v.absatz)}</p>
  <p style="margin:0 0 24px"><a href="${l}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px;font-size:15px">${escape(v.button)}</a></p>
  <p style="font-size:13px;line-height:1.5;color:#78716c;margin:0 0 8px">${escape(v.fallback)}</p>
  <p style="font-size:13px;word-break:break-all;margin:0 0 24px"><a href="${l}" style="color:#4f46e5">${l}</a></p>
  <p style="font-size:12px;color:#a8a29e;margin:0">${escape(v.ignorieren)} — ${escape(APP_NAME)}</p>
</div>
</body></html>`
  const text = `${v.titel}\n\n${v.absatz}\n\n${link}\n\n${v.ignorieren}\n${APP_NAME}`
  return { betreff: v.betreff, html, text }
}
