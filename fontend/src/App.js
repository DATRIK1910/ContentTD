import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import ContentCreationPage from './components/ContentPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FlexibleWriting from './components/Viet-bai-linh-hoat';


import Home from './components/Homes';

import ContactPage from './components/ContactPage';
import RewritePage from './components/RewritePage';

import AdminDashboard from "./components/AdminDashboard";
import Register from './components/Register';
import Login from './components/Login';
import HistoryPage from './components/HistoryPage';
import Introduction from './components/GioiThieu';
import NewsPage from './components/NewsPage';
import NewsDetail from './components/NewsDetail';

import SummarizeText from './components/tom-tat-van-ban';
import BuyDiamondsPage from "./components/BuyDiamondsPage";
import KeywordSuggestionStandalone from "./components/KeywordSuggestionStandalone";
import EmailGenerator from './components/EmailGenerator';
import PaymentHistory from './components/PaymentHistory';
function App() {
  return (
    <Router>
      <Navbar />

      <Routes>





        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login/user" element={<Login />} />

        <Route path="/gioithieu" element={<Introduction />} />
        <Route path="/tintuc" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/content-page" element={<ContentCreationPage />} />
        <Route path="/viet-bai-linh-hoat" element={<FlexibleWriting />} />

        <Route path="/history" element={<HistoryPage />} />
        <Route path="/rewrite-text" element={<RewritePage />} />

        <Route path="/tomtatvanban" element={<SummarizeText />} />

        <Route path="/buy-diamonds" element={<BuyDiamondsPage />} />
        <Route path="/suggest-keywords" element={<KeywordSuggestionStandalone />} />
        <Route path="/email-generator" element={<EmailGenerator />} />
        <Route path="/payment-history" element={<PaymentHistory />} />






      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
