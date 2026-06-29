import { addHours, addMinutes, setHours, setMinutes, isWeekend, format } from "date-fns";

interface SchedulingOptions {
  defaultPinsPerDay?: number;
  postingWindowStart?: number;
  postingWindowEnd?: number;
  timezone?: string;
  minGapMinutes?: number;
  preferWeekends?: boolean;
}

const DEFAULT_OPTIONS: SchedulingOptions = {
  defaultPinsPerDay: 4,
  postingWindowStart: 9,
  postingWindowEnd: 23,
  minGapMinutes: 120,
  preferWeekends: true,
};

export interface ScheduledSlot {
  datetime: Date;
  boardIndex: number;
}

export function generateScheduleSlots(
  date: Date,
  pinCount: number,
  boardNames: string[],
  options: SchedulingOptions = {}
): ScheduledSlot[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const actualCount = Math.min(Math.max(pinCount || opts.defaultPinsPerDay!, 3), 5);
  const slots: ScheduledSlot[] = [];

  const startHour = opts.postingWindowStart!;
  const endHour = opts.postingWindowEnd!;
  const availableHours = endHour - startHour;
  const intervalHours = availableHours / (actualCount + 1);

  for (let i = 0; i < actualCount; i++) {
    const hour = startHour + Math.floor(intervalHours * (i + 1));
    const minute = Math.floor(Math.random() * 60);

    let scheduledDate = setMinutes(setHours(new Date(date), hour), minute);
    slots.push({
      datetime: scheduledDate,
      boardIndex: i % boardNames.length,
    });
  }

  return slots;
}

export function generateMultiDaySchedule(
  dates: Date[],
  pinsPerDay: number[],
  boardNames: string[],
  options: SchedulingOptions = {}
): Map<string, ScheduledSlot[]> {
  const schedule = new Map<string, ScheduledSlot[]>();

  for (let i = 0; i < dates.length; i++) {
    const dateKey = format(dates[i], "yyyy-MM-dd");
    const slots = generateScheduleSlots(dates[i], pinsPerDay[i] || options.defaultPinsPerDay!, boardNames, options);
    schedule.set(dateKey, slots);
  }

  return schedule;
}

export function findOptimalGaps(
  existingDates: Date[],
  allDatesInMonth: Date[],
  desiredPinsPerDay: number
): Date[] {
  const existingSet = new Set(existingDates.map((d) => format(d, "yyyy-MM-dd")));
  return allDatesInMonth.filter((d) => !existingSet.has(format(d, "yyyy-MM-dd")));
}
