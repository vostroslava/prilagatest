import type { InstrumentSource, LikertOption } from "@/types/assessment";

export const PRODUCT_VERSION = "0.1.0";
export const EXPORT_VERSION = "profile-export-v1";
export const METHODOLOGY_VERSION = "2026.03";
export const CONTENT_VERSION = "2026.03";
export const CONFLICT_MODULE_VERSION = "conflict-module-v1";

export const STANDARD_LIKERT_OPTIONS: LikertOption[] = [
  { value: 1, label: "1", description: "Совсем не похоже на меня" },
  { value: 2, label: "2", description: "Скорее не похоже" },
  { value: 3, label: "3", description: "И так, и так" },
  { value: 4, label: "4", description: "Скорее похоже" },
  { value: 5, label: "5", description: "Очень похоже на меня" },
];

export const BIG_FIVE_SOURCE: InstrumentSource = {
  instrumentId: "ipip-big-five-50",
  instrumentTitle: "50-item IPIP Big-Five Factor Markers",
  sourceUrl: "https://ipip.ori.org/new_ipip-50-item-scale.htm",
  usageNotes:
    "IPIP items are published as public-domain resources; Russian text is based on the official IPIP Russian translation page.",
  translationStatus: "official",
};

export const BIG_FIVE_RUSSIAN_SOURCE_URL =
  "https://ipip.ori.org/Russian50-itemBigFiveFactorMarkers.htm";

export const BIG_FIVE_CODES_SOURCE_URL =
  "https://ipip.ori.org/German50-itemBigFiveFactorMarkers.htm";

export const IPIP_IPC_SOURCE: InstrumentSource = {
  instrumentId: "ipip-ipc-short",
  instrumentTitle: "IPIP-IPC Short Form",
  sourceUrl: "https://ipip.ori.org/newIPIP-IPCSurvey.htm",
  usageNotes:
    "Items are distributed through the public-domain IPIP item pool; the Russian wording in this project is an in-product adaptation from the original English items.",
  translationStatus: "adapted",
};

export const IPIP_IPC_SCORING_SOURCE_URL =
  "https://ipip.ori.org/newIPIP-IPCScoringKey.htm";

export const IPIP_IPC_ANGLE_REFERENCE_URL = "https://www.ipip.uksw.edu.pl/file/60";

export const CONFLICT_SOURCE: InstrumentSource = {
  instrumentId: "conflict-profile-v1",
  instrumentTitle: "Conflict Profile v1",
  sourceUrl: "internal://conflict-profile-v1",
  usageNotes:
    "Internal exploratory block for this product. It is not a validated psychometric instrument and must not be interpreted as clinical or diagnostic.",
  translationStatus: "internal",
};
