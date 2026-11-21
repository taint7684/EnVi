export function todayStrVN(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export function nowVN(): Date {
  return new Date(
    new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
  );
}

export function dateOnlyVN(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

export function isSameDayVN(a: Date | string, b: Date | string): boolean {
  const aStr =
    typeof a === "string" ? a : dateOnlyVN(new Date(a));
  const bStr =
    typeof b === "string" ? b : dateOnlyVN(new Date(b));
  return aStr === bStr;
}

export function dayOfWeekVN(d: Date): number {
  const parts = dateOnlyVN(d).split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getDay();
}
