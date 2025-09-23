import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Creators connect",
  description: "connect with creators anytime anywhere",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
        </head>
        <body className={` ${inter.className} `}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          ></ThemeProvider>

          {/*header*/}
          <Header />

          <main className="min-h-screen">{children}</main>

          {/*footer*/}
          <footer className="bg-muted/50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-200">
              <p>Made with struggle by AB</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
