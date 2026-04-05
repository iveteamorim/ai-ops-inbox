export type DecisionStatus = "new" | "active" | "won" | "lost" | "no_response";

export type DecisionType = "new" | "recover" | "active" | "complex" | "won" | "lost";

export function getDecisionType(conversation: { status: DecisionStatus; isComplex: boolean }): DecisionType {
  if (conversation.status === "won") return "won";
  if (conversation.status === "lost") return "lost";
  if (conversation.isComplex) return "complex";
  if (conversation.status === "new") return "new";
  if (conversation.status === "no_response") return "recover";
  return "active";
}
