import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
} from "../../../db/items";
import { extractHttpUrl } from "../../../lib/link-input";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ items: await listItems() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (!input?.url || typeof input.url !== "string") {
      return Response.json({ error: "请粘贴需要保存的链接" }, { status: 400 });
    }
    const extractedUrl = extractHttpUrl(input.url);
    if (!extractedUrl) {
      return Response.json(
        { error: "分享内容中没有识别到 http 或 https 链接" },
        { status: 400 },
      );
    }
    const result = await createItem({ ...input, url: extractedUrl });
    return Response.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...patch } = await request.json();
    if (!id || typeof id !== "string") {
      return Response.json({ error: "缺少素材 ID" }, { status: 400 });
    }
    const item = await updateItem(id, patch);
    if (!item) {
      return Response.json({ error: "没有找到这条素材" }, { status: 404 });
    }
    return Response.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return Response.json({ error: "缺少素材 ID" }, { status: 400 });
    }
    const deleted = await deleteItem(id);
    return Response.json({ deleted });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "暂时无法完成操作";
  return Response.json({ error: message }, { status: 500 });
}
