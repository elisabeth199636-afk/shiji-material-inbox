import { MaterialInbox } from "./MaterialInbox";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

  if (!user) {
    return (
      <main className="sign-in-shell">
        <section className="sign-in-card" aria-labelledby="sign-in-title">
          <div className="sign-in-brand" aria-hidden="true">
            <span />
            <span />
          </div>
          <p className="sign-in-eyebrow">拾集 · 灵感素材库</p>
          <h1 id="sign-in-title">收集每一条灵感</h1>
          <p className="sign-in-copy">
            登录后，你的素材、分类和预览图片只属于你，并可在手机与电脑间同步。
          </p>
          <a
            className="sign-in-button"
            href={chatGPTSignInPath("/")}
            target="_top"
          >
            使用 ChatGPT 登录
          </a>
        </section>
      </main>
    );
  }

  return (
    <MaterialInbox
      user={{ displayName: user.displayName, email: user.email }}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}
