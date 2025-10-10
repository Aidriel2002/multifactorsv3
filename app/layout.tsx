import "./globals.css"
import type { Metadata } from "next"
import OAuthDebugger from './components/OAuthDebugger'

export const metadata: Metadata = {
  title: "Multifactors Sales",
  description: "Quotation Management System with Integration",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-800">
        {children}
        <OAuthDebugger />
      </body>
    </html>
  )
}
