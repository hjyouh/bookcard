import { CardEditorScreen } from "@/components/card-editor-screen";

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CardEditorScreen localId={id} />;
}
