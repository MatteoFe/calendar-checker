import { badgeText, tooltipText } from '../core/badge';
import { nextEvent } from '../core/next-event';
import { setBadge, setTooltip } from '../platform/action';
import { readCache } from '../platform/storage';

// Recomputes badge and tooltip from the cached events
export async function updateBadge(): Promise<void> {
  const now = new Date();
  const next = nextEvent((await readCache()).events, now);
  await setBadge(badgeText(next, now));
  await setTooltip(tooltipText(next, now));
}
