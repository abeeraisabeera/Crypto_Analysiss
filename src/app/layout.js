import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Importing fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Updating metadata for the cryptocurrency dashboard project
export const metadata = {
  title: "Cryptocurrency Dashboard",
  description: "A dashboard for analyzing cryptocurrency investment safety.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#27384c] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
