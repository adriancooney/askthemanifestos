import { QuestionCard } from "@/app/question-card";
import { getQuestionBySlug } from "@/lib/atm/parties";
import { serializeQuestion } from "@/lib/atm/serialize";
import { z } from "zod";

const PageParams = z.object({
  questionSlug: z.string(),
});

export default async function Page({
  params,
}: {
  params: Record<string, string>;
}) {
  const { questionSlug } = PageParams.parse(await params);

  const question = serializeQuestion(await getQuestionBySlug(questionSlug));

  return <QuestionCard question={question} />;
}
