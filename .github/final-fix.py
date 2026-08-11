from pathlib import Path
import re
p = Path('src/store/useStore.ts')
s = p.read_text()
s = re.sub(r'^\s*const (mainDone|extraDone) = .*?;\n', '', s, flags=re.M)
pattern = r"(const pool = chosen\.type === 'weapon' \? WEAPONS : AURAS;\n\s+const rarity = rollRarity\(\);\n)\s+const item = pickFromRarity\(pool, rarity\);"
s, n = re.subn(pattern, r"\1      const item = pickFromRarity(pool as any, rarity);", s, count=1)
if n != 1:
    raise SystemExit('spin pool target not found')
p.write_text(s)
