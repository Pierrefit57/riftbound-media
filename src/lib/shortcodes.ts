/**
 * Shortcodes Parser for Riftbound Markdown Editor
 *
 * Converts simple bracket tags like [icon:fire] or [energy:3]
 * into their corresponding HTML elements before markdown processing.
 */

export function parseShortcodes(text: string): string {
  if (!text) return text;
  
  let processed = text;

  // 1. Energy Icons: [energy:3] -> <span class="icon-energy">3</span>
  processed = processed.replace(/\[energy:(\d)\]/g, '<span class="icon-energy">$1</span>');

  // 2. TCG Icons: [icon:card-draw] -> <img src="/assets/icons/card-draw.png" class="icon-tcg" alt="card-draw" />
  processed = processed.replace(/\[icon:([^\]]+)\]/g, '<img src="/assets/icons/$1.png" class="icon-tcg" alt="$1" />');

  // 3. Clear Float: [clear] -> <div style="clear: both; height: 1px;"></div>
  processed = processed.replace(/\[clear\]/g, '<div style="clear: both; height: 1px;"></div><!-- Séparateur -->');

  // 4. Alignments
  // [align-center]...[/align]
  processed = processed.replace(/\[align-center\]([\s\S]*?)\[\/align\]/g, '<div style="text-align: center">\n\n$1\n\n</div>');
  // [align-right]...[/align]
  processed = processed.replace(/\[align-right\]([\s\S]*?)\[\/align\]/g, '<div style="text-align: right">\n\n$1\n\n</div>');
  // [align-left]...[/align]
  processed = processed.replace(/\[align-left\]([\s\S]*?)\[\/align\]/g, '<div style="text-align: left">\n\n$1\n\n</div>');

  // 5. FontSize: [size:24]...[/size]
  processed = processed.replace(/\[size:(\d+)\]([\s\S]*?)\[\/size\]/g, '<span style="font-size: $1px">$2</span>');

  // 6. Color: [color:#ff0000]...[/color]
  processed = processed.replace(/\[color:([^\]]+)\]([\s\S]*?)\[\/color\]/g, '<span style="color: $1">$2</span>');

  // 7. Blockquote: [quote]...[/quote]
  processed = processed.replace(/\[quote\]([\s\S]*?)\[\/quote\]/g, '<blockquote>\n\n$1\n\n</blockquote>');
  
  // 7b. Keyword Badges: [badge:green]text[/badge]
  processed = processed.replace(/\[badge:([^\]]+)\]([\s\S]*?)\[\/badge\]/g, (match, color, content) => {
    const cleanColor = color.toLowerCase().trim();
    return `<span class="badge-keyword badge-keyword-${cleanColor}">${content}</span>`;
  });

  // 8. Video/GIF: [video:url] -> <video autoplay loop muted playsinline class="article-video cursor-zoom-in"><source src="url" type="video/mp4"></video>
  processed = processed.replace(/\[video:([^\]]+)\]/g, (match, url) => {
    return `<div class="video-container"><video autoplay loop muted playsinline class="article-video cursor-zoom-in rounded-lg border border-rift-700/30 w-full shadow-lg"><source src="${url}" type="video/mp4"></video></div>`;
  });

  // 9. Section Layouts (Flexbox)
  // [layout-left] image ... --- ... text [/layout]
  processed = processed.replace(/\[layout-left\]([\s\S]*?)(?:\r?\n)(?:---)(?:\r?\n)([\s\S]*?)\[\/layout\]/g, (match, part1, part2) => {
    return `<div style="display: flex; align-items: center; gap: 2rem; margin: 0.5rem 0; flex-wrap: wrap;">\n\n<div style="flex: 1; min-width: 300px;">\n\n${part1.trim()}\n\n</div>\n\n<div style="flex: 1; min-width: 300px;">\n\n${part2.trim()}\n\n</div>\n\n</div>`;
  });

  // [layout-right] image ... --- ... text [/layout]
  processed = processed.replace(/\[layout-right\]([\s\S]*?)(?:\r?\n)(?:---)(?:\r?\n)([\s\S]*?)\[\/layout\]/g, (match, part1, part2) => {
    return `<div style="display: flex; align-items: center; gap: 2rem; margin: 0.5rem 0; flex-wrap: wrap; flex-direction: row-reverse;">\n\n<div style="flex: 1; min-width: 300px;">\n\n${part1.trim()}\n\n</div>\n\n<div style="flex: 1; min-width: 300px;">\n\n${part2.trim()}\n\n</div>\n\n</div>`;
  });

  // [layout-dual] image 1 ... --- ... image 2 [/layout]
  processed = processed.replace(/\[layout-dual\]([\s\S]*?)(?:\r?\n)(?:---)(?:\r?\n)([\s\S]*?)\[\/layout\]/g, (match, part1, part2) => {
    return `<div style="display: flex; align-items: center; gap: 1.5rem; margin: 1rem 0; flex-wrap: wrap;">\n\n<div style="flex: 1; min-width: 250px;">\n\n${part1.trim()}\n\n</div>\n\n<div style="flex: 1; min-width: 250px;">\n\n${part2.trim()}\n\n</div>\n\n</div>`;
  });

  // [layout-triple] image 1 --- image 2 --- image 3 [/layout]
  processed = processed.replace(/\[layout-triple\]([\s\S]*?)(?:\r?\n)(?:---)(?:\r?\n)([\s\S]*?)(?:\r?\n)(?:---)(?:\r?\n)([\s\S]*?)\[\/layout\]/g, (match, part1, part2, part3) => {
    return `<div style="display: flex; align-items: center; gap: 1rem; margin: 1rem 0; flex-wrap: wrap;">\n\n<div style="flex: 1; min-width: 180px;">\n\n${part1.trim()}\n\n</div>\n\n<div style="flex: 1; min-width: 180px;">\n\n${part2.trim()}\n\n</div>\n\n<div style="flex: 1; min-width: 180px;">\n\n${part3.trim()}\n\n</div>\n\n</div>`;
  });

  // [image-center]...[/image-center] or [image-center:40%]...[/image-center]
  // — centered image, full-width container, controlled max-width, no text wrapping
  processed = processed.replace(/\[image-center(?::([^\]]+))?\]([\s\S]*?)\[\/image-center\]/g, (match, width, content) => {
    const maxWidth = width ? width.trim() : '100%';
    return `<div class="image-center-block" style="max-width: ${maxWidth}; margin-left: auto; margin-right: auto;">\n\n${content.trim()}\n\n</div>`;
  });

  // 10. Volet Rétractable (Accordion)
  // [volet:Titre du volet]...[/volet]
  processed = processed.replace(/\[volet:([^\]]+)\]([\s\S]*?)\[\/volet\]/g, (match, title, content) => {
    return `<details class="article-volet">\n<summary class="volet-summary">${title}</summary>\n<div class="volet-content">\n\n${content.trim()}\n\n</div>\n</details>`;
  });

  // 11. YouTube Embed: [youtube:VIDEO_ID_OR_URL]
  // Accepts: [youtube:dQw4w9WgXcQ] or [youtube:https://www.youtube.com/watch?v=dQw4w9WgXcQ]
  // or [youtube:https://youtu.be/dQw4w9WgXcQ]
  processed = processed.replace(/\[youtube:([^\]]+)\]/g, (match, input) => {
    // Extract video ID from various YouTube URL formats or use raw ID
    let videoId = input.trim();
    const urlMatch = videoId.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (urlMatch) {
      videoId = urlMatch[1];
    }
    // Validate: YouTube IDs are exactly 11 chars of [a-zA-Z0-9_-]
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `<p style="color: #f87171;">⚠️ ID YouTube invalide : ${videoId}</p>`;
    }
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    return `<div class="youtube-embed"><div class="youtube-facade" data-video-id="${videoId}" onclick="this.innerHTML='<iframe src=&quot;${embedUrl}&quot; frameborder=&quot;0&quot; allow=&quot;accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture&quot; allowfullscreen style=&quot;position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:0.75rem;&quot;></iframe>';this.style.cursor='default'"><img src="${thumbUrl}" alt="YouTube Video" class="youtube-thumbnail" loading="lazy" onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg';" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;border-radius:0.75rem;"/><div class="youtube-play-btn"><svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/><path d="M45 24L27 14v20" fill="white"/></svg></div></div></div>`;
  });

  // 12. Spoiler: [spoiler]...[/spoiler]
  processed = processed.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/g, (match, content) => {
    return `<div class="article-spoiler relative rounded-xl border border-rift-700/50 bg-rift-900/30 overflow-hidden cursor-pointer group" onclick="this.classList.add('revealed')">\n\n<div class="spoiler-content transition-all duration-700 blur-xl opacity-30 select-none pointer-events-none p-4">\n\n${content.trim()}\n\n</div>\n\n<div class="spoiler-overlay absolute inset-0 flex flex-col items-center justify-center bg-rift-950/80 group-hover:bg-rift-900/90 transition-colors z-10">\n<div class="flex items-center gap-2 text-accent-spirit font-bold px-5 py-2.5 rounded-full border border-accent-spirit/30 bg-rift-900/80 shadow-lg group-hover:scale-105 transition-transform">\n<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">\n<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />\n<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />\n</svg>\n<span class="tracking-wide uppercase text-sm">Cliquer pour révéler le spoiler</span>\n</div>\n</div>\n</div>`;
  });

  return processed;
}
