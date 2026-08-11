market = Path("src/views/Marketplace.tsx")
m = market.read_text()
m = m.replace("import { useState, useMemo, useRef, useEffect } from 'react';", "import { useState, useMemo } from 'react';", 1)
m = re.sub(r"\n  const purchaseTimerRef = useRef<.*?\n  useEffect\(\(\) => \{\n    return \(\) => \{\n      if \(purchaseTimerRef\.current\) clearTimeout\(purchaseTimerRef\.current\);\n    \};\n  \}, \[\]\);\n", "\n", m, count=1, flags=re.S)
m = re.sub(r"  const handlePurchase = \(item: MarketItem\) => \{.*?\n  \};", """  const handlePurchase = (item: MarketItem) => {
    if (ownedIds.has(item.id)) {
      toast({ title: 'Already owned', message: `${item.name} is already in your inventory.`, type: 'info' });
      return;
    }
    if (state.xp < item.xpRequired) {
      toast({ title: 'Locked', message: `You need ${item.xpRequired.toLocaleString()} XP to unlock this item.`, type: 'error' });
      playSound('error');
      return;
    }
    if (state.coins < item.price) {
      toast({ title: 'Not enough coins', message: `You need ${item.price.toLocaleString()} coins.`, type: 'error' });
      playSound('error');
      return;
    }
    setPurchasing(item.id);
    playSound('whoosh');
    const success = purchaseItem(item.id, item.category, item.price);
    setPurchasing(null);
    if (success) toast({ title: 'Purchase Successful!', message: `${item.name} added to your inventory.`, type: 'reward', icon: '🪙' });
    else {
      toast({ title: 'Purchase failed', message: 'The item could not be purchased. Your balance was not changed.', type: 'error' });
      playSound('error');
    }
  };""", m, count=1, flags=re.S)
market.write_text(m)
