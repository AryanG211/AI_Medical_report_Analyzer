import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Health Analyser',
  description: 'Created by Aryan',
  
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
