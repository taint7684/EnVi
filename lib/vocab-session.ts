import type { DueCard, ReviewGrade } from "@/lib/types";

export const GROUP_SIZE = 20;
export const MAX_REQUEUE = 2;

export type SessionMode = "official" | "practice";

export type GradeState = {
  mode: SessionMode;
  queueIndex: number;
  queueLength: number;
  newWordsInGroup: number;
  groupSize: number;
  groupFinished: boolean;
  countedWordIds: string[];
};

export function initialGradeState(groupSize = GROUP_SIZE): GradeState {
  return {
    mode: "official",
    queueIndex: 0,
    queueLength: 0,
    newWordsInGroup: 0,
    groupSize,
    groupFinished: false,
    countedWordIds: [],
  };
}

export function isNewWord(card: DueCard): boolean {
  return card.review === null;
}

export function isDifficult(grade: ReviewGrade): boolean {
  return grade === "again" || grade === "hard";
}

export function shouldRequeue(
  grade: ReviewGrade,
  mode: SessionMode,
  requeueCount: number,
  maxRequeue = MAX_REQUEUE,
): boolean {
  return grade === "again" && mode === "official" && requeueCount < maxRequeue;
}

export type GradeResult = {
  state: GradeState;
  requeue: boolean;
  countedAsNew: boolean;
  reachedGroupEnd: boolean;
};

/**
 * Pure state transition for grading the current card.
 * - Requeues on "again" in official mode (up to maxRequeue).
 * - Counts a word toward the group only the FIRST time that specific NEW word is graded
 *   in official mode (requeued repeats of the same word do not increase the counter).
 * - Flags groupFinished when the group size is reached.
 * Practice mode never requeues and never advances the group counter.
 */
export function applyGrade(
  state: GradeState,
  card: DueCard,
  grade: ReviewGrade,
  requeueCount: number,
  maxRequeue = MAX_REQUEUE,
): GradeResult {
  const requeue = shouldRequeue(grade, state.mode, requeueCount, maxRequeue);
  const alreadyCounted = state.countedWordIds.includes(card.word.id);
  const countedAsNew =
    state.mode === "official" && isNewWord(card) && !alreadyCounted;

  let newWordsInGroup = state.newWordsInGroup;
  const countedWordIds =
    countedAsNew && !alreadyCounted
      ? [...state.countedWordIds, card.word.id]
      : state.countedWordIds;
  if (countedAsNew) newWordsInGroup += 1;

  const reachedGroupEnd =
    state.mode === "official" &&
    !state.groupFinished &&
    newWordsInGroup >= state.groupSize;

  const next: GradeState = {
    mode: state.mode,
    queueIndex: state.queueIndex + 1,
    queueLength: state.queueLength + (requeue ? 1 : 0),
    newWordsInGroup,
    groupSize: state.groupSize,
    groupFinished: state.groupFinished || reachedGroupEnd,
    countedWordIds,
  };

  return { state: next, requeue, countedAsNew, reachedGroupEnd };
}

/** Enter practice mode (Ôn lại nhóm / Ôn từ khó): keep queue, reset position, no group counter. */
export function enterPractice(state: GradeState, queueLength: number): GradeState {
  return {
    ...state,
    mode: "practice",
    queueIndex: 0,
    queueLength,
    groupFinished: false,
  };
}

/** Continue to the next group of new words: reset counter, position and counted set. */
export function continueGroup(state: GradeState, queueLength: number): GradeState {
  return {
    ...state,
    mode: "official",
    queueIndex: 0,
    queueLength,
    newWordsInGroup: 0,
    groupFinished: false,
    countedWordIds: [],
  };
}