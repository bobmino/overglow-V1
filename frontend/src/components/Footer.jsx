import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Music } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Trustpilot Banner */}
      <div className="bg-slate-800 py-4">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-medium">4.4 rating | 292,570 reviews</span>
          <span className="text-xs text-slate-400">★ Trustpilot</span>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1 */}
          <div>
            <h3 className="font-bold text-sm mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/help" className="hover:text-white transition">Centre d'aide</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Nous contacter</Link></li>
              <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li><Link to="/safety" className="hover:text-white transition">Sécurité</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="font-bold text-sm mb-4">À propos</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/about" className="hover:text-white transition">Qui sommes-nous</Link></li>
              <li><Link to="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link to="/careers" className="hover:text-white transition">Carrières</Link></li>
              <li><Link to="/press" className="hover:text-white transition">Presse</Link></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="font-bold text-sm mb-4">Pour les opérateurs</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/affiliate" className="hover:text-white transition">Devenir partenaire</Link></li>
              <li><Link to="/operator/help" className="hover:text-white transition">Centre d'aide opérateur</Link></li>
              <li><Link to="/operator/resources" className="hover:text-white transition">Ressources</Link></li>
              <li><Link to="/operator/community" className="hover:text-white transition">Communauté</Link></li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="font-bold text-sm mb-4">Légal</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/terms" className="hover:text-white transition">Conditions d'utilisation</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition">Confidentialité</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition">Cookies</Link></li>
              <li><Link to="/accessibility" className="hover:text-white transition">Accessibilité</Link></li>
            </ul>
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="flex items-center justify-center gap-6 py-6 border-t border-slate-700">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition">
            <Facebook size={20} />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition">
            <Twitter size={20} />
          </a>
          <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0a12 12 0 00-4.37 23.17c-.18-1.63-.03-3.59.39-5.36.45-1.89 2.93-12.42 2.93-12.42s-.75-1.5-.75-3.71c0-3.47 2.01-6.06 4.51-6.06 2.13 0 3.16 1.6 3.16 3.51 0 2.14-1.36 5.34-2.06 8.3-.59 2.49 1.25 4.52 3.71 4.52 4.45 0 7.46-5.73 7.46-12.49 0-5.15-3.47-9.01-9.77-9.01-7.13 0-11.59 5.33-11.59 11.27 0 2.05.6 3.49 1.54 4.6.43.51.49.71.33 1.29-.11.42-.37 1.47-.48 1.88-.15.59-.62.8-1.14.58-3.17-1.29-4.64-4.76-4.64-8.66 0-6.43 5.42-14.16 16.14-14.16 8.6 0 14.26 6.2 14.26 12.88 0 8.83-4.92 15.46-12.15 15.46-2.44 0-4.73-1.32-5.52-2.82 0 0-1.31 5.21-1.59 6.15-.48 1.62-1.42 3.25-2.35 4.61A12 12 0 1012 0z"/>
            </svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition">
            <Instagram size={20} />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition">
            <Youtube size={20} />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition">
            <Music size={20} />
          </a>
        </div>

        {/* App Download Buttons */}
        <div className="flex items-center justify-center gap-4 py-6 border-t border-slate-700">
          <a href="#" className="hover:opacity-80 transition">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-10" />
          </a>
          <a href="#" className="hover:opacity-80 transition">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-10" />
          </a>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-700 text-xs text-slate-400">
          <p>© 1997-2025 Overglow-Trip, Inc.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/terms" className="hover:text-white transition">Terms & Conditions</Link>
            <Link to="/how-it-works" className="hover:text-white transition">How Overglow-Trip works</Link>
            <Link to="/cookie-consent" className="hover:text-white transition">Cookie Consent</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
