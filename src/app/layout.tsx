
import type { Metadata } from 'next';
import { Belleza, Alegreya } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'CulinaryFlow',
  description: 'Restaurant Management App by Firebase Studio',
  manifest: '/manifest.json',
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

const headlineFont = Belleza({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: '400'
});

const bodyFont = Alegreya({
  subsets: ['latin'],
  variable: '--font-body',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${headlineFont.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
