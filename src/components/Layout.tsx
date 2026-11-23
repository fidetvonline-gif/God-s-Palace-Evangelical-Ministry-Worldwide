import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { churchConfig } from '../data/churchConfig';
import { buildGoogleMapsUrl, buildWhatsAppUrl } from '../utils/churchLogic';
import { ChurchLogo } from './ChurchLogo';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About Us' },
  { to: '/leadership', label: 'Leadership' },
  { to: '/services', label: 'Services' },
  { to: '/ministries', label: 'Ministries' },
  { to: '/activities', label: 'Activities' },
  { to: '/prayer', label: 'Prayer' },
  { to: '/contact', label: 'Contact' },
];

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const whatsAppHref = buildWhatsAppUrl(
    churchConfig.contact.whatsappNumber,
    churchConfig.contact.whatsappPrefill,
  );
  const mapsHref = buildGoogleMapsUrl(churchConfig.contact.fullAddress);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#18181B]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#1B365D] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
      >
        Skip to content
      </a>

      {/* Sticky 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E5E0D8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[#18181B] whitespace-nowrap shrink-0 group"
          >
            <ChurchLogo className="w-6 h-6 text-[#1B365D] transition-transform duration-150 group-hover:scale-105" />
            <span className="font-serif text-base sm:text-lg font-semibold tracking-tight">
              <span className="hidden xl:inline">{churchConfig.identity.headerName}</span>
              <span className="xl:hidden">{churchConfig.identity.shortName}</span>
            </span>
          </Link>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-5 text-sm font-medium text-[#52525B]"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
                    isActive
                      ? 'text-[#1B365D] border-[#1B365D]'
                      : 'border-transparent hover:text-[#18181B] hover:border-[#D6D0C4]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Single Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/visit"
              className="hidden sm:inline-flex items-center px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap shrink-0"
            >
              Plan Your Visit
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E5E0D8] bg-white text-[#18181B] hover:bg-[#F2EFE9] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile Navigation"
            className="lg:hidden border-t border-[#E5E0D8] bg-white px-5 py-5 space-y-1"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F2EFE9] text-[#1B365D]'
                      : 'text-[#3F3F46] hover:bg-[#FAF9F6]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-4 mt-3 border-t border-[#E5E0D8] flex flex-col gap-2.5">
              <Link
                to="/visit"
                className="w-full text-center px-4 py-3 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors"
              >
                Plan Your Visit
              </Link>
              <Link
                to="/prayer"
                className="w-full text-center px-4 py-3 text-sm font-medium text-[#1B365D] border border-[#E5E0D8] rounded-lg hover:bg-[#F2EFE9] transition-colors"
              >
                Submit a Prayer Request
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E5E0D8] bg-[#F2EFE9] text-[#3F3F46]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5 text-[#18181B]">
                <ChurchLogo className="w-6 h-6 text-[#1B365D]" />
                <span className="font-serif text-xl font-semibold">
                  {churchConfig.identity.name}
                </span>
              </div>
              <p className="text-sm text-[#52525B] leading-relaxed max-w-md">
                {churchConfig.identity.welcomeSubtext}
              </p>
              <div className="pt-2 space-y-2 text-sm">
                <p className="flex items-start gap-2.5">
                  <MapPin
                    className="w-4 h-4 text-[#1B365D] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#1B365D] underline decoration-[#D6D0C4] underline-offset-4"
                  >
                    {churchConfig.contact.fullAddress}
                  </a>
                </p>
                <p className="flex items-center gap-2.5 tabular-nums">
                  <Phone className="w-4 h-4 text-[#1B365D] shrink-0" aria-hidden="true" />
                  <a
                    href={`tel:${churchConfig.contact.phone.replace(/[^\d+]/g, '')}`}
                    className="hover:text-[#1B365D]"
                  >
                    {churchConfig.contact.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#1B365D] shrink-0" aria-hidden="true" />
                  <a
                    href={`mailto:${churchConfig.contact.email}`}
                    className="hover:text-[#1B365D]"
                  >
                    {churchConfig.contact.email}
                  </a>
                </p>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#8B6F47]">
                Explore
              </h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="hover:text-[#1B365D] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/leadership" className="hover:text-[#1B365D] transition-colors">
                    Leadership
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-[#1B365D] transition-colors">
                    Service Schedule
                  </Link>
                </li>
                <li>
                  <Link to="/ministries" className="hover:text-[#1B365D] transition-colors">
                    Ministries &amp; Departments
                  </Link>
                </li>
                <li>
                  <Link to="/activities" className="hover:text-[#1B365D] transition-colors">
                    Church Activities
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#8B6F47]">
                Connect &amp; Gather
              </h2>
              <p className="text-sm text-[#52525B] tabular-nums">
                {churchConfig.contact.sundaySummary}
                <br />
                {churchConfig.contact.officeHours}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/visit"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1B365D] rounded-lg hover:bg-[#132744] transition-colors whitespace-nowrap"
                >
                  Plan Your Visit
                </Link>
                <Link
                  to="/prayer"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#18181B] bg-white border border-[#D6D0C4] rounded-lg hover:bg-[#FAF9F6] transition-colors whitespace-nowrap"
                >
                  Prayer Request
                </Link>
              </div>
              <div className="pt-3 flex flex-wrap items-center gap-4 text-sm">
                <a
                  href={whatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-[#14532D] hover:underline"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  WhatsApp
                </a>
                {churchConfig.contact.socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#52525B] hover:text-[#1B365D] transition-colors"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-[#DFD9CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#71717A]">
            <p>
              &copy; {new Date().getFullYear()} {churchConfig.identity.name}. All rights
              reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/visit" className="hover:text-[#18181B]">
                First-Time Visitors
              </Link>
              <span aria-hidden="true">&middot;</span>
              <Link to="/prayer" className="hover:text-[#18181B]">
                Confidential Prayer
              </Link>
              <span aria-hidden="true">&middot;</span>
              <Link to="/contact" className="hover:text-[#18181B]">
                Contact Office
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
