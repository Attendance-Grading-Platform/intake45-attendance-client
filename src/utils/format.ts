export function formatCurrency(
    amount: number,
    currency: string = 'EGP'
): string {
    return new Intl.NumberFormat('en-EG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' ' + currency
}
