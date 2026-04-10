export const BEIJING_TZ = "Asia/Shanghai";

const formatters = new Map();

export function getFormatter(timeZone, options) {
  const key = `${timeZone}-${JSON.stringify(options)}`;
  if (!formatters.has(key)) {
    formatters.set(
      key,
      new Intl.DateTimeFormat("zh-CN", {
        timeZone,
        ...options
      })
    );
  }
  return formatters.get(key);
}

export function getZonedParts(date, timeZone) {
  const formatter = getFormatter(timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return parts;
}

export function formatTime(hour, minute, second) {
  return [hour, minute, second]
    .filter((item) => item !== undefined)
    .map((item) => String(item).padStart(2, "0"))
    .join(":");
}

export function getOffsetMinutes(date, timeZone) {
  const parts = getZonedParts(date, timeZone);
  const utcFromLocal = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((utcFromLocal - date.getTime()) / 60000);
}

export function getDeltaText(now, timezone) {
  const beijingOffset = getOffsetMinutes(now, BEIJING_TZ);
  const localOffset = getOffsetMinutes(now, timezone);
  const diffMinutes = localOffset - beijingOffset;

  if (diffMinutes === 0) {
    return "与北京同一时间";
  }

  const abs = Math.abs(diffMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const sign = diffMinutes >= 0 ? "+" : "-";

  return `较北京 ${sign}${hours}${minutes ? `小时${minutes}分` : "小时"}`;
}

export function parseTimeToMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function getWeekdayIndex(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function formatWorkdays(days) {
  const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return days.map((day) => names[day]).join(" / ");
}

export function formatBusinessHours(businessHours) {
  const dayText = formatWorkdays(businessHours.workdays);
  const lunchText = Array.isArray(businessHours.lunch)
    ? `，午休 ${businessHours.lunch[0]}-${businessHours.lunch[1]}`
    : "";
  return `${dayText} ${businessHours.start}-${businessHours.end}${lunchText}`;
}

export function getWorkStatus(localParts, businessHours) {
  const weekday = getWeekdayIndex(localParts.year, localParts.month, localParts.day);
  const nowMinutes = localParts.hour * 60 + localParts.minute;
  const startMinutes = parseTimeToMinutes(businessHours.start);
  const endMinutes = parseTimeToMinutes(businessHours.end);
  const hasLunch = Array.isArray(businessHours.lunch);
  const lunchStart = hasLunch ? parseTimeToMinutes(businessHours.lunch[0]) : null;
  const lunchEnd = hasLunch ? parseTimeToMinutes(businessHours.lunch[1]) : null;

  if (!businessHours.workdays.includes(weekday)) {
    return { kind: "off", label: "非工作日" };
  }

  if (nowMinutes < startMinutes) {
    const diff = startMinutes - nowMinutes;
    if (diff <= 90) {
      return { kind: "upcoming", label: `${Math.max(diff, 1)} 分钟后上班` };
    }
    return { kind: "off", label: "未上班" };
  }

  if (hasLunch && nowMinutes >= lunchStart && nowMinutes < lunchEnd) {
    return { kind: "break", label: "午休中" };
  }

  if (nowMinutes >= endMinutes) {
    return { kind: "off", label: "已下班" };
  }

  const diffToEnd = endMinutes - nowMinutes;
  if (diffToEnd <= 60) {
    return { kind: "upcoming", label: `${Math.max(diffToEnd, 1)} 分钟后下班` };
  }

  return { kind: "working", label: "工作中" };
}

export function zonedLocalTimeToUtc(timezone, localParts, hhmm) {
  const [hour, minute] = hhmm.split(":").map(Number);
  const guess = Date.UTC(localParts.year, localParts.month - 1, localParts.day, hour, minute, 0);
  let date = new Date(guess);
  let offset = getOffsetMinutes(date, timezone);
  date = new Date(guess - offset * 60000);
  offset = getOffsetMinutes(date, timezone);
  return new Date(guess - offset * 60000);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function addDays(parts, delta) {
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day + delta, parts.hour || 0, parts.minute || 0, 0);
  const next = new Date(utc);
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate()
  };
}

function getDateKey(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function formatRelativeDay(parts) {
  const nowBeijing = getZonedParts(new Date(), BEIJING_TZ);
  const target = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
  const today = `${nowBeijing.year}-${pad(nowBeijing.month)}-${pad(nowBeijing.day)}`;
  const tomorrow = getDateKey(addDays(nowBeijing, 1));
  const yesterday = getDateKey(addDays(nowBeijing, -1));

  if (target === today) {
    return "今天";
  }
  if (target === tomorrow) {
    return "明天";
  }
  if (target === yesterday) {
    return "昨天";
  }
  return `${parts.month}/${parts.day}`;
}

export function getBeijingWindowText(country, localParts) {
  const startUtc = zonedLocalTimeToUtc(country.timezone, localParts, country.businessHours.start);
  const endUtc = zonedLocalTimeToUtc(country.timezone, localParts, country.businessHours.end);
  const beijingStart = getZonedParts(startUtc, BEIJING_TZ);
  const beijingEnd = getZonedParts(endUtc, BEIJING_TZ);

  return `${formatRelativeDay(beijingStart)} ${formatTime(beijingStart.hour, beijingStart.minute)} - ${formatRelativeDay(beijingEnd)} ${formatTime(beijingEnd.hour, beijingEnd.minute)}`;
}

export function getContactTip(status) {
  if (status.kind === "working") {
    return "适合发 WhatsApp、邮件或安排通话。";
  }
  if (status.kind === "break") {
    return "可发邮件，电话和即时通话建议稍后。";
  }
  if (status.label.includes("下班")) {
    return "适合发邮件收口，不建议现在安排电话或会议。";
  }
  if (status.label.includes("上班")) {
    return "可以先发预热消息，正式跟进等上班后。";
  }
  if (status.label === "非工作日") {
    return "建议只发邮件，不建议即时追单。";
  }
  return "适合邮件开发，不建议直接电话联系。";
}
