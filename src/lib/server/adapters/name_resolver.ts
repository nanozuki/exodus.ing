import { throwError } from '#lib/errors.js';

interface Response {
  Status: number;
  Question: { name: string; type: number }[];
  Answer?: { name: string; type: number; TTL: number; data: string }[];
}

/**
 * Looks up `domain`'s TXT records through Cloudflare DNS-over-HTTPS (`1.1.1.1`) and returns each answer's raw `data`,
 * with Cloudflare's quoting and chunking and no answer-type filtering. A nonexistent domain (DNS status 3) or a
 * response without answers returns `[]`; another nonzero DNS status or an unsuccessful HTTP response throws
 * EXTERNAL_API_ERROR. Transport and JSON failures propagate.
 */
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
