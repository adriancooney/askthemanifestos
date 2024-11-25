import { Questions } from "./questions";
import { queryQuestions } from "@/lib/atm/parties";
import { findSession } from "@/lib/atm/auth";
import { SWRProvider } from "./swr-provider";
import { serializeQuestion } from "@/lib/atm/serialize";

export default async function Page() {
  const session = await findSession();
  const questions = session
    ? (
        await queryQuestions({
          userId: session.user.id,
        })
      ).map(serializeQuestion)
    : null;

  return (
    <SWRProvider
      value={questions ? { fallback: { "/api/questions": questions } } : {}}
    >
      <Questions />
    </SWRProvider>
  );
}
