import "./globals.css";
import { Providers } from "@/components/providers/session-provider";

export const metadata = {
  title: "DealMind - Domínio Financeiro",
  description: "Infraestrutura inicial para o domínio financeiro testável"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

