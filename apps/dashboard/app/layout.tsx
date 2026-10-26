import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { SidebarProviders } from "@repo/ui/sidebar/providers";
import { cn } from "@/lib/utils";
import { SidebarLayout } from "@/components/sidebar-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { AgentBridge } from "@/components/agent-bridge";
import { AuthProvider } from "@/lib/auth";
import { TRPCReactProvider } from "@/lib/trpc/client";
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Pelintir — Dasbor Internal",
  description:
    "Alat internal: koreksi normalisasi, penggabungan alias penyedia, triase laporan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <TRPCReactProvider>
            <AuthProvider>
              <SidebarProviders>
                <SidebarLayout>
                  <AgentBridge>{children}</AgentBridge>
                </SidebarLayout>
              </SidebarProviders>
            </AuthProvider>
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
