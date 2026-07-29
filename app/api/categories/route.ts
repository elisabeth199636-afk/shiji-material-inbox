import { createCategory, listCategories } from "../../../db/items";

export const dynamic = "force-dynamic";

const reservedNames = new Set([
  "收件箱",
  "所有素材",
  "我的收藏",
  "最近添加",
]);

export async function GET() {
  try {
    return Response.json({ categories: await listCategories() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (typeof input?.name !== "string") {
      return Response.json({ error: "请输入分类名称" }, { status: 400 });
    }

    const name = input.name.trim().replace(/\s+/g, " ");
    if (!name) {
      return Response.json({ error: "分类名称不能为空" }, { status: 400 });
    }
    if (Array.from(name).length > 12) {
      return Response.json(
        { error: "分类名称请控制在 12 个字以内" },
        { status: 400 },
      );
    }
    if (reservedNames.has(name)) {
      return Response.json(
        { error: "这个名称已被系统入口使用" },
        { status: 400 },
      );
    }

    const result = await createCategory(name);
    if (result.duplicate) {
      return Response.json(
        { error: "这个分类已经存在", category: result.category },
        { status: 409 },
      );
    }
    return Response.json({ category: result.category }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "暂时无法完成操作";
  return Response.json({ error: message }, { status: 500 });
}
