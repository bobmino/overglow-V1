export const servicesMock = [
  // EXPLORER (Activités, Excursions, etc.)
  {
    _id: "mock-exp-1",
    title: "Session de Surf Privée avec Coach Pro",
    category: "Surf & Plage",
    type: "explorer",
    city: "Taghazout",
    price: 350,
    images: ["https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"],
    rating: 4.9,
    reviewCount: 124,
    description: "Apprenez à surfer sur les meilleures vagues de Taghazout avec un instructeur professionnel. Matériel inclus.",
    schedules: [
      { date: new Date().toISOString(), time: "10:00", price: 350 },
      { date: new Date(Date.now() + 86400000).toISOString(), time: "14:00", price: 350 }
    ]
  },
  {
    _id: "mock-exp-2",
    title: "Excursion en Quad dans le Désert d'Agafay",
    category: "Aventure & Nature",
    type: "explorer",
    city: "Marrakech",
    price: 450,
    images: ["https://images.unsplash.com/photo-1563503525547-49f3e49e2954?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"],
    rating: 4.8,
    reviewCount: 89,
    description: "Vivez l'adrénaline d'une balade en quad dans les dunes rocailleuses d'Agafay, avec pause thé sous tente berbère.",
    schedules: [
      { date: new Date().toISOString(), time: "09:00", price: 450 },
      { date: new Date().toISOString(), time: "15:00", price: 450 }
    ]
  },
  {
    _id: "mock-exp-3",
    title: "Médina de Coco Polizzi et artisanat local",
    category: "Visites Guidées",
    type: "explorer",
    city: "Agadir",
    price: 250,
    images: ["https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1000&q=80"],
    rating: 4.6,
    reviewCount: 45,
    description: "Découvrez l'incroyable reconstruction de la Médina d'Agadir par Coco Polizzi avec un guide certifié.",
    schedules: [
      { date: new Date().toISOString(), time: "10:30", price: 250 }
    ]
  },
  {
    _id: "mock-exp-4",
    title: "Dîner Spectacle Fantasia",
    category: "Gastronomie",
    type: "explorer",
    city: "Agadir",
    price: 600,
    images: ["https://images.unsplash.com/photo-1533750516457-a7f992034fec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"],
    rating: 4.7,
    reviewCount: 201,
    description: "Savourez un repas traditionnel marocain tout en assistant à un spectacle époustouflant de cavaliers et acrobates.",
    schedules: [
      { date: new Date().toISOString(), time: "20:00", price: 600 }
    ]
  },
  {
    _id: "mock-exp-5",
    title: "Musée de la Culture Amazighe",
    category: "Culture & Médina",
    type: "explorer",
    city: "Agadir",
    price: 150,
    images: ["https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1000&q=80"],
    rating: 4.5,
    reviewCount: 88,
    description: "Plongez dans l'histoire de la culture berbère, avec une collection impressionnante de bijoux et de tapis.",
    schedules: [
      { date: new Date().toISOString(), time: "11:00", price: 150 }
    ]
  },
  {
    _id: "mock-exp-6",
    title: "Thalassothérapie face à l'océan",
    category: "Détente & Bien-être",
    type: "explorer",
    city: "Taghazout",
    price: 800,
    images: ["https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1000&q=80"],
    rating: 4.9,
    reviewCount: 200,
    description: "Journée de détente absolue avec vue sur l'océan, comprenant massages, hammam et bains hydrothérapeutiques.",
    schedules: [
      { date: new Date().toISOString(), time: "09:00", price: 800 },
      { date: new Date().toISOString(), time: "14:00", price: 800 }
    ]
  },
  
  // LOGEMENTS (Villas, Yachts, etc.)
  {
    _id: "mock-log-1",
    title: "Villa d'Exception avec Piscine à Débordement",
    category: "Villas de Prestige",
    type: "logements",
    city: "Marrakech",
    price: 8500,
    images: ["https://images.unsplash.com/photo-1613490908575-bc32ab6cdbb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"],
    rating: 5.0,
    reviewCount: 12,
    description: "Une villa de rêve pour 8 personnes avec personnel de maison, piscine chauffée et vue sur l'Atlas.",
    schedules: [
      { date: new Date().toISOString(), time: "14:00", price: 8500 }
    ]
  },
  {
    _id: "mock-log-2",
    title: "Duplex haut standing Vue Océan",
    category: "Appartements Vue Océan",
    type: "logements",
    city: "Agadir",
    price: 2500,
    images: ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80"],
    rating: 4.8,
    reviewCount: 30,
    description: "Appartement de luxe offrant une vue panoramique sur la marina d'Agadir. Jacuzzi inclus.",
    schedules: [
      { date: new Date().toISOString(), time: "15:00", price: 2500 }
    ]
  },
  {
    _id: "mock-log-3",
    title: "Riad Traditionnel Luxueux",
    category: "Riads Insolites",
    type: "logements",
    city: "Marrakech",
    price: 3200,
    images: ["https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1000&q=80"],
    rating: 4.9,
    reviewCount: 156,
    description: "Un havre de paix au cœur de la Médina, avec patio central, fontaine, et service de chef cuisinier.",
    schedules: [
      { date: new Date().toISOString(), time: "14:00", price: 3200 }
    ]
  },
  
  // EXTRAS (Services, Conciergerie, etc.)
  {
    _id: "mock-ext-1",
    title: "Transfert VIP Aéroport en Mercedes Classe S",
    category: "Mobilité & Chauffeurs",
    type: "extras",
    city: "Casablanca",
    price: 1200,
    images: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"],
    rating: 4.9,
    reviewCount: 456,
    description: "Arrivez avec élégance. Chauffeur privé à votre disposition dès votre sortie de l'aéroport.",
    schedules: [
      { date: new Date().toISOString(), time: "Flexible", price: 1200 }
    ]
  },
  {
    _id: "mock-ext-2",
    title: "Photographe Professionnel pour vos Vacances",
    category: "Services À la Carte",
    type: "extras",
    city: "Marrakech",
    price: 2000,
    images: ["https://images.unsplash.com/photo-1554048612-b6a482bc67e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"],
    rating: 5.0,
    reviewCount: 45,
    description: "Immortalisez vos meilleurs souvenirs avec un shooting photo de 2h dans la Médina ou la Palmeraie.",
    schedules: [
      { date: new Date().toISOString(), time: "16:00", price: 2000 }
    ]
  }
];
