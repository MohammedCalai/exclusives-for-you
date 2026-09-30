export const colors = { ink: '#171714', paper: '#F7F5EF', white: '#FFFFFF', stone: '#E8E4DA', muted: '#6C6A63', accent: '#B58A42', success: '#2E694A', danger: '#A13E36', black: '#080808' } as const;
export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;
export const typography = { display: { fontSize: 36, lineHeight: 40, fontWeight: '600' as const, letterSpacing: -1.2 }, title: { fontSize: 24, lineHeight: 29, fontWeight: '600' as const, letterSpacing: -0.5 }, heading: { fontSize: 18, lineHeight: 23, fontWeight: '600' as const }, body: { fontSize: 15, lineHeight: 22 }, label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 1.1, textTransform: 'uppercase' as const } };
export const money = (pence: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
