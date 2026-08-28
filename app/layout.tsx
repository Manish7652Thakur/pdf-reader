import type { Metadata } from "next";
import { AuthProvider } from "./AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PDF Reader Pro",
  description: "Read, scan, and question any PDF — with an AI at the light table beside you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0c12" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="page-container">
        <AuthProvider>
          <div className="main-content">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}