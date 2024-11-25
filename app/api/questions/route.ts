import { findOrCreateAnonymousCookieSession } from "@/lib/atm/auth";
import { queryQuestions } from "@/lib/atm/parties";
import { serializeQuestion } from "@/lib/atm/serialize";

export async function GET() {
  const session = await findOrCreateAnonymousCookieSession();
  const questions = await queryQuestions({
    userId: session.user.id,
  });

  return Response.json({
    questions: questions.map(serializeQuestion),
  });
}
