// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodemailer = require('nodemailer')

export async function sendPriceAlert({
  to,
  targetPrice,
  lowestPrice,
  siteName,
  siteUrl,
}: {
  to: string
  targetPrice: number
  lowestPrice: number
  siteName: string
  siteUrl: string
}) {
  // Uses Gmail SMTP - set GMAIL_USER and GMAIL_PASS in environment variables
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // Use a Gmail App Password, not your real password
    },
  })

  const subject = `🎟 Ticket alert: Haiti vs Scotland dropped to $${lowestPrice}`
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #1D9E75;">Price alert triggered!</h2>
      <p>A ticket price has dropped below your target of <strong>$${targetPrice}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; color: #666;">Match</td>
          <td style="padding: 8px; font-weight: bold;">Haiti vs Scotland — World Cup Group C</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 8px; color: #666;">Site</td>
          <td style="padding: 8px;">${siteName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #666;">Lowest price</td>
          <td style="padding: 8px; font-size: 24px; font-weight: bold; color: #1D9E75;">$${lowestPrice}</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 8px; color: #666;">Your target</td>
          <td style="padding: 8px;">$${targetPrice}</td>
        </tr>
      </table>
      <a href="${siteUrl}" style="display: inline-block; background: #1D9E75; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
        View tickets →
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        Sent by your Haiti vs Scotland ticket monitor.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
  })
}
