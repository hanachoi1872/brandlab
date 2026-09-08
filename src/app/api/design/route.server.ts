import { InputError, buildJob } from "@/lib/engine";
import { checkPassword, runToSSE } from "@/lib/server-run";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!checkPassword(req)) {
    return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  try {
    const body = await req.json();
    return runToSSE(buildJob("design", body));
  } catch (err) {
    const message = err instanceof InputError ? err.message : "잘못된 요청입니다.";
    return Response.json({ error: message }, { status: 400 });
  }
}
