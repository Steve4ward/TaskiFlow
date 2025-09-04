export type AclSets = {
  visible: Set<string>;
  editable: Set<string>;
  required: Set<string>;
};

type Role = "manager" | "admin" | "viewer";
type StageKey = "DRAFT" | "REVIEW" | "APPROVAL" | string;

type Rule = Partial<Pick<AclSets, "visible" | "editable" | "required">>;

// make roles optional
type StageRules = Partial<Record<Role, Rule>>;

// only some stages defined → make the record partial too
const S: Partial<Record<StageKey, StageRules>> = {
  REVIEW: {
    manager: {
      visible: new Set(["id", "status", "title", "dueAt"]),
      editable: new Set(["status"]),
      required: new Set([]),
    },
  },
  APPROVAL: {
    manager: {
      visible: new Set(["id", "status", "decision", "dueAt"]),
      editable: new Set(["decision"]),
      required: new Set(["decision"]),
    },
  },
} as const;

const EMPTY: AclSets = { visible: new Set(), editable: new Set(), required: new Set() };

export function computeAcl(
  input: { stageKey: StageKey; role: Role },
  overrides?: Rule
): AclSets {
  const base = S[input.stageKey]?.[input.role] ?? {};
  return {
    visible: new Set(overrides?.visible ?? base.visible ?? EMPTY.visible),
    editable: new Set(overrides?.editable ?? base.editable ?? EMPTY.editable),
    required: new Set(overrides?.required ?? base.required ?? EMPTY.required),
  };
}
