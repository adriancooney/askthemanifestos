import { nanoid } from "nanoid";
import { map } from "bluebird";
import { db } from "..";
import { questions } from "../schema";
import { eq } from "drizzle-orm";

async function main() {
  map(
    await db.query.questions.findMany(),
    async (question) => {
      await db
        .update(questions)
        .set({
          slug: nanoid(),
        })
        .where(eq(questions.id, question.id));
    },
    { concurrency: 5 }
  );
}

main();
