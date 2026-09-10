import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f7f7",
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "拾集 · 灵感素材库",
    description: "在手机和电脑上收集、分类并重新找到每一条灵感。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      title: "拾集 · 灵感素材库",
      description: "在手机和电脑上收集、分类并重新找到每一条灵感。",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1734,
          height: 907,
          alt: "拾集灵感素材库界面预览",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "拾集 · 灵感素材库",
      description: "在手机和电脑上收集、分类并重新找到每一条灵感。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
