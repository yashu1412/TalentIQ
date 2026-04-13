const fs = require('fs');
const path = require('path');

const tailwindReplacements = {
  'bg-slate-900': 'bg-[#0a0a0a]',
  'bg-slate-800': 'bg-[#161616]',
  'border-slate-800': 'border-[#262626]',
  'border-slate-700': 'border-[#262626]',
  'text-slate-500': 'text-[#A1A1AA]',
  'text-slate-400': 'text-[#A1A1AA]',
  'text-slate-300': 'text-[#D4D4D8]',
  'text-slate-200': 'text-[#E4E4E7]',
  'bg-teal-300/10': 'bg-[#60A5FA]/10',
  'border-teal-300/30': 'border-[#60A5FA]/30',
  'text-teal-400': 'text-[#60A5FA]',
  'text-teal-300': 'text-[#60A5FA]',
  'hover:text-teal-400': 'hover:text-[#60A5FA]',
  'hover:text-teal-300': 'hover:text-[#60A5FA]',
  'border-teal-500': 'border-[#378ADD]',
  'bg-teal-700': 'bg-[#2E73B8]',
  'hover:bg-teal-700': 'hover:bg-[#2E73B8]',
  'hover:bg-teal-600': 'hover:bg-[#378ADD]',
  'focus:border-teal-600': 'focus:border-[#378ADD]',
  'focus:ring-teal-600': 'focus:ring-[#378ADD]',
  'bg-teal-600/20': 'bg-[#378ADD]/20',
  'bg-slate-900/80': 'bg-[#0a0a0a]/80',
  'bg-[#0a0a0a]/80': 'bg-[#0a0a0a]/80', // just in case
  'hover:bg-slate-700': 'hover:bg-[#262626]',
  'border-teal-600': 'border-[#378ADD]',
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
      for (const [key, value] of Object.entries(tailwindReplacements)) {
        if (content.includes(key) && key !== value) {
          content = content.split(key).join(value);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(p, content, 'utf8');
        console.log('Updated tailwind classes:', p);
      }
    }
  }
}

walkAll(path.join(__dirname, 'src', 'app'));
walkAll(path.join(__dirname, 'src', 'components'));
console.log('Tailwind sweep complete.');
