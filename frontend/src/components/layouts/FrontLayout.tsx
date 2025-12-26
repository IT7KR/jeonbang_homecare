import { Header, Footer, FAB } from "@/components/common";

interface FrontLayoutProps {
  children: React.ReactNode;
}

export function FrontLayout({ children }: FrontLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FAB />
    </div>
  );
}
