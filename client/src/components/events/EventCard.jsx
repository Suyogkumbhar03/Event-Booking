import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';

const EventCard = ({ event }) => {
  if (!event) return null;

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit'
  }).toUpperCase();
  
  const city = event.venue?.city || (event.location ? event.location.split(',')[1]?.trim() || event.location : 'GLOBAL');
  const dateTag = `${formattedDate} • ${city.toUpperCase()}`;

  let lowestPrice = event.ticketPrice || 0;
  if (Array.isArray(event.ticketTiers) && event.ticketTiers.length > 0) {
    lowestPrice = Math.min(...event.ticketTiers.map(t => t.price));
  }

  let availableSeats = event.availableSeats;
  if (availableSeats === undefined && Array.isArray(event.ticketTiers)) {
    availableSeats = event.ticketTiers.reduce((acc, t) => acc + (t.availableSeats || 0), 0);
  }

  return (
    <article className="group bg-white border border-[#DCD7CE] shadow-sm hover:border-[#141413] transition-all duration-300 rounded-none overflow-hidden flex flex-col h-full">
      {/* Top Date & Location Tag */}
      <div className="px-6 pt-5 pb-3 border-b border-[#DCD7CE] flex justify-between items-center font-mono text-xs">
        <span className="text-[#C84B31] font-bold tracking-widest uppercase">
          {dateTag}
        </span>
        <span className="text-[#52504A] font-sans text-xs uppercase tracking-wider font-semibold">
          {event.category}
        </span>
      </div>

      {/* Image Frame */}
      <div className="h-56 overflow-hidden relative bg-[#EFEAE1] border-b border-[#DCD7CE]">
        {event.image || event.bannerImage ? (
          <img 
            src={event.image || event.bannerImage} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-serif text-2xl text-[#52504A] font-bold tracking-wider uppercase">
            {event.category}
          </div>
        )}
      </div>

      {/* Editorial Content */}
      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-serif font-bold text-xl md:text-2xl text-[#141413] group-hover:text-[#C84B31] leading-snug transition-colors mb-2">
            <Link to={`/events/${event._id}`}>
              {event.title}
            </Link>
          </h3>
          <p className="font-sans text-xs text-[#52504A] line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Bottom Metadata & Price Pill */}
        <div className="pt-4 border-t border-[#DCD7CE] flex items-center justify-between font-mono text-xs">
          <div className="font-semibold text-xs">
            {availableSeats !== undefined && availableSeats <= 10 ? (
              <span className="bg-[#FBE9E5] text-[#C84B31] px-2.5 py-1 font-bold border border-[#F3C5BC]">
                Only {availableSeats} seats left
              </span>
            ) : (
              <span className="bg-[#EFEAE1] text-[#141413] px-2.5 py-1 font-medium border border-[#DCD7CE]">
                {availableSeats} seats left
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-[#141413] text-sm">
              {lowestPrice === 0 ? 'Free' : `From $${lowestPrice}`}
            </span>
            <Link 
              to={`/events/${event._id}`}
              className="w-8 h-8 rounded-none border border-[#DCD7CE] text-[#141413] group-hover:border-[#C84B31] group-hover:bg-[#C84B31] group-hover:text-white flex items-center justify-center transition"
              title="Reserve Ticket"
            >
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
