import { error } from '@sveltejs/kit';

/**
 * Maps each business error tag to its parameters. `throwError` raises each tag with this HTTP status:
 *
 * | Tag                     | Status |
 * | ----------------------- | ------ |
 * | `BAD_REQUEST`           | 400    |
 * | `PARAMETER_INVALID`     | 400    |
 * | `UNAUTHORIZED`          | 401    |
 * | `FORBIDDEN`             | 403    |
 * | `NOT_FOUND`             | 404    |
 * | `INTERNAL_SERVER_ERROR` | 500    |
 * | `DATABASE_ERROR`        | 500    |
 * | `MISSING_CONFIG`        | 500    |
 * | `EXTERNAL_API_ERROR`    | 502    |
 *
 * `PARAMETER_INVALID` maps field names to their messages.
 */
export type ErrorValue = {
  BAD_REQUEST: string;
  PARAMETER_INVALID: Record<string, string>;
  FORBIDDEN: { operation: string };
  UNAUTHORIZED: { operation: string };
  NOT_FOUND: { resource: string };
  INTERNAL_SERVER_ERROR: string;
  DATABASE_ERROR: { operation: string; cause: string };
  MISSING_CONFIG: { item: string };
  EXTERNAL_API_ERROR: { operation: string; message: string };
};

export type ErrorTag = keyof ErrorValue;

/** The Chinese UI title of each error tag. */
export const errorTagTitle: { [Tag in ErrorTag]: string } = {
  BAD_REQUEST: '请求错误',
  PARAMETER_INVALID: '参数错误',
  UNAUTHORIZED: '未登录',
  FORBIDDEN: '没有权限',
  NOT_FOUND: '未找到',
  INTERNAL_SERVER_ERROR: '服务器内部错误',
  MISSING_CONFIG: '缺少配置项',
  DATABASE_ERROR: '数据库错误',
  EXTERNAL_API_ERROR: '外部API错误',
};

/** Pairs each error tag with its own parameters: checking `tag` narrows `value`; mismatched pairs do not type-check. */
export type ErrorDetail = {
  [Tag in ErrorTag]: {
    tag: Tag;
    value: ErrorValue[Tag];
  };
}[ErrorTag];

type ErrorArgs = {
  [Tag in ErrorTag]: [tag: Tag, value: ErrorValue[Tag]];
}[ErrorTag];

/**
 * Interrupts request handling with a business error: throws SvelteKit's `error(status, message, { detail })` with the
 * tag's status from `ErrorValue`, a tag-specific Chinese message, and `detail` holding `{ tag, value }`. Recognize it
 * with Kit's `isHttpError`; the HTTP status is the error's `status`, with no separate `code` property.
 */
export function throwError(...[tag, value]: ErrorArgs): never {
  // Switching on the tuple discriminant narrows value without type assertions.
  switch (tag) {
    case 'BAD_REQUEST':
      return error(400, value, { detail: { tag, value } });
    case 'PARAMETER_INVALID': {
      const messages = ['参数错误'];
      for (const [key, message] of Object.entries(value)) {
        messages.push(`- ${key}: ${message}`);
      }
      return error(400, messages.join('\n'), { detail: { tag, value } });
    }
    case 'UNAUTHORIZED':
      return error(401, `未登录，不能${value.operation}`, { detail: { tag, value } });
    case 'FORBIDDEN':
      return error(403, `没有权限，不能${value.operation}`, { detail: { tag, value } });
    case 'NOT_FOUND':
      return error(404, `${value.resource}不存在`, { detail: { tag, value } });
    case 'INTERNAL_SERVER_ERROR':
      return error(500, `服务器内部错误: ${value}`, { detail: { tag, value } });
    case 'DATABASE_ERROR':
      return error(500, `${value.operation} 失败: ${value.cause}`, { detail: { tag, value } });
    case 'MISSING_CONFIG':
      return error(500, `缺少配置项: ${value.item}`, { detail: { tag, value } });
    case 'EXTERNAL_API_ERROR':
      return error(502, `${value.operation} 失败: ${value.message}`, { detail: { tag, value } });
    default:
      throw new Error(`Unknown error tag: ${tag satisfies never}`);
  }
}
