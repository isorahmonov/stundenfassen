import {
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  type AuthProvider,
} from "firebase/auth"
import type { UiStrings } from "@/lib/i18n"

/**
 * Returns a fresh provider instance for re-authentication, keyed by the
 * `providerId` on `user.providerData`. Password/unknown accounts return null
 * (they re-auth with an email+password credential instead of a popup).
 */
export function providerFor(providerId: string | undefined): AuthProvider | null {
  switch (providerId) {
    case "google.com":
      return new GoogleAuthProvider()
    case "github.com":
      return new GithubAuthProvider()
    case "apple.com":
      return new OAuthProvider("apple.com")
    default:
      return null
  }
}

/**
 * Whether the user must verify their email before entering the app: only
 * password accounts that aren't verified yet. Federated sign-ins (Google,
 * GitHub, Apple) are treated as verified and pass through.
 */
export function braucheVerifizierung(user: {
  emailVerified: boolean
  providerData: { providerId: string }[]
}): boolean {
  return !user.emailVerified && user.providerData.some((p) => p.providerId === "password")
}

/**
 * Maps a Firebase auth error code to a friendly, localized UiStrings key.
 * Raw Firebase messages are never shown to the user. Unknown codes fall back
 * to the generic error. `popup-closed-by-user` / `cancelled-popup-request`
 * map to the "cancelled" key; callers may choose to show nothing for those.
 */
export function mapAuthError(code: string): keyof UiStrings {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "AUTH_FEHLER_FALSCHE_DATEN"
    case "auth/invalid-email":
      return "AUTH_FEHLER_EMAIL_UNGUELTIG"
    case "auth/email-already-in-use":
      return "AUTH_FEHLER_EMAIL_VERGEBEN"
    case "auth/weak-password":
      return "AUTH_FEHLER_SCHWACHES_PW"
    case "auth/too-many-requests":
      return "AUTH_FEHLER_ZU_VIELE"
    case "auth/account-exists-with-different-credential":
      return "AUTH_FEHLER_KONTO_ANDERER_ANBIETER"
    case "auth/unauthorized-domain":
      return "AUTH_FEHLER_DOMAIN"
    case "auth/popup-blocked":
      return "AUTH_FEHLER_POPUP_BLOCKIERT"
    case "auth/network-request-failed":
      return "AUTH_FEHLER_NETZWERK"
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "AUTH_FEHLER_ABGEBROCHEN"
    case "auth/operation-not-allowed":
      return "AUTH_FEHLER_NICHT_AKTIVIERT"
    case "auth/user-disabled":
      return "AUTH_FEHLER_DEAKTIVIERT"
    case "auth/requires-recent-login":
      return "AUTH_FEHLER_REAUTH_BENOETIGT"
    default:
      return "AUTH_FEHLER_ALLGEMEIN"
  }
}
