import { TestRunner } from "@/components/tests/test-runner";

export default async function TestsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return <TestRunner profileId={profileId} />;
}
