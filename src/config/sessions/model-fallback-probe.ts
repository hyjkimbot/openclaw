import { normalizeOptionalString } from "../../shared/string-coerce.js";
import { hasSessionAutoModelFallbackProvenance } from "./model-override-provenance.js";
import type { SessionEntry } from "./types.js";

export const AUTO_FALLBACK_PRIMARY_PROBE_INTERVAL_MS = 5 * 60 * 1000;

type AutoFallbackProbeEntry = Pick<
  SessionEntry,
  | "providerOverride"
  | "modelOverride"
  | "modelOverrideSource"
  | "modelOverrideFallbackOriginProvider"
  | "modelOverrideFallbackOriginModel"
  | "modelOverrideFallbackLastProbeAt"
>;

export function hasAutoFallbackModelOverride(entry: AutoFallbackProbeEntry | undefined): boolean {
  const hasActiveOverride = Boolean(
    normalizeOptionalString(entry?.providerOverride) ||
    normalizeOptionalString(entry?.modelOverride),
  );
  if (!entry || !hasActiveOverride) {
    return false;
  }
  return Boolean(
    entry.modelOverrideSource === "auto" ||
    (entry.modelOverrideSource === undefined && hasSessionAutoModelFallbackProvenance(entry)),
  );
}

export function shouldProbeAutoFallbackPrimary(params: {
  entry: AutoFallbackProbeEntry | undefined;
  now?: number;
  probeIntervalMs?: number;
}): boolean {
  const { entry } = params;
  if (!hasAutoFallbackModelOverride(entry)) {
    return false;
  }
  const lastProbeAt = entry?.modelOverrideFallbackLastProbeAt;
  if (typeof lastProbeAt !== "number" || !Number.isFinite(lastProbeAt) || lastProbeAt <= 0) {
    return true;
  }
  const now = params.now ?? Date.now();
  return now - lastProbeAt >= (params.probeIntervalMs ?? AUTO_FALLBACK_PRIMARY_PROBE_INTERVAL_MS);
}
