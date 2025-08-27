export type NonEmptyArray<T> = [T, ...T[]];
export type ValueOf<T> = T[keyof T];