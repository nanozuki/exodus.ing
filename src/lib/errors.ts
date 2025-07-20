import { error, type HttpError } from '@sveltejs/kit';

export type ErrorValue = {
  BAD_REQUEST: string;
  PARAMETER_INVALID: Record<string, string>;
  FORBIDDEN: { operation: string };
  UNAUTHORIZED: { operation: string };
  NOT_FOUND: { resource: string };
  INTERNAL_SERVER_ERROR: Error | string;
  DATABASE_ERROR: { operation: string; cause: Error };
  MISSING_CONFIG: { item: string };
  EXTERNAL_API_ERROR: { operation: string; message: string };
};

export type ErrorTag = keyof ErrorValue;

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

type ErrorTagConfig<Tag extends ErrorTag> = {
  code: number;
  messageBuilder: (value: ErrorValue[Tag]) => string;
};

const errorTagConfigs: { [Tag in ErrorTag]: ErrorTagConfig<Tag> } = {
  BAD_REQUEST: {
    code: 400,
    messageBuilder: (value) => value,
  },
  PARAMETER_INVALID: {
    code: 400,
    messageBuilder: (value) => {
      const messages = ['参数错误'];
      for (const [key, message] of Object.entries(value)) {
        messages.push(`- ${key}: ${message}`);
      }
      return messages.join('\n');
    },
  },
  UNAUTHORIZED: {
    code: 401,
    messageBuilder: (value) => `未登录，不能${value.operation}`,
  },
  FORBIDDEN: {
    code: 403,
    messageBuilder: (value) => `没有权限，不能${value.operation}`,
  },
  NOT_FOUND: {
    code: 404,
    messageBuilder: (value) => `${value.resource}不存在`,
  },
  INTERNAL_SERVER_ERROR: {
    code: 500,
    messageBuilder: (value) => {
      if (typeof value === 'string') {
        return `服务器内部错误: ${value}`;
      }
      return `服务器内部错误: ${value.message}`;
    },
  },
  DATABASE_ERROR: {
    code: 500,
    messageBuilder: (value) => `${value.operation} 失败: ${value.cause.message}`,
  },
  MISSING_CONFIG: {
    code: 500,
    messageBuilder: (value) => `缺少配置项: ${value.item}`,
  },
  EXTERNAL_API_ERROR: {
    code: 502,
    messageBuilder: (value) => `${value.operation} 失败: ${value.message}`,
  },
};

export interface AppError<Tag extends keyof ErrorValue> {
  tag: Tag;
  value: ErrorValue[Tag];
  code: number;
  message: string;
}

export function createError<Tag extends ErrorTag>(tag: Tag, value: ErrorValue[Tag]): AppError<Tag> {
  const { code, messageBuilder } = errorTagConfigs[tag];
  const message = messageBuilder(value);
  return {
    tag,
    value,
    code,
    message,
  };
}

export function throwAppError<Tag extends ErrorTag>(appError: AppError<Tag>): never {
  error(appError.code, appError);
}

export function throwError<Tag extends ErrorTag>(tag: Tag, value: ErrorValue[Tag]): never {
  const appError = createError(tag, value);
  throwAppError(appError);
}

export function isHttpError(e: unknown): e is HttpError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    typeof e.status === 'number' &&
    'body' in e &&
    typeof e.body === 'object' &&
    e.body !== null
  );
}

export function catchError(e: unknown): AppError<ErrorTag> {
  if (isHttpError(e)) {
    return e.body;
  }
  if (e instanceof Error) {
    console.error('Unknown error caught', e);
    return createError('INTERNAL_SERVER_ERROR', e);
  }
  console.log('Unknown thing caught:', e);
  throw e; // Re-throw unknown non-error, maybe useful for other lib or framework
}
