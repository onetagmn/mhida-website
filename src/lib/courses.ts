import type { CertificateCourseText } from "@/components/CourseCertificate";

// The English course's stages. Each lesson row in course_lessons carries
// its stage in the `course` column (migration22_course_levels.sql).
export type CourseId = "a1b1" | "b1b2";

export const COURSES: Record<
  CourseId,
  {
    href: string;
    titleMn: string;
    titleEn: string;
    subtitle: string;
    certificate: CertificateCourseText;
  }
> = {
  a1b1: {
    href: "/trainings/english",
    titleMn: "Англи хэлний курс",
    titleEn: "English Course",
    subtitle: "Open Frequency English — 30-Day Speaking Course (CEFR A1–B1)",
    certificate: {
      line1Mn: "«Open Frequency English» — Ярианы англи хэлний 30 өдрийн курсыг",
      line1En: "for successfully completing the 30-day spoken English course",
      line2Mn: "амжилттай төгссөнийг гэрчилж олгов. (CEFR A1–B1 түвшин)",
      line2En: "“Open Frequency English” (CEFR Level A1–B1)",
    },
  },
  b1b2: {
    href: "/trainings/english-advanced",
    titleMn: "Англи хэлний курс — 2-р шат",
    titleEn: "English Course — Stage 2",
    subtitle: "Open Frequency English — Stage 2: Professional English for Health Insurance Doctors, 30 Days (CEFR B1–B2)",
    certificate: {
      line1Mn: "«Open Frequency English» — Мэргэжлийн англи хэлний 30 өдрийн 2-р шатны курсыг",
      line1En: "for successfully completing the 30-day professional English course",
      line2Mn: "амжилттай төгссөнийг гэрчилж олгов. (CEFR B1–B2 түвшин)",
      line2En: "“Open Frequency English — Stage 2” (CEFR Level B1–B2)",
    },
  },
};
