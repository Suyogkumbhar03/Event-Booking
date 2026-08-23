import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { SAMPLE_EVENTS } from '../constants/sampleEvents';
import EventCard from '../components/events/EventCard';
import { FaSearch, FaArrowRight, FaQuoteLeft } from 'react-icons/fa';

const CATEGORIES = [
  'All Assemblies',
  'Classical & Orchestral',
  'Exhibition & Summit',
  'Underground Club',
  'Workshop',
  'Comedy',
  'Gastronomy'
];

const Home = () => {
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Assemblies');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [search, selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const queryCategory = selectedCategory === 'All Assemblies' ? '' : selectedCategory;
      const { data } = await api.get(`/events?search=${search}&category=${encodeURIComponent(queryCategory)}`);
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
      } else {
        let filtered = SAMPLE_EVENTS;
        if (selectedCategory !== 'All Assemblies') {
          filtered = filtered.filter(e => e.category === selectedCategory);
        }
        if (search) {
          filtered = filtered.filter(e => 
            e.title.toLowerCase().includes(search.toLowerCase()) || 
            e.location.toLowerCase().includes(search.toLowerCase())
          );
        }
        setEvents(filtered);
      }
    } catch (error) {
      console.warn('API offline or failed, using editorial sample dataset:', error);
      let filtered = SAMPLE_EVENTS;
      if (selectedCategory !== 'All Assemblies') {
        filtered = filtered.filter(e => e.category === selectedCategory);
      }
      if (search) {
        filtered = filtered.filter(e => 
          e.title.toLowerCase().includes(search.toLowerCase()) || 
          e.location.toLowerCase().includes(search.toLowerCase())
        );
      }
      setEvents(filtered);
    } finally {
      setLoading(false);
    }
  };

  const spotlightEvent = events.length > 0 ? events[0] : SAMPLE_EVENTS[0];

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Header */}
      <section className="border-b border-[#DCD7CE] pb-12 pt-4">
        <div className="max-w-4xl space-y-6">
          <div className="inline-block bg-[#FBE9E5] text-[#C84B31] border border-[#F3C5BC] font-mono text-xs font-bold px-3.5 py-1 uppercase tracking-widest">
            EXPLORE EVENTS & EXPERIENCES
          </div>

          <h1 className="font-serif font-normal text-4xl sm:text-6xl md:text-7xl text-[#141413] leading-[1.15] tracking-tight">
            Find and Book <br />
            <span className="italic font-serif text-[#C84B31]">Live Events</span> & Experiences.
          </h1>

          <p className="font-sans text-[#52504A] text-base md:text-lg max-w-2xl leading-relaxed">
            Discover live concerts, art exhibitions, tech summits, workshops, and comedy shows.
          </p>

          {/* Search Box */}
          <div className="relative max-w-xl pt-2">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C887B] text-sm" />
            <input
              type="text"
              placeholder="Search events by title, city, or category..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#DCD7CE] text-[#141413] placeholder-[#8C887B] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none font-sans text-sm shadow-sm transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Curated Split Spotlight Banner */}
      {spotlightEvent && (
        <section className="bg-white border border-[#DCD7CE] shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            
            {/* Spotlight Editorial Image */}
            <div className="lg:col-span-7 h-80 lg:h-auto overflow-hidden relative border-b lg:border-b-0 lg:border-r border-[#DCD7CE]">
              <img 
                src={spotlightEvent.image || spotlightEvent.bannerImage} 
                alt={spotlightEvent.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-[#DCD7CE] px-3.5 py-1 font-mono text-xs text-[#C84B31] font-bold uppercase shadow-sm">
                FEATURED EVENT
              </div>
            </div>

            {/* Spotlight Quote & Details */}
            <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="font-mono text-xs text-[#C84B31] font-bold uppercase tracking-wider">
                  {spotlightEvent.category} • {spotlightEvent.location}
                </div>

                <h2 className="font-serif font-bold text-3xl text-[#141413] leading-tight">
                  {spotlightEvent.title}
                </h2>

                <div className="border-l-2 border-[#C84B31] pl-4 text-[#52504A] italic font-serif text-sm leading-relaxed">
                  <FaQuoteLeft className="text-[#C84B31]/40 text-xs mb-1 inline mr-2" />
                  "{spotlightEvent.description.substring(0, 140)}..."
                </div>
              </div>

              <div className="pt-6 border-t border-[#DCD7CE] flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-[#52504A] block text-[10px] uppercase font-bold">TICKET PRICE</span>
                  <span className="font-sans font-bold text-[#141413] text-base">
                    From ${spotlightEvent.ticketPrice || 30}
                  </span>
                </div>

                <Link
                  to={`/events/${spotlightEvent._id}`}
                  className="py-3 px-6 bg-[#141413] hover:bg-[#C84B31] text-white font-sans font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 border border-[#141413]"
                >
                  Book Ticket <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Editorial Category Pill Filters */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DCD7CE] pb-4">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 text-xs font-sans font-semibold uppercase tracking-wider border transition ${
                  selectedCategory === cat
                    ? 'bg-[#EFEAE1] text-[#141413] border-[#141413] font-bold shadow-xs'
                    : 'bg-white text-[#52504A] border-[#DCD7CE] hover:border-[#141413] hover:text-[#141413]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Index Count */}
        <div className="flex justify-between items-center font-mono text-xs text-[#52504A]">
          <span>UPCOMING EVENTS // {events.length} Events</span>
          <span>AVAILABLE TICKETS</span>
        </div>
      </div>

      {/* Catalog Grid View */}
      {loading ? (
        <div className="py-24 text-center font-mono text-[#52504A] text-xs tracking-widest uppercase">
          // ACCESSING PRINT ARCHIVES...
        </div>
      ) : events.length === 0 ? (
        <div className="py-24 text-center bg-white border border-[#DCD7CE] p-12">
          <p className="font-serif text-2xl font-bold text-[#141413] mb-2">No Assemblies Found</p>
          <p className="font-sans text-xs text-[#52504A]">Try adjusting search parameters or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((evt) => (
            <EventCard key={evt._id} event={evt} />
          ))}
        </div>
      )}

    </div>
  );
};

export default Home;
