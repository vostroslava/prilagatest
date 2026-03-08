"use client";

import Link from "next/link";

import { useProfiles } from "@/components/providers/profiles-provider";
import { Badge } from "@/components/ui/badge";
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
      <Card className="glass-panel border-[color:var(--surface-border)]">
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
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="glass-panel rounded-[2.35rem] p-6 sm:p-7">
          <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
            Export
          </Badge>
          <h1 className="mt-5 font-display text-5xl leading-[0.98] tracking-tight text-foreground">
            Сырые данные и полный пакет профиля
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            Здесь лежат все ответы, item IDs, оригинальные формулировки, переводы,
            признаки обратного кодирования и итоговые шкалы. Это технический слой
            продукта, оформленный в той же системе, что и аналитические экраны.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full px-5">
              <Link href={`/profiles/${profile.profileMeta.id}/results`}>Вернуться к профилю</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link href={`/profiles/${profile.profileMeta.id}/tests`}>Продолжить тесты</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "JSON",
              description: "Полный машинно-читаемый экспорт с rawAnswers, scoring и версиями методик.",
              action: () =>
                downloadBlob(
                  `${filenameBase}.json`,
                  JSON.stringify(profile, null, 2),
                  "application/json",
                ),
            },
            {
              title: "Markdown",
              description: "Человеко-читаемый пакет, который удобно отправлять на ручной анализ.",
              action: () =>
                downloadBlob(
                  `${filenameBase}.md`,
                  generateProfileMarkdown(profile),
                  "text/markdown;charset=utf-8",
                ),
            },
            {
              title: "TXT",
              description: "Тот же пакет без Markdown-разметки для более простых сред.",
              action: () =>
                downloadBlob(
                  `${filenameBase}.txt`,
                  generateProfileMarkdown(profile),
                  "text/plain;charset=utf-8",
                ),
            },
            {
              title: "Summary",
              description: "Короткая сводка по профилю без полного массива сырых данных.",
              action: () =>
                downloadBlob(
                  `${filenameBase}-summary.txt`,
                  generateProfileSummary(profile),
                  "text/plain;charset=utf-8",
                ),
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className="glass-panel rounded-[2rem] p-5 text-left transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground/70">
                Format
              </p>
              <h2 className="mt-4 font-display text-3xl tracking-tight text-foreground">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      <Tabs defaultValue="big-five" className="space-y-6">
        <TabsList className="w-full flex-wrap rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-2">
          <TabsTrigger value="big-five" className="rounded-full px-5">
            Большая пятёрка
          </TabsTrigger>
          <TabsTrigger value="ipip-ipc" className="rounded-full px-5">
            Межличностный стиль
          </TabsTrigger>
          <TabsTrigger value="conflict-profile" className="rounded-full px-5">
            Конфликтный профиль
          </TabsTrigger>
        </TabsList>

        {(["big-five", "ipip-ipc", "conflict-profile"] as const).map((blockId) => (
          <TabsContent key={blockId} value={blockId}>
            <Card className="glass-panel rounded-[2.2rem] border-[color:var(--surface-border)]">
              <CardHeader>
                <CardTitle className="font-display text-3xl tracking-tight">{blockId}</CardTitle>
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
