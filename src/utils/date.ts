import dayjs from 'dayjs';

// 格式化日期
export function formatDate(date: string, pattern = 'MMM D, YYYY') {
  return dayjs(date).format(pattern);
}

// 今日 ISO
export function todayISO() {
  return dayjs().format('YYYY-MM-DD');
}

// 获取一周日期数组（周一开始）
export function getWeekDays(date: string) {
  const d = dayjs(date);
  const monday = d.subtract((d.day() + 6) % 7, 'day'); // Monday of the week that includes the date
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day').format('YYYY-MM-DD'));
}

// 月份标签
export function monthLabel(date: string) {
  return dayjs(date).format('MMMM YYYY');
}
