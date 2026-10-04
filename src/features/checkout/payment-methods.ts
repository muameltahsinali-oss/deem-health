/**
 * Payment method registry. Checkout renders whatever is `enabled` here.
 * Adding a method later = add it to the Prisma PaymentMethod enum, add an entry here,
 * and implement its confirmation step — the order pipeline itself does not change.
 */
export type PaymentMethodId = "COD";

export type PaymentMethodDefinition = {
  id: PaymentMethodId;
  label: string;
  description: string;
  enabled: boolean;
  /** Initial payment status recorded on the order */
  initialPaymentStatus: "COD" | "PENDING";
};

export const PAYMENT_METHODS: PaymentMethodDefinition[] = [
  {
    id: "COD",
    label: "الدفع عند الاستلام",
    description: "ادفع نقداً للمندوب عند استلام طلبك.",
    enabled: true,
    initialPaymentStatus: "COD",
  },
];

export const enabledPaymentMethods = () => PAYMENT_METHODS.filter((m) => m.enabled);

export function getPaymentMethod(id: string): PaymentMethodDefinition | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id && m.enabled);
}
