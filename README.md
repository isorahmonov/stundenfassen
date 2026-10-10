This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## E-Mail-Verifizierung (Resend)

Die Verifizierungs-E-Mail nach der Registrierung mit E-Mail/Passwort wird über
[Resend](https://resend.com) versendet. Siehe `.env.example` für alle Variablen.

- **Domain verifizieren:** In Resend eine Domain hinzufügen und die
  bereitgestellten **SPF**- und **DKIM**-DNS-Einträge bei deinem DNS-Anbieter
  setzen. Erst nach erfolgreicher Verifizierung kann von dieser Domain gesendet
  werden.
- **Variablen** (nur serverseitig, nie im Client gebündelt):
  - `RESEND_API_KEY` — API-Key aus dem Resend-Dashboard.
  - `RESEND_FROM` — verifizierte Absenderadresse, z. B.
    `Shiftslot <noreply@deine-domain.tld>`.
- **Fallback:** Sind `RESEND_API_KEY`/`RESEND_FROM` nicht gesetzt (oder liefert
  Resend einen Fehler), antwortet `POST /api/auth/send-verification` mit
  `{ fallback: true }`. Der Client versendet die Mail dann über Firebase
  (`sendEmailVerification`) — so funktioniert die Verifizierung auch lokal und
  ohne verifizierte Domain.
- **Rate-Limit:** max. 5 Versuche pro Stunde je uid und je (gehashter) IP.
- **Datenschutz:** Der `continueUrl` stammt ausschließlich aus einer Allowlist
  (`APP_DOMAINS.current` bzw. `localhost` in Dev), nie aus der Anfrage. Als
  Rate-Limit-Schlüssel wird nur der SHA-256-Hash der IP gespeichert.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
