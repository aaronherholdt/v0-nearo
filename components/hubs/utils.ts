import type { PublicHub } from "@/lib/hubs"

type PriceLikeHub = Pick<PublicHub, "price_from_cents" | "currency">

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "Fr",
  INR: "₹",
  KRW: "₩",
  BRL: "R$",
  MXN: "Mex$",
  ZAR: "R",
  NZD: "NZ$",
  SGD: "S$",
  HKD: "HK$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  THB: "฿",
  TRY: "₺",
  RUB: "₽",
}

export function formatHubPrice(hub: PriceLikeHub | null | undefined): string | null {
  if (!hub || hub.price_from_cents == null) {
    return null
  }

  const base = (hub.price_from_cents / 100).toFixed(0)
  const currency = hub.currency?.trim().toUpperCase() ?? ""
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  const label = symbol ? `From ${symbol}${base}` : `From ${base}`

  return label.length > 0 ? label : null
}
