// getTxtRecords by cloudflare DoH Dns API, like these curl command:
// curl --http2 --header "accept: application/dns-json" "https://1.1.1.1/dns-query?name=<domain>&type=TXT"
// the response is a json object, like this:
// {
// 	"Status":0, "TC":false,	"RD":true,
// 	"RA":true, "AD":false, "CD":false,
// 	"Question":[{
// 		"name":"crows.moe",
// 		"type":16
// 	}],
// 	"Answer":[{
// 		"name":"crows.moe",
// 		"type":16,
// 		"TTL":300,
// 		"data":"\"google-site-verification=<STRING>\""
// 	}]
// }
export async function getTxtRecords(domain: string): Promise<string[]> {
  const url = `https://1.1.1.1/dns-query?name=${domain}&type=TXT`;
  const response = await fetch(url, {
    headers: { accept: 'application/dns-json' },
  });
  const json = (await response.json()) as DnsJsonResponse;
  if (json.Status !== 0) {
    throw new Error(`Dns query failed: ${json.Status}`);
  }
  return json.Answer.map((record) => record.data);
}

interface DnsJsonResponse {
  Status: number;
  Question: { name: string; type: number }[];
  Answer: { name: string; type: number; TTL: number; data: string }[];
}
