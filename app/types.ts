import { SerializedAnswer, SerializedQuestion } from "@/lib/atm/types";
import { AnnotationDelta } from "openai/resources/beta/threads/messages";

export type LocalAnswer = Omit<SerializedAnswer, "annotations"> & {
  isLoading: boolean;
  annotations: AnnotationDelta[];
};

export type LocalQuestion = Omit<SerializedQuestion, "answers"> & {
  answers: LocalAnswer[];
  isLoading: boolean;
  error: string | null;
};
