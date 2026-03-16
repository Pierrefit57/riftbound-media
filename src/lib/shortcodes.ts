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

  return processed;
}
