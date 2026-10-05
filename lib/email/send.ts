import nodemailer from "nodemailer"

export async function sendEmail({
  gmailUser,
  gmailAppPassword,
  to,
  cc,
  betreff,
  text,
  pdfBase64,
  dateiname,
}: {
  gmailUser: string
  gmailAppPassword: string
  to: string
  cc?: string
  betreff: string
  text: string
  pdfBase64: string
  dateiname: string
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailAppPassword },
  })
  await transporter.sendMail({
    from: gmailUser,
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
