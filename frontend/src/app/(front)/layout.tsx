import { FrontLayout } from "@/components/layouts";

export default function FrontOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FrontLayout>{children}</FrontLayout>;
}
