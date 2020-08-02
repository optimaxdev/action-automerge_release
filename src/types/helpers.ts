// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TArrayElement<A extends any[]> = A extends (infer El)[] ? El : never
