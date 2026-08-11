from pathlib import Path
import re
p = Path('src/store/useStore.ts')
s = p.read_text()
s = re.sub(r'^\s*const (mainDone|extraDone) = .*?;\n', '', s, flags=re.M)
s = s.replace('const item = pickFromRarity(pool, rarity);', 'const item = pickFromRarity(pool as any, rarity);', 1)
p.write_text(s)
