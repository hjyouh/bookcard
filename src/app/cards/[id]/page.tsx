import { redirect } from "next/navigation";

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/cards/${id}/edit`);
}
