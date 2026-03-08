"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createComparisonPackage, generateComparisonMarkdown } from "@/lib/export/comparison-package";
import { downloadBlob, slugify } from "@/lib/export/download";
import { validateProfileExport } from "@/lib/export/profile-schema";
import type { BlockId } from "@/types/assessment";
import type { FullProfileExport } from "@/types/profile";

function getBlockChartData(
  blockId: BlockId,
  leftProfile: FullProfileExport,
  rightProfile: FullProfileExport,
) {
  return leftProfile.scoring[blockId].map((score) => {
    const rightScore = rightProfile.scoring[blockId].find((entry) => entry.key === score.key);

    return {
      name: score.shortLabel,
      left: score.normalized ?? 0,
      right: rightScore?.normalized ?? 0,
    };
  });
}

export function CompareWorkspace() {
  const { profiles } = useProfiles();
  const [leftProfile, setLeftProfile] = React.useState<FullProfileExport | null>(null);
  const [rightProfile, setRightProfile] = React.useState<FullProfileExport | null>(null);
  const [error, setError] = React.useState<string>("");

  const comparison = React.useMemo(() => {
    if (!leftProfile || !rightProfile) {
      return null;
    }

    return createComparisonPackage(leftProfile, rightProfile);
  }, [leftProfile, rightProfile]);

  async function loadFromFile(
    side: "left" | "right",
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const parsed = validateProfileExport(JSON.parse(await file.text()));
      if (side === "left") {
        setLeftProfile(parsed);
      } else {
        setRightProfile(parsed);
      }
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить экспорт.");
    } finally {
      event.target.value = "";
    }
  }

  function loadFromLocal(side: "left" | "right", profileId: string) {
    const profile = profiles.find((entry) => entry.profileMeta.id === profileId);
    if (!profile) {
      return;
    }

    if (side === "left") {
      setLeftProfile(profile);
    } else {
      setRightProfile(profile);
    }
  }

  const filenameBase =
    comparison &&
    `${slugify(comparison.leftProfile.profileMeta.displayName)}-vs-${slugify(comparison.rightProfile.profileMeta.displayName)}`;

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-white/10">
        <CardHeader className="space-y-4">
          <CardTitle className="font-display text-4xl">Сравнить два полных профиля</CardTitle>
          <CardDescription className="max-w-4xl text-base leading-7">
            Этот режим не считает совместимость и не выносит автоматический вердикт. Он
            показывает два полных профиля рядом, все шкалы и все сырые ответы, а затем
            готовит comparison-package для ручного анализа вне продукта.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {([
          ["left", leftProfile, setLeftProfile],
          ["right", rightProfile, setRightProfile],
        ] as const).map(([side, profile]) => (
          <Card key={side} className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>{side === "left" ? "Профиль 1" : "Профиль 2"}</CardTitle>
              <CardDescription>
                Загрузите JSON-экспорт или выберите уже существующий локальный профиль.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={(value) => loadFromLocal(side, String(value))}>
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder="Выбрать из локальных профилей" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profileOption) => (
                    <SelectItem key={profileOption.profileMeta.id} value={profileOption.profileMeta.id}>
                      {profileOption.profileMeta.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex cursor-pointer items-center justify-center rounded-full border border-dashed border-white/20 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                Загрузить JSON-экспорт
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(event) => void loadFromFile(side, event)}
                />
              </label>

              {profile ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-background/45 p-4">
                  <p className="font-medium text-foreground">{profile.profileMeta.displayName}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {profile.textualInterpretation.shortProfile}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Пока профиль не выбран.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <Card className="glass-panel border-destructive/30">
          <CardContent className="py-4 text-sm text-foreground">{error}</CardContent>
        </Card>
      ) : null}

      {comparison ? (
        <>
          <Card className="glass-panel border-white/10">
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <CardTitle className="font-display text-3xl">
                    {comparison.leftProfile.profileMeta.displayName} и{" "}
                    {comparison.rightProfile.profileMeta.displayName}
                  </CardTitle>
                  <CardDescription className="max-w-4xl text-base leading-7">
                    {comparison.summary.overview}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-full"
                    onClick={() =>
                      downloadBlob(
                        `${filenameBase}-comparison-package.json`,
                        JSON.stringify(comparison, null, 2),
                        "application/json",
                      )
                    }
                  >
                    Подготовить пакет JSON
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                      downloadBlob(
                        `${filenameBase}-comparison-package.md`,
                        generateComparisonMarkdown(comparison),
                        "text/markdown;charset=utf-8",
                      )
                    }
                  >
                    Подготовить пакет Markdown
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="big-five" className="space-y-6">
            <TabsList className="w-full flex-wrap rounded-[1.5rem] bg-background/45 p-2">
              <TabsTrigger value="big-five" className="rounded-full">
                Big Five
              </TabsTrigger>
              <TabsTrigger value="ipip-ipc" className="rounded-full">
                Межличностный стиль
              </TabsTrigger>
              <TabsTrigger value="conflict-profile" className="rounded-full">
                Конфликт
              </TabsTrigger>
            </TabsList>

            {(["big-five", "ipip-ipc", "conflict-profile"] as const).map((blockId) => {
              const chartData = getBlockChartData(blockId, comparison.leftProfile, comparison.rightProfile);
              const comparisonRows = comparison.scaleComparisons.filter(
                (row) => row.blockId === blockId,
              );

              return (
                <TabsContent key={blockId} value={blockId} className="space-y-6">
                  <Card className="glass-panel border-white/10">
                    <CardHeader>
                      <CardTitle>{blockId}</CardTitle>
                      <CardDescription>
                        Визуальное сравнение шкал рядом. Никакого процента «совместимости» здесь нет.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[360px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(214,221,221,0.7)" />
                          <YAxis stroke="rgba(214,221,221,0.7)" domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="left" name={comparison.leftProfile.profileMeta.displayName} fill="rgba(88, 181, 176, 0.88)" radius={[12, 12, 0, 0]} />
                          <Bar dataKey="right" name={comparison.rightProfile.profileMeta.displayName} fill="rgba(228, 156, 81, 0.88)" radius={[12, 12, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="glass-panel border-white/10">
                    <CardHeader>
                      <CardTitle>Таблица различий</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Шкала</TableHead>
                            <TableHead>{comparison.leftProfile.profileMeta.displayName}</TableHead>
                            <TableHead>{comparison.rightProfile.profileMeta.displayName}</TableHead>
                            <TableHead>Разница</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonRows.map((row) => (
                            <TableRow key={`${row.blockId}-${row.scaleKey}`}>
                              <TableCell>{row.label}</TableCell>
                              <TableCell>{row.leftValue ?? "—"}</TableCell>
                              <TableCell>{row.rightValue ?? "—"}</TableCell>
                              <TableCell>{row.absoluteDifference ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="glass-panel border-white/10">
                    <CardHeader>
                      <CardTitle>Сырые ответы рядом</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Шкала</TableHead>
                            <TableHead>{comparison.leftProfile.profileMeta.displayName}</TableHead>
                            <TableHead>{comparison.rightProfile.profileMeta.displayName}</TableHead>
                            <TableHead>Разница</TableHead>
                            <TableHead>Вопрос</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparison.responseComparisons[blockId].map((row) => (
                            <TableRow key={`${blockId}-${row.itemId}`}>
                              <TableCell>{row.itemId}</TableCell>
                              <TableCell>{row.scaleKey}</TableCell>
                              <TableCell>{row.leftAnswer ?? "—"}</TableCell>
                              <TableCell>{row.rightAnswer ?? "—"}</TableCell>
                              <TableCell>{row.absoluteDifference ?? "—"}</TableCell>
                              <TableCell className="min-w-[320px]">{row.question}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
