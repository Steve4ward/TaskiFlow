export type ConditionOp = "==" | "!=" | ">" | ">=" | "<" | "<=";
export type ShowIf = { field: string; op: ConditionOp; value: unknown };

export type FieldType = "text" | "number" | "select" | "textarea" | "date" | "checkbox";

export type Field = {
  key: string;
  label?: string;
  type?: FieldType;
  required?: boolean;
  options?: unknown[];
  visibleForRoles?: ("REQUESTOR" | "MANAGER" | "ADMIN")[];
  editableForRoles?: ("REQUESTOR" | "MANAGER" | "ADMIN")[];
  showIf?: ShowIf[];
};

export type TemplateSchema = { fields?: Field[] };