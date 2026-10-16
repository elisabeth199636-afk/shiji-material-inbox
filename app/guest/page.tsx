import { MaterialInbox } from "../MaterialInbox";
import { chatGPTSignInPath } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default function GuestPage() {
  return (
    <MaterialInbox
      user={{
        id: "guest-local",
        displayName: "游客",
        email: "仅保存在当前浏览器",
      }}
      guest
      signInPath={chatGPTSignInPath("/")}
    />
  );
}
