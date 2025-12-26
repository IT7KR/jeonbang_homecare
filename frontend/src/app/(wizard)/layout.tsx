import { Header } from "@/components/common/Header";

/**
 * 마법사 페이지 전용 레이아웃
 *
 * 공통 Header를 포함하되, Footer는 제외하여 마법사에 집중
 */
export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {children}
    </div>
  );
}
