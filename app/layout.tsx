import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Haiti vs Scotland — Ticket Monitor',
  description: 'Live ticket price tracker for Haiti vs Scotland World Cup Group C',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
