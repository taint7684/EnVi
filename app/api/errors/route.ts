import { NextResponse } from "next/server";
import { getErrors, logError, updatePattern } from "@/lib/errors";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status") || undefined;
  const source = searchParams.get("source") || undefined;
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : undefined;
  const pageSize = searchParams.get("pageSize")
    ? Number(searchParams.get("pageSize"))
    : undefined;

  if (!userId) {
    return NextResponse.json({ error: "Thiếu userId" }, { status: 400 });
  }

  try {
    const result = await getErrors({ userId, status, source, page, pageSize });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await logError({
      userId: body.userId,
      source: body.source,
      sourceRef: body.sourceRef,
      type: body.type,
      patternKey: body.patternKey,
      original: body.original,
      correction: body.correction,
      explanationVi: body.explanationVi,
      severity: body.severity,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    await updatePattern({
      userId: body.userId,
      patternKey: body.patternKey,
      status: body.status,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
