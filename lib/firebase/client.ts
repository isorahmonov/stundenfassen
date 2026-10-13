import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth"
import {
  type Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
// Offline-Persistenz: Firestore-Daten überleben App-Neustarts und sind
// sofort verfügbar ohne Netzwerkwartezustand. Try/catch für den Fall,
// dass Firestore auf dieser App-Instanz bereits initialisiert wurde (Dev HMR).
let db: Firestore
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    ignoreUndefinedProperties: true,
  })
} catch {
  db = getFirestore(app)
}
export { db }
export const googleProvider = new GoogleAuthProvider()
export const githubProvider = new GithubAuthProvider()
export const appleProvider = new OAuthProvider("apple.com")
// Apple Sign-In requires a paid Apple Developer account; gated until configured.
export const AUTH_APPLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_APPLE_ENABLED === "true"

// Use localStorage instead of IndexedDB to avoid "Database is closing/hidden" errors
// under Cross-Origin-Opener-Policy restrictions
setPersistence(auth, browserLocalPersistence).catch(console.error)
