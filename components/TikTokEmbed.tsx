import { useEffect } from "react";

export function TikTokEmbed({ url }: { url: string }) {
  useEffect(() => {
    // Jangan inject ulang kalau sudah ada
    if (document.querySelector('script[src="https://www.tiktok.com/embed.js"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, [url]);

  if (!url || !url.includes("/video/")) return null;

  const videoId = url.split("/video/")[1]?.split("?")[0];

  return (
    <div
      className="w-full flex justify-center"
      dangerouslySetInnerHTML={{
        __html: `
        <blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}" style="max-width: 605px; min-width: 325px;">
          <section>
            <a href="${url}" target="_blank">TikTok</a>
          </section>
        </blockquote>
        `,
      }}
    />
  );
}
