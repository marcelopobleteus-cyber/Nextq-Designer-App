import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FieldRedirectHandler from "@/components/field/FieldRedirectHandler";
import IdleLogout from "@/components/auth/IdleLogout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextQ Designer Suite",
  description: "Spatial planner for CCTV, networking, power, BOM, and infrastructure deployments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('nextq-theme-preference');
                if (theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
              
              // Suppress Google Maps BillingNotEnabledMapError dev overlay popups
              if (typeof window !== 'undefined') {
                window.gm_authFailure = function() {
                  console.warn('Google Maps API Key Notice: Billing not enabled or domain unauthorized.');
                };
                var _origErr = console.error;
                console.error = function() {
                  var msg = arguments[0];
                  if (typeof msg === 'string' && (msg.indexOf('BillingNotEnabledMapError') !== -1 || msg.indexOf('Google Maps JavaScript API error') !== -1)) {
                    console.warn('[Google Maps Dev Notice]', msg);
                    return;
                  }
                  return _origErr.apply(console, arguments);
                };
              }
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <FieldRedirectHandler />
        <IdleLogout />
        {children}
      </body>
    </html>
  );
}
