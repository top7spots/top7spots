import { requireAdmin } from "@/lib/admin-auth";
import { getAdminData } from "@/lib/data";
import { AdminCrud } from "./sections";

export const dynamic = "force-dynamic";

type AdminDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;
  await requireAdmin();
  const data = await getAdminData();

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminCrud data={data} searchParams={params} />
    </div>
  );
}
