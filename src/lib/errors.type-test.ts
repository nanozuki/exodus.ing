import { throwError, type ErrorDetail, type ErrorTag } from './errors';

// Checked by pnpm check; invalid calls must remain compile-time errors.
function checkErrorTypes(tag: ErrorTag, detail: ErrorDetail, frameworkError: App.Error) {
  if (detail.tag === 'NOT_FOUND') {
    const resource: string = detail.value.resource;
    void resource;
    // @ts-expect-error NOT_FOUND has no operation parameter.
    void detail.value.operation;
  }

  const optionalDetail: ErrorDetail | undefined = frameworkError.detail;
  void optionalDetail;

  // @ts-expect-error NOT_FOUND requires a resource object.
  throwError('NOT_FOUND', '文章');
  // @ts-expect-error A union tag cannot be paired with an uncorrelated value.
  throwError(tag, '文章');
  // @ts-expect-error A known tag cannot be paired with another tag's value.
  const mismatch: ErrorDetail = { tag: 'NOT_FOUND', value: '文章' };
  void mismatch;
}

void checkErrorTypes;
