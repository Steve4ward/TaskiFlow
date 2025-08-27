type Brand<B extends string> = string & { readonly __brand: B };
export type OrgID = Brand<"OrgID">;
export type UserID = Brand<"UserID">;
export type RequestID = Brand<"RequestID">;