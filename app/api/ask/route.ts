import { z } from "zod";
import { NextRequest } from "next/server";
import {
  createAndAnswerQuestionForPartiesIterator,
  findAllPartiesSlugs,
} from "@/lib/atm/parties";
import { serializeCreateQuestionAndAnswerEvent } from "@/lib/atm/serialize";
import { findOrCreateAnonymousCookieSession } from "@/lib/atm/auth";
import { shuffle } from "lodash";

export const maxDuration = 60;

const AskRequestBody = z.object({
  question: z.string(),
});

export async function POST(request: NextRequest): Promise<Response> {
  const { question } = AskRequestBody.parse(await request.json());
  const session = await findOrCreateAnonymousCookieSession();
  const eventStream = await createAndAnswerQuestionForPartiesIterator(
    session.user.id,
    question,
    shuffle(await findAllPartiesSlugs())
  );

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder();

          for await (const event of eventStream) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify(serializeCreateQuestionAndAnswerEvent(event)) +
                  "\n"
              )
            );
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    }),
    {
      headers: {
        Connection: "keep-alive",
        "Content-Encoding": "none",
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "text/event-stream; charset=utf-8",
      },
    }
  );
}
