import { getCityImage } from './cityMedia.js';

/** Morocco-first destinations for homepage / TopDestinations (TASK-24). */
const destinations = [
  {
    name: 'Marrakech',
    slug: 'marrakech',
    image: getCityImage('Marrakech', 'card'),
    description: 'La ville ocre',
  },
  {
    name: 'Fès',
    slug: 'fes',
    image: getCityImage('Fès', 'card'),
    description: 'La capitale spirituelle',
  },
  {
    name: 'Chefchaouen',
    slug: 'chefchaouen',
    image: getCityImage('Chefchaouen', 'card'),
    description: 'La perle bleue',
  },
  {
    name: 'Essaouira',
    slug: 'essaouira',
    image: getCityImage('Essaouira', 'card'),
    description: 'La cité des alizés',
  },
  {
    name: 'Agadir',
    slug: 'agadir',
    image: getCityImage('Agadir', 'card'),
    description: 'La capitale du Souss',
  },
  {
    name: 'Taghazout',
    slug: 'taghazout',
    image: getCityImage('Taghazout', 'card'),
    description: 'Le paradis des surfeurs',
  },
  {
    name: 'Casablanca',
    slug: 'casablanca',
    image: getCityImage('Casablanca', 'card'),
    description: 'La métropole atlantique',
  },
  {
    name: 'Rabat',
    slug: 'rabat',
    image: getCityImage('Rabat', 'card'),
    description: 'La capitale',
  },
];

export default destinations;
