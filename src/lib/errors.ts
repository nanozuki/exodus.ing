import { error } from '@sveltejs/kit';

export class AppError implements App.Error {
  private constructor(
    public code: number,
    public key: string,
    public message: string,
    public context?: string,
  ) {}

  static catch(e: unknown): AppError {
    if (e instanceof AppError) {
      return e;
    }
    console.error(e);
    return AppError.InternalServerError();
  }

  throw(): never {
    const { code, key, message, context } = this;
    error(code, { key, message, context });
  }

  is(other: unknown): boolean {
    return other instanceof AppError && this.key === other.key;
  }

  static InvalidInviteCode(context?: string): AppError {
    return new AppError(400, 'INVALID_INVITE_CODE', '邀请码无效', context);
  }

  static InviteCodeMissed(context?: string): AppError {
    return new AppError(400, 'INVITE_CODE_MISSED', '邀请码不能为空', context);
  }

  // for invisible form
  static InvalidFormDataError(context?: string): AppError {
    return new AppError(400, 'INVALID_FORM_DATA_ERROR', '表单数据错误', context);
  }

  static OAuthValidationError(context?: string): AppError {
    return new AppError(400, 'OAUTH_VALIDATION_ERROR', 'OAuth 验证错误', context);
  }

  static InvalidMarkdownError(context?: string): AppError {
    return new AppError(400, 'INVALID_MARKDOWN_ERROR', 'Markdown 格式错误', context);
  }

  static InternalServerError(context?: string): AppError {
    return new AppError(500, 'INTERNAL_SERVER_ERROR', '服务器内部错误', context);
  }

  static Unauthorized(context?: string): AppError {
    return new AppError(401, 'UNAUTHORIZED', '未登录', context);
  }

  static Forbidden(context?: string): AppError {
    return new AppError(403, 'FORBIDDEN', '没有权限', context);
  }

  static ArticleNotFound(context?: string): AppError {
    return new AppError(404, 'ARTICLE_NOT_FOUND', '文章不存在', context);
  }

  static UserNotFound(context?: string): AppError {
    return new AppError(404, 'USER_NOT_FOUND', '用户不存在', context);
  }

  static CommentNotFound(context?: string): AppError {
    return new AppError(404, 'COMMENT_NOT_FOUND', '评论不存在', context);
  }

  static UserDomainNotFound(context?: string): AppError {
    return new AppError(404, 'USER_DOMAIN_NOT_FOUND', '用户域名不存在', context);
  }

  static DatabaseError(context?: string): AppError {
    return new AppError(500, 'DATABASE_ERROR', '数据库错误', context);
  }
}
