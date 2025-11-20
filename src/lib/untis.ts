import { authenticator } from "otplib";
import { URL } from "url";
import { WebUntisQR } from "webuntis";
import { toTitleCase, useSettings } from "./util";

export interface Exam {
  endTime: number;
  examDate: number;
  examType: string;
  grade?: string;
  id: number;
  name: string;
  rooms: string[];
  startTime: number;
  studentClass: string[];
  subject: string;
  teachers: string[];
  text: string;
}

export type ExamList = Exam[];

const untis = async () => {
  const { school, key, schoolNumber, username, url } = useSettings();

  const qrData = `untis://setschool?url=${encodeURIComponent(
    url.trim()
  )}&school=${encodeURIComponent(school.trim())}&user=${encodeURIComponent(
    username.trim()
  )}&key=${encodeURIComponent(key)}&schoolNumber=${encodeURIComponent(
    schoolNumber.trim()
  )}`;

  const untis = new WebUntisQR(qrData, "RaycastUntis", authenticator, URL);
  await untis.login();
  return untis;
};
export default untis;

export const getExams = async (date: Date): Promise<ExamList> => {
  const client = await untis();

  const to_date = new Date();
  to_date.setDate(date.getDate() + 30)
  to_date.setHours(23, 59, 59, 999)

  const exams = await client.getExamsForRange(date, to_date);

  return exams.map((e) => {

    return {
      endTime: e.endTime,
      examDate: e.examDate,
      examType: e.examType,
      grade: e.grade,
      id: e.id,
      name: e.name,
      rooms: e.rooms ?? [],
      startTime: e.startTime,
      studentClass: e.studentClass ?? [],
      subject: e.subject,
      teachers: (e.teachers ?? []).map((t) => toTitleCase(t)),
      text: e.text ?? "",

    } satisfies Exam;
  });
};
