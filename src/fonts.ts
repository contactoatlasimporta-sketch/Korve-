import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource-variable/archivo/wdth.css';

export const FONT_DISPLAY = '"Archivo Variable", "Inter", sans-serif';
export const FONT_SANS = '"Inter", sans-serif';
export const FONT_MONO = '"JetBrains Mono", monospace';

let p: Promise<void> | null = null;
export const fontsReady = () => {
  if (!p) {
    p = Promise.all([
      document.fonts.load('800 100px "Archivo Variable"'),
      document.fonts.load('600 40px "Inter"'),
      document.fonts.load('400 40px "Inter"'),
      document.fonts.load('300 40px "Inter"'),
      document.fonts.load('500 20px "JetBrains Mono"'),
      document.fonts.load('400 20px "JetBrains Mono"'),
    ]).then(() => undefined);
  }
  return p;
};
