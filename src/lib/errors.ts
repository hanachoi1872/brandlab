import { GeminiError } from "@/lib/gemini";

export class MissingKeyError extends Error {
  constructor(message = "API 키가 설정되지 않았습니다.") {
    super(message);
    this.name = "MissingKeyError";
  }
}

/** 에러를 사용자에게 보여줄 한국어 메시지로. 서버·브라우저 양쪽에서 쓴다. */
export function toUserMessage(err: unknown): string {
  if (err instanceof MissingKeyError) return err.message;

  if (err instanceof GeminiError) {
    if (err.status === 400 && /API key not valid|API_KEY_INVALID/i.test(err.message)) {
      return "API 키가 올바르지 않습니다. aistudio.google.com/apikey 에서 키를 다시 확인해주세요.";
    }
    if (err.status === 401 || err.status === 403) {
      return "이 API 키로는 요청할 수 없습니다. 키가 맞는지, 해당 모델을 쓸 수 있는지 확인해주세요.";
    }
    if (err.status === 429) {
      return "무료 한도(분당·일일 요청 수)를 넘었습니다. 잠시 뒤에 다시 시도하거나, 설정에서 더 가벼운 모델로 바꿔보세요.";
    }
    if (err.status === 404) {
      return "선택한 모델을 찾을 수 없습니다. 설정에서 모델 목록을 새로 불러와 다른 모델을 골라주세요.";
    }
    if (err.status >= 500) {
      return "Gemini 서버 오류입니다. 잠시 뒤에 다시 시도해주세요.";
    }
    return err.message;
  }

  if (err instanceof Error) {
    if (err.name === "AbortError") return "";
    if (/fetch|network|Failed to fetch/i.test(err.message)) {
      return "Gemini API에 연결하지 못했습니다. 네트워크를 확인해주세요.";
    }
    return err.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}
