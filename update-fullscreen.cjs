const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/settings/GeneralSettings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('isFullscreen')) {
  // Add state to the component
  content = content.replace(
    /const \[printSettingsSuccess, setPrintSettingsSuccess\] = useState/,
    'const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);\n  const [printSettingsSuccess, setPrintSettingsSuccess] = useState'
  );

  // If the above replace didn't work because printSettingsSuccess is from props
  content = content.replace(
    /export const GeneralSettings: React\.FC<GeneralSettingsProps> = \({[\s\S]*?}\) => {/,
    (match) => match + "\n  const [isFullscreen, setIsFullscreen] = React.useState(document.fullscreenElement !== null);\n\n  React.useEffect(() => {\n    const handleFullscreenChange = () => {\n      setIsFullscreen(document.fullscreenElement !== null);\n    };\n    document.addEventListener('fullscreenchange', handleFullscreenChange);\n    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);\n  }, []);\n\n  const toggleFullscreen = () => {\n    if (!document.fullscreenElement) {\n      document.documentElement.requestFullscreen().catch((err) => {\n        console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);\n      });\n    } else {\n      document.exitFullscreen();\n    }\n  };\n"
  );
  
  // Also import Maximize
  content = content.replace(
    /import { Palette, Eye, EyeOff, /,
    'import { Palette, Eye, EyeOff, Maximize, '
  );
  
  // Add the UI
  const targetUI = `
                {/* Section C: Tam Ekran Modu */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Maximize size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tam Ekran Modu</h3>
                      <p className="text-[11px] text-white/50 mt-0.5">Uygulamayı tam ekran (F11) olarak kullanın</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className={\`w-full flex items-center justify-center py-2.5 px-4 rounded-xl border transition cursor-pointer font-bold text-xs \${
                      isFullscreen
                        ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-[0_2px_10px_rgba(99,102,241,0.2)]'
                        : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                    }\`}
                  >
                    {isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekrana Geç'}
                  </button>
                </div>
              </div>
            </div>`;

  content = content.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Card 3: Firma ve Görünüm Ayarları \*\/\}/,
    targetUI + '\n            {/* Card 3: Firma ve Görünüm Ayarları */}'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Added fullscreen UI to GeneralSettings.tsx');
} else {
  console.log('Fullscreen already added');
}
