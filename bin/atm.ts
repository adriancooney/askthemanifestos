import { getOpenAI } from "@/lib/openai";
import {
  MANIFESTO_DIR,
  createDefaultPartyAssistant,
  upsertPartyBySlug,
} from "@/lib/atm/parties";
import { map } from "bluebird";
import { program } from "commander";
import { createReadStream } from "fs";
import { writeFile, readFile } from "fs/promises";
import { startCase } from "lodash";
import { FilePurpose } from "openai/resources/files.mjs";
import { basename, resolve } from "node:path";
import { z } from "zod";
import { put } from "@vercel/blob";
import { fs } from "zx";

const PartiesData = z.object({
  parties: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      url: z.string(),
      manifestoUrl: z.string(),
    })
  ),
});

program.command("build-parties").action(async () => {
  const partiesData = PartiesData.parse(
    JSON.parse(
      await readFile(resolve(__dirname, "../data/parties.json"), "utf-8")
    )
  );

  const manifestoAssistants = await map(
    partiesData.parties.map((party) => party.slug),
    async (partySlug) => {
      const partyData = partiesData.parties.find(
        (party) => party.slug === partySlug
      );

      if (!partyData) {
        throw new Error(`Party data for '${partySlug}' not found`);
      }

      const logoPath = resolve(
        __dirname,
        `../data/party-logos/${partySlug}.png`
      );
      await fs.ensureFile(logoPath);

      const { url: logoImageUrl } = await put(
        `/parties/logos/${basename(logoPath)}`,
        createReadStream(logoPath),
        {
          access: "public",
        }
      );

      await upsertPartyBySlug(partyData.slug, {
        ...partyData,
        logoImageUrl,
      });

      const { id: manifestoFileId } = await uploadFileToOpenAi(
        resolve(MANIFESTO_DIR, `${partySlug}.pdf`),
        "assistants"
      );

      const assistant = await getOpenAI().beta.assistants.create({
        name: `${startCase(partySlug)} Manifesto Guru`,
        model: "gpt-4o-mini",
        instructions: `You are a chat bot for irish political party, ${startCase(
          partySlug
        )} political manifestos. Users ask you questions about the political parties' manifesto and you answer them. You can assume any question asked is about the manifesto. Be informative but concise. Do not ask the user to ask more questions.`,
        metadata: {
          party: partySlug,
        },
        tools: [
          {
            type: "file_search",
          },
        ],
        tool_resources: {
          file_search: {
            vector_stores: [
              {
                file_ids: [manifestoFileId],
              },
            ],
          },
        },
      });

      console.log(`Assistant ${partySlug} created`, assistant.id);

      await writeFile(
        resolve(MANIFESTO_DIR, `${partySlug}-manifesto-assistant.json`),
        JSON.stringify(assistant, null, 2),
        "utf-8"
      );

      await createDefaultPartyAssistant(partySlug, {
        openAiAssistantId: assistant.id,
      });
    },
    {
      concurrency: 3,
    }
  );

  await writeFile(
    resolve(MANIFESTO_DIR, "manifesto-assistants.json"),
    JSON.stringify(manifestoAssistants, null, 2)
  );
});

async function uploadFileToOpenAi(
  path: string,
  purpose: FilePurpose
): Promise<{ id: string }> {
  const metadataFilepath = `${path}.openai.json`;
  const uploadedFile = await readFile(metadataFilepath, "utf-8")
    .then(JSON.parse)
    .catch(() => null);

  if (uploadedFile) {
    return uploadedFile as { id: string };
  }

  const file = await getOpenAI().files.create({
    file: createReadStream(path),
    purpose: purpose,
  });

  await writeFile(metadataFilepath, JSON.stringify(file, null, 2));

  return file;
}

program.parseAsync(process.argv);
