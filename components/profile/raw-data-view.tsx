"use client";

import Link from "next/link";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadBlob, slugify } from "@/lib/export/download";
import {
  generateProfileMarkdown,
  generateProfileSummary,
} from "@/lib/export/profile-export";

interface RawDataViewProps {
  profileId: string;
}

export function RawDataView({ profileId }: RawDataViewProps) {
  const { profiles } = useProfiles();
  const profile = profiles.find((entry) => entry.profileMeta.id === profileId) ?? null;

  if (!profile) {
    return (
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle>Профиль не найден</CardTitle>
          <CardDescription>
            Откройте локальный профиль заново или создайте новый.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-full">
            <Link href="/profiles/new">Создать профиль</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filenameBase = `${slugify(profile.profileMeta.displayName)}-${profile.profileMeta.id.slice(0, 8)}`;

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-white/10">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="font-display text-3xl">Сырые данные и экспорт</CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-base leading-7">
                Здесь лежат все ответы по блокам, item IDs, оригинальные формулировки,
                переводы, признаки обратного кодирования и итоговые шкалы. Это главный
                экран для ручного анализа и полной выгрузки.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full"
                onClick={() =>
                  downloadBlob(
                    `${filenameBase}.json`,
                    JSON.stringify(profile, null, 2),
                    "application/json",
                  )
                }
              >
                Экспорт JSON
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  downloadBlob(
                    `${filenameBase}.md`,
                    generateProfileMarkdown(profile),
                    "text/markdown;charset=utf-8",
                  )
                }
              >
                Экспорт Markdown
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  downloadBlob(
                    `${filenameBase}.txt`,
                    generateProfileMarkdown(profile),
                    "text/plain;charset=utf-8",
                  )
                }
              >
                Экспорт TXT
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  downloadBlob(
                    `${filenameBase}-summary.txt`,
                    generateProfileSummary(profile),
                    "text/plain;charset=utf-8",
                  )
                }
              >
                Короткая сводка
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="big-five" className="space-y-6">
        <TabsList className="w-full flex-wrap rounded-[1.5rem] bg-background/45 p-2">
          <TabsTrigger value="big-five" className="rounded-full">
            Большая пятёрка
          </TabsTrigger>
          <TabsTrigger value="ipip-ipc" className="rounded-full">
            Межличностный стиль
          </TabsTrigger>
          <TabsTrigger value="conflict-profile" className="rounded-full">
            Конфликтный профиль
          </TabsTrigger>
        </TabsList>

        {(["big-five", "ipip-ipc", "conflict-profile"] as const).map((blockId) => (
          <TabsContent key={blockId} value={blockId}>
            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle>{blockId}</CardTitle>
                <CardDescription>
                  Полный список вопросов, ответов и метаданных по блоку.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>№</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Шкала</TableHead>
                      <TableHead>Ответ</TableHead>
                      <TableHead>Reverse</TableHead>
                      <TableHead>Оригинал</TableHead>
                      <TableHead>Русский текст</TableHead>
                      <TableHead>Источник</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.rawAnswers[blockId].map((response) => (
                      <TableRow key={response.itemId}>
                        <TableCell>{response.order}</TableCell>
                        <TableCell>{response.itemId}</TableCell>
                        <TableCell>{response.scaleKey}</TableCell>
                        <TableCell>{response.answer ?? "—"}</TableCell>
                        <TableCell>{response.reverseKeyed ? "Да" : "Нет"}</TableCell>
                        <TableCell className="min-w-[260px]">{response.originalText}</TableCell>
                        <TableCell className="min-w-[320px]">{response.russianText}</TableCell>
                        <TableCell className="min-w-[220px]">
                          {response.source.instrumentTitle}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
