"use client";

import { nanoid } from "nanoid";
import {
  SerializedCreateQuestionAndAnswerEvent,
  SerializedParty,
  SerializedQuestion,
} from "@/lib/atm/types";
import { Button, Flex, TextField, Box, Text } from "@radix-ui/themes";
import { JSONParser } from "@streamparser/json-whatwg";
import { sortBy } from "lodash";
import { AnnotationDelta } from "openai/resources/beta/threads/messages.mjs";
import { useState } from "react";
import useSWR from "swr";
import { LocalAnswer, LocalQuestion } from "./types";
import { QuestionCard } from "./question-card";

const SAMPLE_QUESTIONS = [
  "Will you support taxing the wealthy?",
  "Will you close corporate tax loopholes?",
  "What's your stance on Climate Change?",
  "Will you reduce fuel prices?",
  "Will you reduce the price of alcohol?",
];

export function Questions() {
  const [questionPlaceholder] = useState<string>(
    SAMPLE_QUESTIONS[Math.round(Math.random() * (SAMPLE_QUESTIONS.length - 1))]
  );
  const [questionInput, setQuestionInput] = useState<string>("");
  const { ask, questions } = useAsk();

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(questionInput);
          setQuestionInput("");
        }}
      >
        <Flex py="2" gap="2" align="center">
          <Box asChild flexGrow="1">
            <TextField.Root
              size="3"
              value={questionInput}
              onChange={(event) => setQuestionInput(event.target.value)}
              onSubmit={() => (questionInput ? ask(questionInput) : undefined)}
              placeholder={questionPlaceholder}
              autoFocus
              suppressHydrationWarning
              style={{
                outline: "2px solid var(--text-field-focus-color)",
                outlineOffset: "-1px",
              }}
            />
          </Box>
          <Button size="3" type="submit">
            Ask
          </Button>
        </Flex>
      </form>

      {questions.length ? (
        <Flex gap="2" direction="column">
          <Text color="gray">Your questions</Text>
          {questions.map((question) => (
            <QuestionCard key={question.slug} question={question} />
          ))}
        </Flex>
      ) : null}
    </>
  );
}

function useQuestions(): {
  isLoading: boolean;
  questions: SerializedQuestion[] | null;
  refresh: () => void;
} {
  const {
    data: questions = null,
    isLoading,
    mutate: refresh,
  } = useSWR("/api/questions", (key) =>
    fetch(key)
      .then((res) => res.json())
      .then(({ questions }) => questions)
  );

  return {
    refresh,
    isLoading,
    questions,
  };
}

function useAsk(): {
  ask: (question: string) => void;
  questions: (SerializedQuestion | LocalQuestion)[];
} {
  const [localQuestions, setLocalQuestions] = useState<LocalQuestion[]>([]);
  const { questions: remoteQuestions, refresh } = useQuestions();

  const mergedQuestions = (remoteQuestions || []).map((remoteQuestion) => {
    const localQuestion = localQuestions.find(
      (localQuestion) => localQuestion.slug === remoteQuestion.slug
    );

    if (localQuestion?.isLoading) {
      return localQuestion;
    } else {
      return remoteQuestion;
    }
  });

  const questions = mergedQuestions.concat(
    localQuestions.filter(
      (localQuestion) =>
        !mergedQuestions.some(
          (mergedQuestion) => mergedQuestion.slug === localQuestion.slug
        )
    )
  );

  const sortedQuestions = sortBy(
    questions,
    (question) => question.createdAt
  ).reverse();

  function updateQuestion(
    slug: string,
    nextQuestion:
      | Partial<LocalQuestion>
      | ((question: LocalQuestion) => LocalQuestion)
  ) {
    setLocalQuestions((questions) =>
      questions.map((question) =>
        question.slug === slug
          ? typeof nextQuestion === "function"
            ? nextQuestion(question)
            : {
                ...question,
                ...nextQuestion,
              }
          : question
      )
    );
  }

  function createAnswer(
    questionSlug: string,
    answerId: number,
    party: SerializedParty,
    index: number
  ) {
    updateQuestion(questionSlug, (question) => ({
      ...question,
      answers: question.answers.concat([
        {
          id: answerId,
          content: "",
          annotations: [],
          createdAt: Date.now(),
          party,
          isLoading: true,
          completed: false,
          index,
        },
      ]),
    }));
  }

  function updateAnswer(
    questionSlug: string,
    answerId: number,
    value: LocalAnswer | ((answer: LocalAnswer) => LocalAnswer)
  ) {
    updateQuestion(questionSlug, (question) => {
      return {
        ...question,
        answers: question.answers.map((answer) =>
          answer.id === answerId
            ? typeof value === "function"
              ? value(answer)
              : value
            : answer
        ),
      };
    });
  }

  function appendAnswer(
    questionSlug: string,
    answerId: number,
    content: string,
    annotations: AnnotationDelta[]
  ) {
    updateAnswer(questionSlug, answerId, (answer) => ({
      ...answer,
      content: answer.content + content,
      annotations: answer.annotations.concat(annotations),
    }));
  }

  return {
    questions: sortedQuestions.slice(0, 5),
    async ask(content) {
      let slug = nanoid();

      setLocalQuestions((questions) =>
        questions.concat({
          slug,
          content,
          answers: [],
          createdAt: Date.now(),
          isLoading: true,
          error: null,
        })
      );

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          body: JSON.stringify({
            question: content,
          }),
        });

        if (!res.ok) {
          throw new Error(`Unable to submit question (${res.status})`);
        }

        if (!res.body) {
          throw new Error(`Server returned invalid response`);
        }

        const jsonParser = new JSONParser({
          emitPartialValues: false,
          emitPartialTokens: false,
          separator: "\n",
          paths: ["$"],
        });

        const reader = res.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(jsonParser)
          .getReader();

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          if (value) {
            const event = value.value as SerializedCreateQuestionAndAnswerEvent;

            switch (event.type) {
              case "question.created": {
                updateQuestion(slug, {
                  slug: event.question.slug,
                  isLoading: true,
                });

                slug = event.question.slug;

                break;
              }

              case "question.completed": {
                updateQuestion(slug, {
                  isLoading: false,
                });

                break;
              }

              case "answer.started": {
                createAnswer(
                  slug,
                  event.answer.id,
                  event.answer.party,
                  event.answer.index
                );

                break;
              }

              case "answer.delta": {
                appendAnswer(
                  slug,
                  event.answerId,
                  event.delta,
                  event.annotations || []
                );

                break;
              }

              case "answer.completed": {
                updateAnswer(slug, event.answer.id, (answer) => ({
                  ...answer,
                  isLoading: false,
                  completed: true,
                }));
              }
            }
          }
        }

        updateQuestion(slug, {
          isLoading: false,
        });

        refresh();
      } catch (err) {
        updateQuestion(slug, {
          error: (err as Error).message,
          isLoading: false,
        });
      }
    },
  };
}
