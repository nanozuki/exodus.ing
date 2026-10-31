import { expect, expectTypeOf, it, vi } from 'vitest';
import { error, isHttpError } from '@sveltejs/kit';
import { throwError } from './errors';

const cases: { args: Parameters<typeof throwError>; status: number; message: string }[] = [
  { args: ['BAD_REQUEST', '请求不完整'], status: 400, message: '请求不完整' },
  {
    args: ['PARAMETER_INVALID', { username: '用户名已存在', name: '昵称已存在' }],
    status: 400,
    message: '参数错误\n- username: 用户名已存在\n- name: 昵称已存在',
  },
  { args: ['UNAUTHORIZED', { operation: '编辑文章' }], status: 401, message: '未登录，不能编辑文章' },
  { args: ['FORBIDDEN', { operation: '编辑文章' }], status: 403, message: '没有权限，不能编辑文章' },
  { args: ['NOT_FOUND', { resource: '文章' }], status: 404, message: '文章不存在' },
  { args: ['INTERNAL_SERVER_ERROR', '未知内容'], status: 500, message: '服务器内部错误: 未知内容' },
  {
    args: ['DATABASE_ERROR', { operation: 'createUser', cause: 'offline' }],
    status: 500,
    message: 'createUser 失败: offline',
  },
  { args: ['MISSING_CONFIG', { item: 'APP_URL' }], status: 500, message: '缺少配置项: APP_URL' },
  {
    args: ['EXTERNAL_API_ERROR', { operation: 'DNS 查询', message: 'HTTP 状态码：503' }],
    status: 502,
    message: 'DNS 查询 失败: HTTP 状态码：503',
  },
];

it.each(cases)('preserves the status, message and typed details for $args.0', ({ args, status, message }) => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    throwError(...args);
  } catch (caught) {
    expect(isHttpError(caught)).toBe(true);
    if (!isHttpError(caught)) throw caught;

    expect(caught.status).toBe(status);
    expect(caught.body).toEqual({ status, message, detail: { tag: args[0], value: args[1] } });
    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});

it('narrows field error parameters after the official HTTP error check', () => {
  try {
    throwError('PARAMETER_INVALID', { username: '用户名已存在' });
  } catch (caught) {
    if (!isHttpError(caught)) throw caught;
    const detail = caught.body.detail;
    expect(detail?.tag).toBe('PARAMETER_INVALID');
    if (detail?.tag !== 'PARAMETER_INVALID') throw caught;

    expectTypeOf(detail.value).toEqualTypeOf<Record<string, string>>();
    expect(detail.value.username).toBe('用户名已存在');
  }
});

it('allows framework-shaped errors without business details', () => {
  try {
    error(404, 'Not Found');
  } catch (caught) {
    if (!isHttpError(caught)) throw caught;
    expect(caught.body).toEqual({ status: 404, message: 'Not Found' });
  }
});
