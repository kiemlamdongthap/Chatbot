export function buildReply(text, choices = []) {
  return {
    reply: text,
    choices
  };
}
