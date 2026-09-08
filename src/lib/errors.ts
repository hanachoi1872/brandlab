import Anthropic from "@anthropic-ai/sdk";

export class MissingKeyError extends Error {
  constructor(message = "API 키가 설정되지 않았습니다.") {
    super(message);
    this.name = "MissingKeyError";
  }
}

/** SDK 에러를 사용자에게 보여줄 한국어 메시지로. 서버·브라우저 양쪽에서 쓴다. */
export function toUserMessage(err: unknown): string {
  if (err instanceof MissingKeyError) return err.message;
  if (err instanceof Anthropic.AuthenticationError) {
    return "API 키가 올바르지 않습니다. console.anthropic.com에서 키를 다시 확인해주세요.";
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return "이 API 키로는 Claude Opus 5를 쓸 수 없습니다. 결제 수단이 등록돼 있는지 확인해주세요.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "요청이 몰렸습니다. 1~2분 뒤에 다시 시도해주세요.";
  }
  if (err instanceof Anthropic.BadRequestError) {
    return "요청이 거부되었습니다: " + err.message;
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "Anthropic API에 연결하지 못했습니다. 네트워크를 확인해주세요.";
  }
  if (err instanceof Anthropic.APIError) {
    return "API 오류 (" + err.status + "): " + err.message;
  }
  if (err instanceof Error) return err.message;
  return "알 수 없는 오류가 발생했습니다.";
}
