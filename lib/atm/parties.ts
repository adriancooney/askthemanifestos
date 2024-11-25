import { nanoid } from "nanoid";
import { getOpenAI } from "../openai";
import { resolve } from "node:path";
import { db } from "@/db";
import { answers, parties, partyAssistants, questions } from "@/db/schema";
import { and, eq, inArray, InferInsertModel } from "drizzle-orm";
import { NotFoundError } from "./errors";
import {
  Answer,
  AnswerEvent,
  Party,
  PartyAssistant,
  Question,
  QuestionEvent,
  User,
} from "./types";
import { merge } from "ix/asynciterable";

export const MANIFESTO_DIR = resolve(__dirname, "../../data/manifestos");

export async function* createAndAnswerQuestionForPartiesIterator(
  userId: string,
  questionContent: string,
  partySlugs: string[]
): AsyncIterableIterator<QuestionEvent | AnswerEvent> {
  if (!partySlugs.length) {
    throw new Error(`No parties found, cannot create question and answers`);
  }

  const question = await createQuestion(userId, questionContent);

  yield { type: "question.created", question };

  const iterables = partySlugs.map((partySlug, index) =>
    createAnswerForQuestionAndPartyIterator(question, partySlug, index)
  );

  const answers: (Answer & { party: Party })[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const event of merge<AnswerEvent>(...(iterables as [any]))) {
    yield event;

    if (event.type === "answer.completed") {
      answers.push(event.answer);
    }
  }

  const [updatedQuestion] = await db
    .update(questions)
    .set({
      completed: true,
    })
    .where(eq(questions.id, question.id))
    .returning();

  yield {
    type: "question.completed",
    question: updatedQuestion,
    answers,
  };
}

export async function createQuestion(
  userId: string,
  content: string
): Promise<Question> {
  const [question] = await db
    .insert(questions)
    .values({
      slug: nanoid(),
      userId,
      content,
    })
    .returning();

  return question;
}

async function* createAnswerForQuestionAndPartyIterator(
  question: Question,
  partySlug: Party["slug"],
  index: number
): AsyncIterableIterator<AnswerEvent> {
  const party = await getPartyBySlug(partySlug);
  const defaultPartyAssistant = party.defaultPartyAssistant;

  if (!defaultPartyAssistant) {
    throw new Error(`No default party assistant found`);
  }

  const [answer] = await db
    .insert(answers)
    .values({
      index,
      questionId: question.id,
      partyAssistantId: defaultPartyAssistant.id,
      content: "",
      completed: false,
    })
    .returning();

  const stream = await getOpenAI().beta.threads.createAndRunStream({
    assistant_id: defaultPartyAssistant.openAiAssistantId,
    thread: {
      messages: [
        {
          role: "user",
          content: question.content,
        },
      ],
    },
  });

  yield {
    type: "answer.started",
    answer: { ...answer, party },
  };

  for await (const event of stream) {
    if (event.event === "thread.message.delta") {
      const deltaContent = event.data.delta.content?.[0];

      if (deltaContent?.type !== "text" || !deltaContent.text?.value) {
        throw new Error(
          `Unknown content text type '${deltaContent?.type}' or invalid value`
        );
      }

      yield {
        type: "answer.delta",
        answerId: answer.id,
        delta: deltaContent.text.value,
        annotations: deltaContent.text.annotations,
      };
    }
  }

  const messages = await stream.finalMessages();
  const content = messages[0].content?.[0];

  if (content?.type !== "text" || !content.text?.value) {
    throw new Error(
      `Unknown content text type '${content?.type}' or invalid value`
    );
  }

  const [updatedAnswer] = await db
    .update(answers)
    .set({
      content: content.text.value,
      annotations: content.text.annotations,
      completed: true,
    })
    .where(eq(answers.id, answer.id))
    .returning();

  yield {
    type: "answer.completed",
    answer: {
      ...updatedAnswer,
      party,
    },
  };
}

export async function getPartyBySlug(
  partySlug: string
): Promise<Party & { defaultPartyAssistant: PartyAssistant | null }> {
  const party = await db.query.parties.findFirst({
    where: ({ slug }, { eq }) => eq(slug, partySlug),
    with: {
      defaultPartyAssistant: true,
    },
  });

  if (!party) {
    throw new NotFoundError(`Party not found for slug '${partySlug}'`);
  }

  return party;
}

async function getOrCreatePartyBySlug(partySlug: string) {
  try {
    return await getPartyBySlug(partySlug);
  } catch (err) {
    if (err instanceof NotFoundError) {
      await db.insert(parties).values({
        slug: partySlug,
      });

      return await getPartyBySlug(partySlug);
    }

    throw err;
  }
}

export async function findAllPartiesSlugs(): Promise<string[]> {
  return (
    await db.query.parties.findMany({
      columns: {
        slug: true,
      },
    })
  ).map((party) => party.slug);
}

export async function createDefaultPartyAssistant(
  partySlug: string,
  data: Omit<InferInsertModel<typeof partyAssistants>, "partyId">
): Promise<void> {
  const party = await getOrCreatePartyBySlug(partySlug);

  const [partyAssistant] = await db
    .insert(partyAssistants)
    .values({
      partyId: party.id,
      ...data,
    })
    .returning();

  await db
    .update(parties)
    .set({
      defaultPartyAssistantId: partyAssistant.id,
    })
    .where(eq(parties.id, party.id));
}

export async function upsertPartyBySlug(
  slug: string,
  data: Partial<Pick<Party, "name" | "logoImageUrl" | "url">>
): Promise<void> {
  await db
    .insert(parties)
    .values({
      slug,
      ...data,
    })
    .onConflictDoUpdate({
      target: parties.slug,
      set: data,
    });
}

export async function getQuestionById(
  id: Question["id"]
): Promise<Question & { answers: (Answer & { party: Party })[] }> {
  const [question] = await queryQuestions({
    ids: [id],
  });

  if (!question) {
    throw new NotFoundError(`Question '${id}' not found`);
  }

  return question;
}

export async function getQuestionBySlug(
  slug: Question["slug"]
): Promise<Question & { answers: (Answer & { party: Party })[] }> {
  const [question] = await queryQuestions({
    slugs: [slug],
  });

  if (!question) {
    throw new NotFoundError(`Question with slug '${slug}' not found`);
  }

  return question;
}

type QuestionsQuery = {
  userId?: User["id"] | null;
  ids?: number[];
  slugs?: string[];
  completed?: boolean | null;
};

export async function queryQuestions(
  query: QuestionsQuery
): Promise<(Question & { answers: (Answer & { party: Party })[] })[]> {
  const questions = await db.query.questions.findMany({
    where: (questions, { eq }) => {
      const conditions = [];

      if (query.userId) {
        conditions.push(eq(questions.userId, query.userId));
      }

      if (query.ids) {
        conditions.push(inArray(questions.id, query.ids));
      }

      if (query.slugs) {
        conditions.push(inArray(questions.slug, query.slugs));
      }

      if (typeof query.completed === "boolean") {
        conditions.push(eq(questions.completed, query.completed));
      }

      return and(...conditions);
    },
    with: {
      answers: {
        with: {
          partyAssistant: {
            with: {
              party: true,
            },
          },
        },
      },
    },
  });

  return questions
    .filter((question) => question.answers.length)
    .map((question) => ({
      ...question,
      answers: question.answers.map(({ partyAssistant, ...answer }) => ({
        ...answer,
        party: partyAssistant.party,
      })),
    }));
}
