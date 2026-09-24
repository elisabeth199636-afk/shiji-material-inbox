import { claimLegacyData } from "../../db/items";
import { getChatGPTUser } from "../chatgpt-auth";

export async function getApiUser() {
  const user = await getChatGPTUser();
  if (!user) return null;

  await claimLegacyData(user.id, user.email);
  return user;
}

export function unauthorizedJson() {
  return Response.json({ error: "请先使用 ChatGPT 登录" }, { status: 401 });
}
