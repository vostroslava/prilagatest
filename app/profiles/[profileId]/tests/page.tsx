import { TestRunner } from "@/components/tests/test-runner";

export function generateStaticParams() {
  return [{ profileId: "default" }];
}

export default async function TestsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return <TestRunner profileId={profileId} />;
}
