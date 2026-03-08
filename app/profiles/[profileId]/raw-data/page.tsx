import { RawDataView } from "@/components/profile/raw-data-view";

export default async function RawDataPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return <RawDataView profileId={profileId} />;
}
