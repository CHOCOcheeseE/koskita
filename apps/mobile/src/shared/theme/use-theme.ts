import { useEffect, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorTokens } from './tokens';

/** Warna mengikuti setelan sistem (mode gelap tanpa tombol pengaturan di MVP). */
export function useColors(): ColorTokens {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

/** `true` jika pengguna menyalakan kurangi gerakan; semua animasi harus mati. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduce;
}
