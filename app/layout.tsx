import type { Metadata } from "next";
import { AuthProvider } from "./AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PDF Reader Pro",
  description: "An elite AI-powered PDF analyzer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="page-container">
        <AuthProvider>
          <div className="main-content">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
