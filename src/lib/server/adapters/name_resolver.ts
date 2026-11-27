import { z } from 'zod';
import { throwError } from '#lib/errors.js';

/** Use cases declare `nameResolver: NameResolver` in their `deps`; tests supply fixed records. */
export interface NameResolver {
  /** Returns the raw data of each TXT record of `domain`, or `[]` when it has none; lookup failures throw. */
  resolveTxt(domain: string): Promise<string[]>;
}

const dnsResponseSchema = z.object({
  Status: z.number(),
  Answer: z.array(z.object({ data: z.string() })).optional(),
});

/**
 * Looks up `domain`'s TXT records through Cloudflare DNS-over-HTTPS (`1.1.1.1`) and returns each answer's raw `data`,
 * with Cloudflare's quoting and chunking and no answer-type filtering. A nonexistent domain (DNS status 3) or a
 * response without answers returns `[]`; another nonzero DNS status, an unsuccessful HTTP response, or a JSON body
 * without a numeric `Status` and answers carrying string `data` throws EXTERNAL_API_ERROR. Transport failures and a
 * body that is not JSON propagate.
 */
export async function resolveTxt(domain: string): Promise<string[]> {
  const url = `https://1.1.1.1/dns-query?name=${domain}&type=TXT`;
  const response = await fetch(url, {
    headers: { accept: 'application/dns-json' },
  });
  if (!response.ok) {
    return throwError('EXTERNAL_API_ERROR', { operation: 'DNS 查询', message: `HTTP 状态码：${response.status}` });
  }
  const parsed = dnsResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return throwError('EXTERNAL_API_ERROR', { operation: 'DNS 查询', message: '响应格式错误' });
  }
  const json = parsed.data;
  if (json.Status === 3) return [];
  if (json.Status !== 0) {
    return throwError('EXTERNAL_API_ERROR', { operation: 'DNS 查询', message: `状态码：${json.Status}` });
  }
  return json.Answer?.map((record) => record.data) ?? [];
}

/** The production implementation, backed by `resolveTxt`; request entry points supply it as `deps.nameResolver`. */
export const nameResolver: NameResolver = { resolveTxt };
