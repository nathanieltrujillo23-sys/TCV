const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function transactionTotal(t: {
  type: "income" | "expense";
  amount: number;
  accounts?: number;
  purchases?: number;
}): number {
  if (t.type === "income") {
    return t.amount * (t.accounts ?? 1);
  }
  return t.amount * (t.purchases ?? 1);
}
