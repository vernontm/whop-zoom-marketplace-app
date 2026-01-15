import './globals.css'
import '@whop/frosted-ui/dist/index.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Whop Zoom Livestream',
  description: 'Zoom livestreaming for Whop sellers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link type="text/css" rel="stylesheet" href="https://source.zoom.us/3.9.0/css/bootstrap.css" />
        <link type="text/css" rel="stylesheet" href="https://source.zoom.us/3.9.0/css/react-select.css" />
      </head>
      <body className="bg-zinc-950">
        {children}
      </body>
    </html>
  )
}
