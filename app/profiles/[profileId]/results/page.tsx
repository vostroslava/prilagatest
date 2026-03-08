import { ResultsView } from "@/components/results/results-view";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return <ResultsView profileId={profileId} />;
}
