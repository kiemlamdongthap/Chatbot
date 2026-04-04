export function mapIntentToSection(intent) {
  const map = {
    ASK_OVERVIEW: "overview",
    ASK_STEPS: "steps",
    ASK_DOCUMENTS: "documents",
    ASK_FORM: "forms",
    ASK_TIME: "processingTime",
    ASK_FEE: "fee",
    ASK_AUTHORITY: "whereToSubmit",
    ASK_RESULT: "result"
  };

  return map[intent] || null;
}
