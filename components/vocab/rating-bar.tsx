"use client";

import type { ReviewGrade } from "@/lib/types";

const RATINGS: {
  grade: ReviewGrade;
  label: string;
  hint: string;
  className: string;
}[] = [
  {
    grade: "again",
    label: "Again",
    hint: "Chưa thuộc",
    className: "bg-red-500 text-white hover:bg-red-600",
  },
  {
    grade: "hard",
    label: "Hard",
    hint: "Khó",
    className: "bg-amber-500 text-white hover:bg-amber-600",
  },
  {
    grade: "good",
    label: "Good",
    hint: "Ổn",
    className: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  {
    grade: "easy",
    label: "Easy",
    hint: "Dễ",
    className: "bg-sky-500 text-white hover:bg-sky-600",
  },
];

export function RatingBar({
  onRate,
  disabled,
}: {
  onRate: (grade: ReviewGrade) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto mt-6 grid max-w-xl grid-cols-4 gap-2">
      {RATINGS.map((rating, index) => (
        <button
          key={rating.grade}
          type="button"
          disabled={disabled}
          onClick={() => onRate(rating.grade)}
          className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${rating.className}`}
        >
          <span>{rating.label}</span>
          <span className="text-[11px] font-normal opacity-80">
            {rating.hint}
          </span>
          <span className="text-[10px] opacity-60">{index + 1}</span>
        </button>
      ))}
    </div>
  );
}