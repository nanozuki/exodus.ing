import { throwError } from '$lib/errors';

interface Response {
  Status: number;
  Question: { name: string; type: number }[];
  Answer?: { name: string; type: number; TTL: number; data: string }[];
}

// Nonexistent domains return no records; DNS service and transport failures propagate.
// TXT answers retain Cloudflare’s raw quoting and chunking; callers receive no normalization.
export async function resolveTxt(domain: string): Promise<string[]> {
  const url = `https://1.1.1.1/dns-query?name=${domain}&type=TXT`;
  const response = await fetch(url, {
    headers: { accept: 'application/dns-json' },
  });
  if (!response.ok) {
    return throwError('EXTERNAL_API_ERROR', { operation: 'DNS 查询', message: `HTTP 状态码：${response.status}` });
  }
  const json = (await response.json()) as Response;
  if (json.Status === 3) return [];
  if (json.Status !== 0) {
    return throwError('EXTERNAL_API_ERROR', { operation: 'DNS 查询', message: `状态码：${json.Status}` });
  }
  return json.Answer?.map((record) => record.data) ?? [];
}
