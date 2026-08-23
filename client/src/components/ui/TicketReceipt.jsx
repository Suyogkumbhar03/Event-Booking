import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaQrcode, FaDownload, FaStamp, FaExternalLinkAlt } from 'react-icons/fa';

const TicketReceipt = ({ booking, onCloseModal }) => {
  const navigate = useNavigate();

  if (!booking) return null;

  const eventObj = booking.event || booking.eventId || {};
  const status = booking.paymentStatus || booking.status || 'Paid';
  const _id = booking._id || booking.bookingRef || '9042X';
  const bookingRef = booking.bookingRef || `EVT-2026-${String(_id).substring(0, 6).toUpperCase()}`;
  const tier = booking.tier || 'Standard Entry';
  const amount = booking.totalPrice !== undefined ? booking.totalPrice : (booking.amount || eventObj.ticketPrice || 0);
  const attendeeName = booking.user?.name || booking.guestInfo?.name || booking.userName || 'Verified Holder';

  const isConfirmed = status === 'confirmed' || status === 'Paid';
  const isCancelled = status === 'cancelled' || status === 'Refunded';

  const rawDate = eventObj.date ? new Date(eventObj.date) : new Date();
  const formattedDate = isNaN(rawDate.getTime()) ? 'UPCOMING GAZETTE ASSEMBLY' : rawDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

  const handleDownload = () => {
    window.print();
  };

  const handleGoToDashboard = () => {
    if (onCloseModal) onCloseModal();
    navigate('/dashboard');
  };

  return (
    <div className="w-full font-sans max-w-sm sm:max-w-md mx-auto print:max-w-none">
      <div className="bg-white border border-[#DCD7CE] shadow-sm relative overflow-hidden text-[#141413]">
        
        {/* Watermark Seal */}
        <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none transform -rotate-12 print:hidden">
          <div className="w-36 h-36 rounded-full border-4 border-[#C84B31] flex items-center justify-center font-mono font-bold text-[#C84B31] text-[10px] tracking-widest text-center p-2">
            OFFICIAL TICKET RECEIPT
          </div>
        </div>

        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCD7CE] relative space-y-2">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-[#C84B31] font-bold tracking-wider uppercase flex items-center gap-1">
              <FaStamp className="text-[#C84B31]" />
              {bookingRef}
            </span>
            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
              isConfirmed 
                ? 'bg-[#FBE9E5] text-[#C84B31] border-[#F3C5BC]' 
                : isCancelled 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : 'bg-yellow-50 text-yellow-800 border-yellow-300'
            }`}>
              {status}
            </span>
          </div>

          <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#141413] leading-snug truncate">
            {eventObj.title || 'Official Event Pass'}
          </h3>

          <div className="space-y-1 font-mono text-[11px] text-[#52504A]">
            <div className="flex items-center gap-1.5 truncate">
              <FaMapMarkerAlt className="text-[#C84B31] shrink-0 text-xs" />
              <span className="text-[#141413] truncate">{eventObj.venue?.name || eventObj.location || 'Exhibition Venue'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FaCalendarAlt className="text-[#C84B31] shrink-0 text-xs" />
              <span className="text-[#141413]">{formattedDate} • {eventObj.time || '20:00'}</span>
            </div>
          </div>
        </div>

        {/* Perforated Divider */}
        <div className="py-1 my-0.5 relative px-2">
          <div className="dashed-ink-divider h-[1px] w-full border-t border-dashed border-[#B8B2A6]"></div>
        </div>

        {/* Details Section */}
        <div className="p-4 sm:p-5 bg-[#F9F7F2]/60 space-y-4">
          <div className="grid grid-cols-2 gap-3 font-mono text-xs border-b border-[#DCD7CE] pb-3">
            <div>
              <span className="text-[#52504A] uppercase block text-[9px] font-bold">Tier</span>
              <span className="font-bold text-[#C84B31] uppercase text-xs truncate block">
                {tier}
              </span>
            </div>
            <div>
              <span className="text-[#52504A] uppercase block text-[9px] font-bold">Price</span>
              <span className="font-bold text-[#141413] uppercase text-xs">
                {amount === 0 ? 'FREE' : `$${amount}`}
              </span>
            </div>
            <div>
              <span className="text-[#52504A] uppercase block text-[9px] font-bold">Attendee</span>
              <span className="font-sans font-bold text-[#141413] text-xs truncate block">
                {attendeeName}
              </span>
            </div>
            <div>
              <span className="text-[#52504A] uppercase block text-[9px] font-bold">Status</span>
              <span className="font-mono font-bold text-[#C84B31] text-[10px]">VALID TICKET</span>
            </div>
          </div>

          {/* Barcode & QR Code */}
          <div className="bg-white p-2.5 border border-[#DCD7CE] flex items-center justify-between gap-2">
            <div className="flex flex-col items-start font-mono overflow-hidden">
              <div className="flex gap-1 h-6 items-center">
                <div className="w-1 h-full bg-[#141413]"></div>
                <div className="w-2 h-full bg-[#141413]"></div>
                <div className="w-0.5 h-full bg-[#141413]"></div>
                <div className="w-1.5 h-full bg-[#141413]"></div>
                <div className="w-1 h-full bg-[#141413]"></div>
                <div className="w-2.5 h-full bg-[#141413]"></div>
                <div className="w-0.5 h-full bg-[#141413]"></div>
                <div className="w-1.5 h-full bg-[#141413]"></div>
                <div className="w-2 h-full bg-[#141413]"></div>
              </div>
              <span className="text-[9px] tracking-widest text-[#141413] font-bold mt-1 truncate">{bookingRef}</span>
            </div>

            <div className="w-9 h-9 bg-[#F9F7F2] p-1 border border-[#DCD7CE] flex items-center justify-center shrink-0">
              <FaQrcode className="w-full h-full text-[#141413]" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 print:hidden">
            <button 
              type="button"
              onClick={handleGoToDashboard}
              className="flex items-center justify-center gap-1 py-2 px-2.5 bg-[#141413] hover:bg-[#C84B31] text-white text-[11px] font-mono font-bold uppercase transition"
            >
              <FaExternalLinkAlt className="text-[9px]" /> Dashboard
            </button>
            <button 
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-1 py-2 px-2.5 bg-white hover:bg-[#EFEAE1] text-[#141413] text-[11px] font-mono font-bold border border-[#DCD7CE] uppercase transition"
            >
              <FaDownload className="text-[#C84B31] text-[9px]" /> Download
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketReceipt;
