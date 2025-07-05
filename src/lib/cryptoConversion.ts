import axios from "axios"

export interface BinanceResult {
  symbol: string
  price: string
}

export interface ConversionResult {
  amount: number
  ticker: string
  price: string
}

export async function cryptoConversion(amount: number, ticker: string): Promise<ConversionResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await axios<BinanceResult[]>({
        method: "GET",
        maxBodyLength: Infinity,
        url: "https://www.binance.com/api/v3/ticker/price"
      })

      const { status, data } = result

      if (status === 200) {
        const getCoin = data.filter((d) => d.symbol === `${ticker.toUpperCase()}USDT`)
        if (getCoin.length < 1) {
          return reject("Can not find coin / token")
        }

        const price = +getCoin[0].price
        const total = amount * price
        const formattedPrice = total.toLocaleString("en-US", { style: "currency", currency: "USD" })
        const formattedResult: ConversionResult = { amount, ticker, price: formattedPrice }
        return resolve(formattedResult)
      } else {
        console.error(`Error with status code: ${status}`)
        return reject("Internal Error")
      }
    } catch (e) {
      const error = e as Error
      console.error(error)
    }
  })
}
