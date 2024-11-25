import "@radix-ui/themes/styles.css";
import { Analytics } from "@vercel/analytics/react";
import NextLink from "next/link";
import {
  Container,
  Theme,
  Heading,
  Text,
  Link,
  Flex,
  Box,
} from "@radix-ui/themes";
import { formatQuestionsUrl } from "./urls";
import { Inter } from "next/font/google";
import {
  ExternalLinkIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ask The Manifestos",
  description:
    "Ask a question about the manifesto of each Irish political party participating in the upcoming 2024 election.",
  openGraph: {
    images: "/opengraph-image.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Theme
          style={
            {
              "--default-font-family": "var(--font-inter)",
            } as React.CSSProperties
          }
        >
          <Container p="2">
            <Flex gap="3" direction="column">
              <Flex
                direction="column"
                p="3"
                style={{
                  border: "3px solid var(--gray-6)",
                  borderRadius: "var(--radius-5)",
                }}
                gap="2"
              >
                <Flex gap="2" align="center">
                  <QuestionMarkCircledIcon
                    color="var(--indigo-11)"
                    width="40"
                    height="40"
                  />
                  <Heading size="6">
                    <Link asChild>
                      <NextLink href={formatQuestionsUrl()}>
                        Ask The Manifestos
                      </NextLink>
                    </Link>
                  </Heading>
                </Flex>
                <Text as="p">
                  <Link asChild>
                    <NextLink href={formatQuestionsUrl()}>
                      Ask a question
                    </NextLink>
                  </Link>{" "}
                  of the manifesto for each Irish political party participating
                  in the upcoming{" "}
                  <Link
                    href="https://www.electoralcommission.ie/general-elections/"
                    target="_blank"
                  >
                    2024 General Election{" "}
                    <Box
                      display="inline-block"
                      asChild
                      style={{ verticalAlign: "middle" }}
                    >
                      <ExternalLinkIcon />
                    </Box>
                  </Link>
                  .
                </Text>
              </Flex>
              {children}
              <Text size="2" align="center" as="p" color="gray">
                Created by{" "}
                <Link href="https://x.com/adrian_cooney" target="_blank">
                  @adrian_cooney
                </Link>{" "}
                &bull;{" "}
                <Link
                  href="https://github.com/adriancooney/askthemanifestos"
                  target="_blank"
                >
                  Source code
                </Link>{" "}
                &bull; Not affliated with any political party.
              </Text>
            </Flex>
          </Container>
        </Theme>
        <Analytics />
      </body>
    </html>
  );
}
