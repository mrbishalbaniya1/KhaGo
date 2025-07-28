import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'KhaGo',
  description: 'Restaurant Management App by Firebase Studio',
  manifest: '/manifest.json',
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

const mainFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const headlineFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-headline',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${mainFont.variable} ${headlineFont.variable} font-body antialiased`}>
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
