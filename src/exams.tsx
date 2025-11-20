import { Color, Icon, List } from "@raycast/api";
import { getProgressIcon, useCachedPromise } from "@raycast/utils";
import React from "react";
import { getExams } from "./lib/untis";
import { formatTimeRange } from "./lib/util";

export type ExamStatus = "finished" | "active" | "upcoming";

const statusColor: Record<ExamStatus, Color> = {
  finished: Color.Green,
  active: Color.Orange,
  upcoming: Color.SecondaryText,
};

function toDate(dateNumber: number, timeNumber: number) {
  const year = Math.floor(dateNumber / 10000);
  const month = Math.floor(dateNumber / 100) % 100;
  const day = dateNumber % 100;

  const hour = Math.floor(timeNumber / 100);
  const minute = timeNumber % 100;

  return new Date(year, month - 1, day, hour, minute);
}

export default function Command() {
  const now = new Date();

  const { data, isLoading } = useCachedPromise(async () => {
    const exams = await getExams(now);

    const oneMonthAhead = new Date();
    oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

    return exams
      .map((exam) => {
        const startDate = toDate(exam.examDate, exam.startTime);
        const endDate = toDate(exam.examDate, exam.endTime);
        let status: ExamStatus = "upcoming";
        if (now > endDate) status = "finished";
        if (now > startDate && now < endDate) status = "active";

        return {
          ...exam,
          start: startDate,
          end: endDate,
          status,
        };
      })
      .filter((e) => e.end >= now && e.start <= oneMonthAhead)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  });

  return (
    <List navigationTitle="Upcoming Exams" isLoading={isLoading} filtering={false}>
      {data && data.length > 0 ? (
        data.map((exam) => {
          const totalMinutes = Math.floor((exam.end.getTime() - exam.start.getTime()) / 1000 / 60);
          const passedMinutes = Math.floor((now.getTime() - exam.start.getTime()) / 1000 / 60);
          const customId = `${exam.id}-${exam.teachers}-${exam.start}`;

          const startDate = toDate(exam.examDate, exam.startTime);

          const msLeft = startDate.getTime() - now.getTime();
          const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

          return (
            <List.Item
              key={customId}
              id={customId}
              title={exam.subject}
              subtitle={exam.teachers.join(", ")}
              icon={{
                value: getProgressIcon(
                  exam.status === "active" ? passedMinutes / totalMinutes : exam.status === "finished" ? 1 : 0,
                  statusColor[exam.status],
                  {
                    background: statusColor[exam.status],
                  },
                ),
                tooltip: exam.status.charAt(0).toUpperCase() + exam.status.slice(1),
              }}
              accessories={[
                {
                  tag: {
                    value: exam.start.toLocaleDateString("de-DE"),
                    color: Color.Purple,
                  },
                },
                {
                  tag: {
                    value: daysLeft.toString(),
                    color: daysLeft <= 2 ? Color.Red : Color.Green,
                  }, tooltip: daysLeft <= 2 ? "Ich würde lernen" : "Alles gut [o]"
                },
                {
                  tag: {
                    value: formatTimeRange(exam.start, exam.end),
                    color: statusColor[exam.status],
                  },
                },
              ]}
            />
          );
        })
      ) : (
        <List.EmptyView
          title="No upcoming exams"
          description="No exams scheduled for the next month."
          icon={Icon.Calendar}
        />
      )}
    </List>
  );
}
