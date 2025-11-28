import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import ScrollToTopButton from '../components/ScrollToTopButton';
import { Link } from 'react-router-dom';

const MyInquiryCard = ({ inquiry }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Link to={`/products/${inquiry.product?._id}`}>
            <h3 className="font-bold text-lg text-gray-900 mb-1 hover:text-primary-600">
              {inquiry.product?.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600">
            Opérateur: {inquiry.operator?.companyName || 'N/A'}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          inquiry.type === 'manual' 
            ? (inquiry.answer ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')
            : (inquiry.status === 'approved' ? 'bg-green-100 text-green-800' : 
               inquiry.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')
        }`}>
          {inquiry.type === 'manual' 
            ? (inquiry.answer ? 'Répondu' : 'En attente')
            : inquiry.status}
        </span>
      </div>

      {inquiry.type === 'manual' && inquiry.question && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Votre question:</p>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{inquiry.question}</p>
        </div>
      )}

      {inquiry.type === 'manual' && inquiry.answer && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Réponse:</p>
          <p className="text-gray-700 bg-green-50 p-3 rounded-lg">{inquiry.answer}</p>
        </div>
      )}

      {inquiry.type === 'automatic' && inquiry.status === 'approved' && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <CheckCircle size={16} className="inline mr-2 text-green-700" />
          <span className="text-green-700 font-semibold">Votre demande a été approuvée</span>
        </div>
      )}

      {inquiry.type === 'automatic' && inquiry.status === 'rejected' && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <XCircle size={16} className="inline mr-2 text-red-700" />
          <span className="text-red-700 font-semibold">Votre demande a été rejetée</span>
          {inquiry.rejectionReason && (
            <p className="text-red-600 text-sm mt-1">Raison: {inquiry.rejectionReason}</p>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t text-xs text-gray-500">
        <Clock size={12} className="inline mr-1" />
        {new Date(inquiry.createdAt).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
};

const MyInquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const { data } = await axios.get('/api/inquiries/my-inquiries');
        setInquiries(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch inquiries:', error);
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes inquiries</h1>

      {inquiries.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune inquiry</h2>
          <p className="text-gray-600">Vos inquiries apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <MyInquiryCard key={inquiry._id} inquiry={inquiry} />
          ))}
        </div>
      )}

      <ScrollToTopButton />
    </div>
  );
};

export default MyInquiriesPage;

