const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/settings/GeneralSettings.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// I replaced:
// </div>\s*</div>\s*</div>\s*{/* Card 3: Firma ve Görünüm Ayarları */}
// So I removed 3 </div> tags but only added back what was in targetUI... wait, targetUI had:
// </div>
// </div>
// </div>
// Let's check targetUI from the script.

content = content.replace(
  /\{isFullscreen \? 'Tam Ekrandan Çık' : 'Tam Ekrana Geç'\}\n                  <\/button>\n                <\/div>\n              <\/div>\n            <\/div>/,
  `{isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekrana Geç'}
                  </button>
                </div>
              </div>
            </div>
            </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
