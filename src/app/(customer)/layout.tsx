import { CustomerHeader } from "@/components/customer/customer-header";
import { CartDrawer } from "@/components/customer/cart-drawer";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main>{children}</main>
      <CartDrawer />
    </div>
  );
}
