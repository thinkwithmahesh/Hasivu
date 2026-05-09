export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'weekdays';
  interval: number;
  until?: string;
  count?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function expandRecurrence(rule: RecurrenceRule, startDate: Date, maxDays = 180): Date[] {
  const dates: Date[] = [];
  const hardLimit = addDays(startDate, maxDays);
  const until = rule.until ? new Date(rule.until) : hardLimit;
  const maxCount = rule.count ?? 999;
  const interval = Math.max(rule.interval, 1);

  let current = new Date(startDate);

  while (current <= until && current <= hardLimit && dates.length < maxCount) {
    const day = current.getDay();
    const isWeekend = day === 0 || day === 6;

    if (rule.frequency !== 'weekdays' || !isWeekend) {
      dates.push(new Date(current));
    }

    if (rule.frequency === 'weekly') {
      current = addWeeks(current, interval);
    } else {
      current = addDays(current, interval);
    }
  }

  return dates;
}

export function parseRecurrenceRule(ruleString: string): RecurrenceRule {
  const parts = ruleString.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key.toUpperCase()] = value;
    return acc;
  }, {});

  const frequency = (parts.FREQ ?? 'DAILY').toLowerCase();
  if (!['daily', 'weekly', 'weekdays'].includes(frequency)) {
    throw Object.assign(new Error('Unsupported recurrence frequency'), {
      code: 'RECURRENCE_INVALID',
    });
  }

  return {
    frequency: frequency as RecurrenceRule['frequency'],
    interval: Number.parseInt(parts.INTERVAL ?? '1', 10),
    until: parts.UNTIL,
    count: parts.COUNT ? Number.parseInt(parts.COUNT, 10) : undefined,
  };
}
