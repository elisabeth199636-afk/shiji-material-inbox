import {
  categoryPalette,
  createCategory,
  listCategories,
  renameCategory,
} from "../../../db/items";

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
    const validation = validateCategoryName(input?.name);
    if ("response" in validation) return validation.response;

    const result = await createCategory(validation.name);
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

export async function PATCH(request: Request) {
  try {
    const input = await request.json();
    if (typeof input?.name !== "string" || !input.name.trim()) {
      return Response.json({ error: "找不到要修改的分类" }, { status: 400 });
    }

    const currentName = input.name.trim().replace(/\s+/g, " ");
    const validation = validateCategoryName(input?.newName);
    if ("response" in validation) return validation.response;
    if (
      typeof input?.color !== "string" ||
      !categoryPalette.includes(
        input.color as (typeof categoryPalette)[number],
      )
    ) {
      return Response.json({ error: "请选择有效的分类颜色" }, { status: 400 });
    }

    const result = await renameCategory(
      currentName,
      validation.name,
      input.color as (typeof categoryPalette)[number],
    );
    if (!result.category) {
      return Response.json({ error: "这个分类不存在" }, { status: 404 });
    }
    if (result.duplicate) {
      return Response.json(
        { error: "这个分类已经存在", category: result.category },
        { status: 409 },
      );
    }

    return Response.json({
      category: result.category,
      previousName: currentName,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function validateCategoryName(
  value: unknown,
): { name: string } | { response: Response } {
  if (typeof value !== "string") {
    return {
      response: Response.json({ error: "请输入分类名称" }, { status: 400 }),
    };
  }

  const name = value.trim().replace(/\s+/g, " ");
  if (!name) {
    return {
      response: Response.json(
        { error: "分类名称不能为空" },
        { status: 400 },
      ),
    };
  }
  if (Array.from(name).length > 12) {
    return {
      response: Response.json(
        { error: "分类名称请控制在 12 个字以内" },
        { status: 400 },
      ),
    };
  }
  if (reservedNames.has(name)) {
    return {
      response: Response.json(
        { error: "这个名称已被系统入口使用" },
        { status: 400 },
      ),
    };
  }

  return { name };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "暂时无法完成操作";
  return Response.json({ error: message }, { status: 500 });
}
