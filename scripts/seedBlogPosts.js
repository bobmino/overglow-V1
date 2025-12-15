import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Blog from '../backend/models/blogModel.js';
import User from '../backend/models/userModel.js';

dotenv.config();

const samplePosts = [
  {
    title: 'Les 10 meilleures destinations au Maroc pour 2025',
    excerpt: 'Découvrez les destinations les plus tendances du Maroc pour votre prochaine aventure. De Marrakech à Chefchaouen, explorez les perles cachées du royaume.',
    content: `
      <h2>Introduction</h2>
      <p>Le Maroc continue d'être une destination de choix pour les voyageurs en quête d'authenticité, de culture riche et de paysages époustouflants. En 2025, certaines destinations marocaines se démarquent particulièrement.</p>
      
      <h2>1. Marrakech - La Perle du Sud</h2>
      <p>Marrakech reste incontournable avec sa médina animée, ses palais historiques et sa place Jemaa el-Fnaa, classée au patrimoine mondial de l'UNESCO.</p>
      
      <h2>2. Chefchaouen - La Ville Bleue</h2>
      <p>Niché dans les montagnes du Rif, Chefchaouen séduit par ses ruelles bleues et son atmosphère paisible. Parfait pour une escapade reposante.</p>
      
      <h2>3. Fès - La Capitale Spirituelle</h2>
      <p>Fès abrite la plus ancienne médina du monde arabe et offre un voyage dans le temps à travers ses souks traditionnels et ses médersas.</p>
      
      <h2>Conclusion</h2>
      <p>Que vous recherchiez l'aventure, la culture ou la détente, le Maroc a quelque chose à offrir à chaque voyageur. Planifiez votre voyage avec Overglow Trip pour une expérience authentique et mémorable.</p>
    `,
    category: 'Destinations',
    tags: ['Maroc', 'Voyage', 'Destinations', 'Tourisme'],
    featured: true,
    isPublished: true,
    metaTitle: 'Les 10 meilleures destinations au Maroc 2025',
    metaDescription: 'Découvrez les destinations les plus tendances du Maroc pour 2025. Guide complet avec conseils pratiques et recommandations.',
    keywords: ['Maroc', 'destinations', 'voyage', 'tourisme', 'Marrakech', 'Chefchaouen'],
    relatedDestinations: ['Marrakech', 'Chefchaouen', 'Fès', 'Casablanca'],
  },
  {
    title: 'Comment voyager de manière responsable au Maroc',
    excerpt: 'Conseils pratiques pour un tourisme durable et respectueux de l\'environnement et des communautés locales au Maroc.',
    content: `
      <h2>Pourquoi voyager responsable ?</h2>
      <p>Le tourisme responsable au Maroc permet de préserver les sites culturels, soutenir les communautés locales et minimiser l'impact environnemental.</p>
      
      <h2>Conseils pratiques</h2>
      <ul>
        <li>Choisissez des opérateurs locaux certifiés</li>
        <li>Respectez les coutumes et traditions</li>
        <li>Évitez le gaspillage d'eau</li>
        <li>Privilégiez les transports durables</li>
        <li>Soutenez l'artisanat local</li>
      </ul>
      
      <h2>Impact positif</h2>
      <p>En voyageant de manière responsable, vous contribuez directement au développement économique local et à la préservation du patrimoine marocain.</p>
    `,
    category: 'Conseils de voyage',
    tags: ['Tourisme responsable', 'Développement durable', 'Éthique'],
    featured: true,
    isPublished: true,
    metaTitle: 'Tourisme responsable au Maroc - Guide pratique',
    metaDescription: 'Découvrez comment voyager de manière responsable au Maroc avec nos conseils pratiques pour un tourisme durable.',
    keywords: ['tourisme responsable', 'développement durable', 'Maroc', 'voyage éthique'],
  },
  {
    title: 'Guide complet : Organiser votre premier voyage solo au Maroc',
    excerpt: 'Tout ce que vous devez savoir pour partir en toute sécurité et profiter pleinement de votre première aventure solo au Maroc.',
    content: `
      <h2>Pourquoi voyager solo au Maroc ?</h2>
      <p>Le Maroc est une destination idéale pour les voyageurs solo grâce à sa sécurité, son hospitalité légendaire et ses nombreuses activités adaptées.</p>
      
      <h2>Préparations essentielles</h2>
      <ul>
        <li>Renseignez-vous sur les coutumes locales</li>
        <li>Apprenez quelques mots d'arabe ou de français</li>
        <li>Préparez votre itinéraire à l'avance</li>
        <li>Informez vos proches de votre localisation</li>
      </ul>
      
      <h2>Conseils de sécurité</h2>
      <p>Le Maroc est généralement sûr pour les voyageurs solo, mais restez vigilant dans les zones touristiques et évitez de vous promener seul la nuit dans les médinas.</p>
      
      <h2>Expériences recommandées</h2>
      <p>Participez à des visites guidées, séjournez dans des riads traditionnels et n'hésitez pas à interagir avec les locaux pour une expérience authentique.</p>
    `,
    category: 'Guides pratiques',
    tags: ['Voyage solo', 'Sécurité', 'Conseils'],
    featured: false,
    isPublished: true,
    metaTitle: 'Voyage solo au Maroc - Guide complet 2025',
    metaDescription: 'Guide complet pour organiser votre premier voyage solo au Maroc. Conseils pratiques, sécurité et recommandations.',
    keywords: ['voyage solo', 'Maroc', 'sécurité', 'guide voyage'],
  },
];

const seedBlogPosts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Find admin user
    const admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Clear existing posts (optional)
    // await Blog.deleteMany({});

    // Create blog posts
    for (const postData of samplePosts) {
      const post = new Blog({
        ...postData,
        author: admin._id,
        publishedAt: new Date(),
      });
      await post.save();
      console.log(`Created blog post: ${post.title}`);
    }

    console.log('Blog posts seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding blog posts:', error);
    process.exit(1);
  }
};

seedBlogPosts();

