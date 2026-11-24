// Variabel EXPO_PUBLIC_* diganti nilainya oleh Metro saat bundling.
declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};
