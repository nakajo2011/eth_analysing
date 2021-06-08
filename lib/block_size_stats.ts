import axios, {AxiosInstance, AxiosResponse} from 'axios'

interface Stats {
  blockNumber: String,
  chainTimeStamp: String,
  chainSize: String,
  clientType: String,
  syncMode: String
}

// etherscan api key
const api_key: String = "EQJCFS1H5EXZVHA8Z1N9MYSXEE7CCFR7W2";
const startDate = "2020-07-01";

const client: AxiosInstance = axios.create({
  baseURL: "https://api.etherscan.io/",
});

// https://api.etherscan.io/api?module=stats&action=chainsize&startdate=2019-02-01&enddate=2019-02-28&clienttype=geth&syncmode=default&sort=asc&apikey=YourApiKeyToken
async function getBlockSizeStats(start:String, end:String): Promise<Stats[]> {
  let response: AxiosResponse = await client.get("/api", {
    params: {
      apikey: api_key,
      module: "stats",
      action: "chainsize",
      startdate: start,
      enddate: end,
      clienttype: "geth",
      syncmode: "default",
      sort: "asc"
    }
  });

  return response.data.result;
}

// https://api.etherscan.io/api?module=stats&action=dailyavgblocksize&startdate=2019-02-01&enddate=2019-02-28&sort=asc&apikey=YourApiKeyToken
async function getBlockAvalageSize(start:String, end:String): Promise<Stats[]> {
  let response: AxiosResponse = await client.get("/api", {
    params: {
      apikey: api_key,
      module: "stats",
      action: "dailyavgblocksize",
      startdate: start,
      enddate: end,
      clienttype: "geth",
      syncmode: "default",
      sort: "asc"
    }
  });

  return response.data.result;
}
async function toCSV(resultJson: Stats[]) {
  return resultJson.map((stats) => {
    return "" + stats.chainTimeStamp + "," + stats.blockNumber + "," + stats.chainSize
  })
}

async function main(): Promise<void> {
  const resultJson = await getBlockSizeStats("2021-04-01", "2021-04-30")
  // const resultAvalaigeSize = getBlockAvalageSize("2021-04-01", "2021-04-30")
  // console.log(JSON.stringify(resultAvalaigeSize, null, "  "))
  const csv = await toCSV(resultJson);
  console.log("date,blockNumber,chainSize")
  csv.forEach((c) => console.log(c));
}

main().then();
