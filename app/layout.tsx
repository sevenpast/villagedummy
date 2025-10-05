import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Village - Your Guide to Switzerland',
  description: 'Personal task management system for expats moving to Switzerland',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
