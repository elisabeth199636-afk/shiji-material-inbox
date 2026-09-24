import { refreshItemPreview } from "../../../../db/items";
import { getApiUser, unauthorizedJson } from "../../api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) return unauthorizedJson();
    const input = await request.json();
    if (!input?.id || typeof input.id !== "string") {
      return Response.json({ error: "缺少素材 ID" }, { status: 400 });
    }

    const item = await refreshItemPreview(user.id, input.id);
    if (!item) {
      return Response.json({ error: "没有找到这条素材" }, { status: 404 });
    }
    return Response.json({ item, found: Boolean(item.thumbnail) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "暂时无法读取链接预览";
    return Response.json({ error: message }, { status: 500 });
  }
}
