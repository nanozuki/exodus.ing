export const InvalidInviteCode = (context?: string): App.Error => {
  const error = { key: 'INVALID_INVITE_CODE', message: '邀请码无效', context };
  console.log(error);
  return error;
};

export const InviteCodeMissed = (context?: string): App.Error => {
  const error = { key: 'INVITE_CODE_MISSED', message: '邀请码不能为空', context };
  console.log(error);
  return error;
};

export const OAuthValidationError = (context?: string): App.Error => {
  const error = {
    key: 'OAUTH_VALIDATION_ERROR',
    message: 'OAuth 验证错误',
    context,
  };
  console.log(error);
  return error;
};

export const InternalServerError = (context?: string): App.Error => {
  const error = {
    key: 'INTERNAL_SERVER_ERROR',
    message: '服务器内部错误',
    context,
  };
  console.log(error);
  return error;
};

export const Unauthorized = (context?: string): App.Error => {
  const error = { key: 'UNAUTHORIZED', message: '未登录', context };
  console.log(error);
  return error;
};

export const ArticleNotFound = (context?: string): App.Error => {
  const error = { key: 'ARTICLE_NOT_FOUND', message: '文章不存在', context };
  console.log(error);
  return error;
};

export const UserNotFound = (context?: string): App.Error => {
  const error = { key: 'USER_NOT_FOUND', message: '用户不存在', context };
  console.log(error);
  return error;
};

export const Forbidden = (context?: string): App.Error => {
  const error = { key: 'FORBIDDEN', message: '没有权限', context };
  console.log(error);
  return error;
};

export const UserDomainNotFound = (context?: string): App.Error => {
  const error = { key: 'USER_DOMAIN_NOT_FOUND', message: '用户域名不存在', context };
  console.log(error);
  return error;
};
