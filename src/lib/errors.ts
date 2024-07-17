export const InvalidInviteCode = (context?: string): App.Error => ({
	key: 'INVALID_INVITE_CODE',
	message: '邀请码无效',
	context,
});

export const InviteCodeMissed = (context?: string): App.Error => ({
	key: 'INVITE_CODE_MISSED',
	message: '邀请码不能为空',
	context,
});

export const OAuthValidationError = (context?: string): App.Error => ({
	key: 'OAUTH_VALIDATION_ERROR',
	message: 'OAuth 验证错误',
	context,
});

export const InternalServerError = (context?: string): App.Error => ({
	key: 'INTERNAL_SERVER_ERROR',
	message: '服务器内部错误',
	context,
});
