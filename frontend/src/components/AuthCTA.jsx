import React from 'react';
import { Link } from 'react-router-dom';

const AuthCTA = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-purple-50 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto border border-purple-100 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Log in to manage bookings & Overglow Rewards
          </h2>
          <p className="text-gray-600 mb-8">
            Don't have an account yet? <Link to="/register" className="text-green-700 font-semibold hover:underline">Sign up</Link>
          </p>
          <Link 
            to="/login" 
            className="inline-block bg-black text-white font-bold py-3 px-8 rounded-full hover:bg-gray-800 transition shadow-lg"
          >
            Log In
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AuthCTA;
