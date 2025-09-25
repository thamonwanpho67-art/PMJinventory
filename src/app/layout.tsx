import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { Providers } from "@/components/providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ระบบจัดการครุภัณฑ์",
  description: "ระบบจัดการครุภัณฑ์สำหรับองค์กร",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${kanit.variable} font-kanit antialiased bg-gradient-to-br from-pink-50 to-rose-50`}
      >
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

