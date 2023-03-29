import fetch, {Headers} from "node-fetch"
import dotenv from "dotenv"

dotenv.config();

type CurrencyProps = {
    from: string;
    to: string
    amount: number;
}

type ResponseType = {
  success: boolean;
  query: {
    from: string;
    to: string;
    amount: number;
  };
  info: {
    timestamp: number;
    rate: number;
  };
  date: Date;
  result: number;
};



const myHeaders = new Headers();
myHeaders.append('apikey', process.env.APIKEY || '');

const requestOptions = {
  method: 'GET',
  headers: myHeaders,
};

export const currencyChange = async ({ to, from, amount }: CurrencyProps) => {
  try {
    const response = await fetch(
      `https://api.apilayer.com/fixer/convert?to=${to}&from=${from}&amount=${amount}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => result)
      .catch((error) => console.log('error', error));

    return response as ResponseType;
  } catch (error) {
    console.log(error)
  }
};