import fs from 'fs';

const path = 'frontend/src/pages/DestinationPage.jsx';
let s = fs.readFileSync(path, 'utf8');

s = s.replace(
  /image: 'https:\/\/images\.unsplash\.com\/photo-1597212618440-806262de4f6b\?w=1200'/g,
  "image: getCityImage('Marrakech', 'hero')"
);

const cities = ['Casablanca', 'Fès', 'Rabat', 'Tanger', 'Agadir'];
let i = 0;
s = s.replace(
  /image: 'https:\/\/images\.unsplash\.com\/photo-1572252009286-268acec5ca0a\?w=1200'/g,
  () => `image: getCityImage('${cities[i++]}', 'hero')`
);

// Fallback for unknown cities
s = s.replace(
  /const info = cityInfo\[cityKey\] \|\| \{[\s\S]*?image: getCityImage\('Marrakech', 'hero'\),/,
  (block) =>
    block.replace(
      "image: getCityImage('Marrakech', 'hero')",
      "image: getCityImage(cityKey, 'hero')"
    )
);

fs.writeFileSync(path, s);
console.log('Egypt placeholders replaced:', i);
