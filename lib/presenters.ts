import type { BlockId, ProfileContext } from "@/types/assessment";

export const PROFILE_CONTEXT_OPTIONS: Array<{
  key: ProfileContext;
  label: string;
  description: string;
}> = [
  {
    key: "for-self",
    label: "Для себя",
    description: "Личный профиль без привязки к конкретной роли.",
  },
  {
    key: "relationships",
    label: "Для отношений",
    description: "Паттерны, важные для романтических отношений и близости.",
  },
  {
    key: "friendship",
    label: "Для дружбы",
    description: "Стиль контакта, который важен в дружеских связях.",
  },
  {
    key: "work",
    label: "Для работы",
    description: "Особенности взаимодействия в рабочих и командных сценариях.",
  },
  {
    key: "other",
    label: "Другое",
    description: "Свободный контекст, если профиль нужен под отдельную задачу.",
  },
];

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function contextLabel(context: ProfileContext) {
  return (
    PROFILE_CONTEXT_OPTIONS.find((option) => option.key === context)?.label ?? context
  );
}

export function blockLabel(blockId: BlockId) {
  const labels: Record<BlockId, string> = {
    "big-five": "Большая пятёрка",
    "ipip-ipc": "Межличностный стиль",
    "conflict-profile": "Конфликтный профиль",
  };

  return labels[blockId];
}

export function statusLabel(status: "not-started" | "in-progress" | "completed") {
  const labels = {
    "not-started": "Не начато",
    "in-progress": "В процессе",
    completed: "Завершено",
  };

  return labels[status];
}

export function completionLabel(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}
