"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthPanelProps {
  callbackUrl?: string;
}

export function AuthPanel({ callbackUrl = "/" }: AuthPanelProps) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"sign-in" | "sign-up">("sign-in");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [error, setError] = React.useState("");
  const [isBusy, startTransition] = React.useTransition();

  function handleSignIn() {
    startTransition(async () => {
      setError("");
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Не удалось войти. Проверьте username и пароль.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  function handleSignUp() {
    startTransition(async () => {
      setError("");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          displayName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Не удалось создать аккаунт.");
        return;
      }

      const login = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (!login || login.error) {
        setError("Аккаунт создан, но авто-вход не сработал. Попробуйте войти вручную.");
        setTab("sign-in");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <Card className="glass-panel rounded-[2.4rem] border-[color:var(--surface-border)]">
        <CardHeader className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
              Optional account
            </Badge>
            <Badge className="rounded-full border border-[color:var(--surface-border)] bg-[var(--surface-control)] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground shadow-none">
              Hybrid local-first
            </Badge>
          </div>
          <div className="space-y-4">
            <CardTitle className="font-display text-5xl leading-[0.98] tracking-tight text-foreground">
              Аккаунт нужен для sync, backup и доступа с нескольких устройств
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-8">
              Гостевой режим остаётся рабочим. Регистрация открывает безопасный вход,
              синхронизацию профилей с сервером и будущие серверные функции, но не
              превращает продукт в облачный-only сервис.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="space-y-6">
            <TabsList className="w-full rounded-[1.5rem] p-1.5">
              <TabsTrigger value="sign-in" className="rounded-full px-5">
                Войти
              </TabsTrigger>
              <TabsTrigger value="sign-up" className="rounded-full px-5">
                Создать аккаунт
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sign-in" className="space-y-4">
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="например, alina"
                  className="h-13 rounded-[1.4rem] text-base"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Пароль
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Минимум 8 символов"
                  className="h-13 rounded-[1.4rem] text-base"
                  autoComplete="current-password"
                />
              </div>
              <Button
                className="rounded-full px-6"
                disabled={isBusy || !username.trim() || password.length < 8}
                onClick={handleSignIn}
              >
                Войти
              </Button>
            </TabsContent>

            <TabsContent value="sign-up" className="space-y-4">
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Имя в интерфейсе
                </label>
                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Например, Alina"
                  className="h-13 rounded-[1.4rem] text-base"
                  autoComplete="nickname"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Username
                </label>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="только латиница, цифры, . _ -"
                  className="h-13 rounded-[1.4rem] text-base"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Пароль
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Минимум 8 символов"
                  className="h-13 rounded-[1.4rem] text-base"
                  autoComplete="new-password"
                />
              </div>
              <Button
                className="rounded-full px-6"
                disabled={isBusy || !username.trim() || password.length < 8}
                onClick={handleSignUp}
              >
                Создать аккаунт
              </Button>
            </TabsContent>
          </Tabs>

          {error ? (
            <div className="mt-5 rounded-[1.3rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="glass-panel rounded-[2.4rem] border-[color:var(--surface-border)]">
        <CardHeader>
          <CardTitle className="font-display text-3xl tracking-tight">
            Что меняется после входа
          </CardTitle>
          <CardDescription>
            Базовый продукт остаётся прежним: профили, тесты, результаты, экспорт и сравнение.
            Аккаунт добавляет только серверный слой поверх local-first сценария.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            "Гостевой режим без регистрации продолжает работать как раньше.",
            "Профили по-прежнему живут локально в IndexedDB и мгновенно автосохраняются.",
            "После входа доступна синхронизация профилей с Postgres и загрузка на другом устройстве.",
            "Если у гостя уже есть локальные профили, после входа можно выбрать: оставить локально или синхронизировать.",
            "Никаких публичных профилей, соцслоя или matching-механики не появляется.",
          ].map((item, index) => (
            <div
              key={item}
              className="panel-inset rounded-[1.5rem] p-4 text-sm leading-7 text-muted-foreground"
            >
              <span className="mr-3 font-semibold text-foreground/85">{index + 1}.</span>
              {item}
            </div>
          ))}

          <div className="panel-inset rounded-[1.5rem] p-4 text-sm leading-7 text-muted-foreground">
            Не хотите входить сейчас? <Link href="/" className="text-primary hover:underline">Продолжайте как гость</Link>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
