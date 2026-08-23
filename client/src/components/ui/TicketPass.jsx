import React from 'react';
import { FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaQrcode, FaBarcode, FaShareAlt, FaDownload } from 'react-icons/fa';

const TicketPass = ({ booking }) => {
  if (!booking || !booking.eventId) return null;

  const { eventId, status, paymentStatus, bookedAt, _id } = booking;
  const refId = `EVT-${(_id || '9042X').substring(0, 8).toUpperCase()}`;

  const isConfirmed = status === 'confirmed';
  const isCancelled = status === 'cancelled';

  return (
    <div className="w-full max-w-md mx-auto my-6 font-sans">
      <div className="bg-eventora-surface border border-eventora-border rounded-2xl overflow-hidden shadow-2xl transition hover:border-eventora-accent/40">
        
        {/* Top Ticket Header Section */}
        <div className="p-6 relative bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex justify-between items-start mb-4">
            <span className="font-mono text-xs tracking-widest text-eventora-muted uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-eventora-accent animate-pulse"></span>
              PASS // {refId}
            </span>
            <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
              isConfirmed 
                ? 'bg-eventora-accent/10 text-eventora-accent border-eventora-accent/30' 
                : isCancelled 
                  ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
            }`}>
              {status}
            </span>
          </div>

          <h3 className="font-display text-2xl font-bold text-white mb-2 leading-tight">
            {eventId.title}
          </h3>

          <div className="space-y-2 mt-4 font-mono text-xs text-eventora-muted">
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-eventora-accent" />
              <span className="text-gray-300">{eventId.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-eventora-accent" />
              <span className="text-gray-300">
                {new Date(eventId.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Perforated Divider Line with Cutout Notches */}
        <div className="ticket-perforation py-2 my-1 relative">
          <div className="dashed-divider h-[2px] w-full"></div>
        </div>

        {/* Bottom Ticket Details & Barcode Section */}
        <div className="p-6 bg-eventora-black/50">
          <div className="grid grid-cols-2 gap-4 mb-6 font-mono text-xs">
            <div>
              <span className="text-eventora-muted uppercase block text-[10px]">Tier</span>
              <span className="font-bold text-eventora-accent uppercase">
                {booking.tier || 'VIP ALL ACCESS'}
              </span>
            </div>
            <div>
              <span className="text-eventora-muted uppercase block text-[10px]">Payment</span>
              <span className="font-bold text-gray-200 uppercase">
                {paymentStatus ? paymentStatus.replace('_', ' ') : 'PAID'}
              </span>
            </div>
            <div>
              <span className="text-eventora-muted uppercase block text-[10px]">Attendee</span>
              <span className="font-medium text-white truncate block">
                {booking.userName || 'Verified Holder'}
              </span>
            </div>
            <div>
              <span className="text-eventora-muted uppercase block text-[10px]">Check-in</span>
              <span className="font-medium text-eventora-accent">VALID PASS</span>
            </div>
          </div>

          {/* SVG Barcode & QR Code Section */}
          <div className="bg-eventora-surface p-4 rounded-xl border border-eventora-border flex items-center justify-between">
            <div className="flex flex-col items-start font-mono">
              <div className="flex gap-1 h-8 items-center opacity-80">
                <div className="w-1 h-full bg-white"></div>
                <div className="w-2 h-full bg-white"></div>
                <div className="w-0.5 h-full bg-white"></div>
                <div className="w-1.5 h-full bg-white"></div>
                <div className="w-1 h-full bg-white"></div>
                <div className="w-2.5 h-full bg-white"></div>
                <div className="w-0.5 h-full bg-white"></div>
                <div className="w-1.5 h-full bg-white"></div>
                <div className="w-2 h-full bg-white"></div>
              </div>
              <span className="text-[10px] tracking-widest text-eventora-muted mt-1">{refId}</span>
            </div>

            <div className="w-12 h-12 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
              <FaQrcode className="w-full h-full text-eventora-black" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <button 
              onClick={() => alert(`Saved Pass ${refId}`)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-eventora-surface hover:bg-eventora-border text-eventora-light text-xs font-mono border border-eventora-border transition"
            >
              <FaDownload className="text-eventora-accent text-[10px]" /> Save
            </button>
            <button 
              onClick={() => alert('Added to Calendar')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-eventora-surface hover:bg-eventora-border text-eventora-light text-xs font-mono border border-eventora-border transition"
            >
              <FaCalendarAlt className="text-eventora-accent text-[10px]" /> Calendar
            </button>
            <button 
              onClick={() => alert('Transfer pass option requested')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-eventora-surface hover:bg-eventora-border text-eventora-light text-xs font-mono border border-eventora-border transition"
            >
              <FaShareAlt className="text-eventora-accent text-[10px]" /> Transfer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketPass;
