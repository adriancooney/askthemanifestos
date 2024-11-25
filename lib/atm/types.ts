import { answers, parties, partyAssistants, questions } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { AnnotationDelta } from "openai/resources/beta/threads/messages.mjs";
import { z } from "zod";

export type Question = InferSelectModel<typeof questions>;
export type Answer = InferSelectModel<typeof answers>;
export type Party = InferSelectModel<typeof parties>;
export type PartyAssistant = InferSelectModel<typeof partyAssistants>;

export type SupabaseUserMetadata = z.TypeOf<typeof SupabaseUserMetadata>;
export const SupabaseUserMetadata = z.object({
  firstName: z.string().nullable().default(null),
  lastName: z.string().nullable().default(null),
});

export type User = SupabaseUserMetadata & {
  id: string;
  email?: string;
};

export type Session = {
  id: string;
  user: User;
};

export type AnswerEvent =
  | {
      type: "answer.started";
      answer: Answer & { party: Party };
    }
  | {
      type: "answer.delta";
      answerId: Answer["id"];
      delta: string;
      annotations?: AnnotationDelta[];
    }
  | {
      type: "answer.completed";
      answer: Answer & { party: Party };
    };

export type QuestionEvent =
  | {
      type: "question.created";
      question: Question;
    }
  | {
      type: "question.completed";
      question: Question;
      answers: (Answer & { party: Party })[];
    };

export type CreateQuestionAndAnswerEvent = AnswerEvent | QuestionEvent;

export type SerializedParty = Pick<
  Party,
  "slug" | "name" | "url" | "logoImageUrl" | "manifestoUrl"
>;

export type SerializedAnswer = Pick<
  Answer,
  "id" | "content" | "annotations" | "completed" | "index"
> & {
  createdAt: number;
  party: SerializedParty;
};

export type SerializedQuestion = Pick<Question, "content" | "slug"> & {
  createdAt: number;
  answers: SerializedAnswer[];
};

export type SerializedAnswerEvent =
  | {
      type: "answer.started";
      answer: SerializedAnswer;
    }
  | {
      type: "answer.delta";
      answerId: SerializedAnswer["id"];
      delta: string;
      annotations?: AnnotationDelta[];
    }
  | {
      type: "answer.completed";
      answer: SerializedAnswer;
    };

export type SerializedQuestionEvent =
  | {
      type: "question.created";
      question: SerializedQuestion;
    }
  | {
      type: "question.completed";
      question: SerializedQuestion;
    };

export type SerializedCreateQuestionAndAnswerEvent =
  | SerializedAnswerEvent
  | SerializedQuestionEvent;
