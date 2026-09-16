import { cert, getApps, initializeApp, type App } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

function getOrCreateApp(): App {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      // Vercel speichert den privaten Schlüssel mit literal \n — zurück in echte Newlines wandeln
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  })
}

const adminApp = getOrCreateApp()
export const adminDb = getFirestore(adminApp)
export const adminAuth = getAuth(adminApp)
