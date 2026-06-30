const normalizeAddress = (addr) => {
  let s = (addr || '').toUpperCase().trim();
  s = s.replace(/\bBLK\b/g, 'BLOK').replace(/\bJL\b/g, 'JALAN').replace(/\bJLN\b/g, 'JALAN').replace(/\bGG\b/g, 'GANG').replace(/\bKP\b/g, 'KAMPUNG').replace(/\bDS\b/g, 'DESA');
  return s.replace(/[^A-Z0-9]/g, '');
};

const addresses = [
  "BLOK TEGAL BUAH ",
  "BLOK TEGAL BUAH",
  " BLOK TEGAL BUAH",
  "BLOK TEGAL BUAH  "
];

addresses.forEach(a => {
  console.log(`Original: "${a}" -> Normalized: "${normalizeAddress(a)}"`);
});
