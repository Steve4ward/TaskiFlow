import { prisma } from "@/lib/db";
import { ensureActiveOrg } from "@/lib/org";
import NewRequestForm from "@/components/request/NewRequestForm";
import type { TemplateSchema } from "@/types/form";

export const metadata = { title: "New Request • TaskiFlow" };

export default async function Page() {
  const org = await ensureActiveOrg();
  const tpl = await prisma.formTemplate.findFirst({
    where: { orgId: org.id, isActive: true },
    orderBy: { version: "desc" },
    select: { id: true, name: true, schema: true },
  });

  const schema = ((tpl?.schema as unknown) ?? { fields: [] }) as TemplateSchema;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New Request</h1>
      <NewRequestForm templateId={tpl?.id ?? null} schema={schema} />
    </div>
  );
}
