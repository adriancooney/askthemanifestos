export function formatUrl(path = ""): string {
  return path;
}

export function formatQuestionsUrl(path = ""): string {
  return formatUrl(`/${path}`);
}

export function formatQuestionUrl(questionSlug: string, path = ""): string {
  return formatQuestionsUrl(`questions/${questionSlug}${path}`);
}
