const fs = require('fs');
const path = require('path');

const replacements = {
  // Dark colors
  '#0F172A': '#0a0a0a',
  'rgba(15,23,42,': 'rgba(10,10,10,',
  '15,23,42': '10,10,10',
  '#1E293B': '#161616',
  'rgba(30,41,59,': 'rgba(22,22,22,',
  '30,41,59': '22,22,22',
  '#334155': '#262626',
  'rgba(51,65,85,': 'rgba(38,38,38,',
  '51,65,85': '38,38,38',
  '#475569': '#52525b',
  '#64748B': '#71717a',
  '#94A3B8': '#A1A1AA',
  '#F1F5F9': '#FFFFFF',
  
  // Teal/Cyan to Blue
  '#0D9488': '#378ADD',
  '13,148,136': '55,138,221',
  '#5EEAD4': '#60A5FA',
  '94,234,212': '96,165,250',
  '#06B6D4': '#378ADD',
  '6,182,212': '55,138,221',
};

function walkAll(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) {
      walkAll(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let content = fs.readFileSync(p, 'utf8');
      let changed = false;
      for (const [key, value] of Object.entries(replacements)) {
        if (content.includes(key)) {
          // Global replace without using string.replaceAll for older nodes
          content = content.split(key).join(value);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(p, content, 'utf8');
        console.log('Updated:', p);
      }
    }
  }
}

walkAll(path.join(__dirname, 'src', 'app'));
walkAll(path.join(__dirname, 'src', 'components'));
console.log('Retheme sweep complete.');
