import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "Yamdata - Connecte-toi, épargne, évolue",
  description: "Yamdata est une application qui vous permet d'acheter des forfaits internet tout en épargnant automatiquement. Transformez votre consommation de data en épargne intelligente.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="overflow-x-hidden">
      <body className="overflow-x-hidden">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
