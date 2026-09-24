export interface OverviewStat {
  id: string;
  label: string;
  value: string;
  sub: string;
}

export interface WeeklyActivityDay {
  day: string;
  minutes: number;
}

export interface DeadlineItem {
  id: string;
  title: string;
  subject: string;
  date: string;
  daysLeft: number;
}