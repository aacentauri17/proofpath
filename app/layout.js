import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://proofpath-delta.vercel.app"),
  title: "CredKit - Find certificates that get you hired",
  description: "Browse 450+ free and low-cost certifications, get picks matched to your degree and target role, and track your road to your first internship.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: "CredKit",
    title: "CredKit - Find certificates that get you hired",
    description: "450+ free and low-cost certifications, picked for your degree and target role - plus the proof to build after each one.",
    url: "https://proofpath-delta.vercel.app/",
    images: ["https://proofpath-delta.vercel.app/og-image.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "CredKit - Find certificates that get you hired",
    description: "450+ free and low-cost certifications, picked for your degree and target role - plus the proof to build after each one.",
    images: ["https://proofpath-delta.vercel.app/og-image.png"]
  }
};

export const viewport = { themeColor: "#070b16" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
