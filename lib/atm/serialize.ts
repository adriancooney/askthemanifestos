import {
  Answer,
  CreateQuestionAndAnswerEvent,
  Party,
  Question,
  SerializedAnswer,
  SerializedCreateQuestionAndAnswerEvent,
  SerializedParty,
  SerializedQuestion,
} from "./types";

export function serializeQuestion(
  question: Question & { answers: (Answer & { party: Party })[] }
): SerializedQuestion {
  return {
    createdAt: question.createdAt.valueOf(),
    content: question.content,
    answers: question.answers.map(serializeAnswer),
    slug: question.slug,
  };
}

export function serializeAnswer(
  answer: Answer & { party: Party }
): SerializedAnswer {
  return {
    id: answer.id,
    createdAt: answer.createdAt.valueOf(),
    content: answer.content,
    annotations: answer.annotations || [],
    party: serializeParty(answer.party),
    completed: answer.completed,
    index: answer.index,
  };
}

export function serializeParty(party: Party): SerializedParty {
  return {
    slug: party.slug,
    name: party.name,
    logoImageUrl: party.logoImageUrl,
    url: party.url,
    manifestoUrl: party.manifestoUrl,
  };
}

export function serializeCreateQuestionAndAnswerEvent(
  event: CreateQuestionAndAnswerEvent
): SerializedCreateQuestionAndAnswerEvent {
  switch (event.type) {
    case "answer.started":
      return {
        type: "answer.started",
        answer: serializeAnswer(event.answer),
      };
    case "answer.delta":
      return {
        type: "answer.delta",
        answerId: event.answerId,
        delta: event.delta,
        annotations: event.annotations,
      };
    case "answer.completed":
      return {
        type: "answer.completed",
        answer: serializeAnswer(event.answer),
      };
    case "question.created":
      return {
        type: "question.created",
        question: serializeQuestion({
          ...event.question,
          answers: [],
        }),
      };
    case "question.completed":
      return {
        type: "question.completed",
        question: serializeQuestion({
          ...event.question,
          answers: event.answers,
        }),
      };
  }
}
