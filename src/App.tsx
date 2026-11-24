import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { LeadershipPage } from './pages/LeadershipPage';
import { ServicesPage } from './pages/ServicesPage';
import { MinistriesPage } from './pages/MinistriesPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { VideosPage } from './pages/VideosPage';
import { VisitPage } from './pages/VisitPage';
import { RegisterPage } from './pages/RegisterPage';
import { PrayerPage } from './pages/PrayerPage';
import { ContactPage } from './pages/ContactPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="leadership" element={<LeadershipPage />} />
          <Route path="general-overseer" element={<LeadershipPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="ministries" element={<MinistriesPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="videos" element={<VideosPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="visit" element={<VisitPage />} />
          <Route path="prayer" element={<PrayerPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
