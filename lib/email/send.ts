import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendEmail({
  to,
  cc,
  betreff,
  text,
  pdfBase64,
  dateiname,
}: {
  to: string
  cc?: string
  betreff: string
  text: string
  pdfBase64: string
  dateiname: string
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    ...(cc ? { cc } : {}),
    subject: betreff,
    text,
    attachments: [
      {
        filename: dateiname,
        content: Buffer.from(pdfBase64, "base64"),
        contentType: "application/pdf",
      },
    ],
  })
}
