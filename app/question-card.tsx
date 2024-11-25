"use client";

import { SerializedQuestion } from "@/lib/atm/types";
import { LocalQuestion } from "./types";
import {
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  Link,
  IconButton,
  Callout,
} from "@radix-ui/themes";
import { formatDistanceToNow } from "date-fns";
import { AnswerCard } from "./answer-card";
import { formatQuestionUrl } from "./urls";
import NextLink from "next/link";
import { WebShare } from "./share";
import { useState } from "react";
import {
  CaretDownIcon,
  CaretRightIcon,
  CrossCircledIcon,
  Share2Icon,
} from "@radix-ui/react-icons";

export function QuestionCard({
  question,
}: {
  question: SerializedQuestion | LocalQuestion;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex justify="between">
          <Flex align="center" gap="2">
            <IconButton
              variant="soft"
              onClick={() => setIsExpanded((expanded) => !expanded)}
              color={"error" in question && question.error ? "red" : undefined}
            >
              {isExpanded ? (
                <CaretDownIcon width={20} height={20} />
              ) : (
                <CaretRightIcon width={20} height={20} />
              )}
            </IconButton>
            <Text size="2" color="gray">
              Question{" "}
              <Link asChild>
                <NextLink href={formatQuestionUrl(question.slug)}>
                  asked <TimeAgo timestamp={question.createdAt} />
                </NextLink>
              </Link>
            </Text>
          </Flex>
          <WebShare
            data={{
              url: formatQuestionUrl(question.slug),
              title: `AskTheManifestos.ie - ${question.content}`,
            }}
          >
            <Button
              loading={"isLoading" in question ? question.isLoading : undefined}
            >
              <Share2Icon /> Share
            </Button>
          </WebShare>
        </Flex>
        <Heading>{question.content}</Heading>

        {isExpanded && "error" in question && question.error ? (
          <Callout.Root color="red">
            <Callout.Icon>
              <CrossCircledIcon />
            </Callout.Icon>
            <Callout.Text>{question.error}</Callout.Text>
          </Callout.Root>
        ) : null}

        {isExpanded && question.answers?.length ? (
          <>
            <Grid columns={{ md: "2", initial: "1" }} gap="3">
              {question.answers
                .slice()
                .sort((a, b) => a.index - b.index)
                .map((answer) => (
                  <AnswerCard key={answer.id} answer={answer} />
                ))}
            </Grid>

            <Text as="p" size="1" color="gray" align="center">
              Parties are listed in random order
            </Text>
          </>
        ) : null}
      </Flex>
    </Card>
  );
}

function TimeAgo({ timestamp }: { timestamp: number }) {
  return (
    <span suppressHydrationWarning>
      {formatDistanceToNow(timestamp, { addSuffix: true })}
    </span>
  );
}
