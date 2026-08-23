import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaSearch, FaFilter, FaCheckCircle, FaHourglassHalf, FaTicketAlt,
  FaCalendarAlt, FaDollarSign, FaUserCheck, FaLayerGroup, FaPlusCircle,
  FaExclamationTriangle, FaTimes, FaSync, FaTrash
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // State Management
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTicketsSold: 0,
    activeEventsCount: 0,
    totalAttendees: 0,
    checkInRate: 0,
    recentSales: []
  });

  const [bookings, setBookings] = useState([]);
  const [eventsSummary, setEventsSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '19:30',
    category: 'Cultural Assembly',
    venueName: '',
    venueCity: 'Vienna',
    totalSeats: 150,
    ticketPrice: 45,
    bannerImage: ''
  });

  // Current Timestamp for Masthead
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      const storedToken = token || localStorage.getItem('token');
      const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};

      const [statsRes, bookingsRes, summaryRes] = await Promise.all([
        api.get('/admin/stats', { headers }),
        api.get('/admin/bookings', { headers }),
        api.get('/admin/events-summary', { headers })
      ]);

      if (statsRes.data.success) {
        setStats({
          totalRevenue: statsRes.data.totalRevenue || 0,
          totalTicketsSold: statsRes.data.totalTicketsSold || 0,
          activeEventsCount: statsRes.data.activeEventsCount || 0,
          totalAttendees: statsRes.data.totalAttendees || 0,
          checkInRate: statsRes.data.checkInRate || 0,
          recentSales: statsRes.data.recentSales || []
        });
      }

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings || []);
      }

      if (summaryRes.data.success) {
        setEventsSummary(summaryRes.data.events || []);
      }
    } catch (err) {
      console.error('Error fetching admin ledger data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Door Check-in Toggle Trigger
  const handleToggleCheckIn = async (bookingRef, currentStatus) => {
    try {
      const storedToken = token || localStorage.getItem('token');
      const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};

      const { data } = await api.patch(
        `/admin/bookings/${bookingRef}/check-in`,
        { checkInStatus: !currentStatus },
        { headers }
      );

      if (data.success) {
        // Update local state immediately
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingRef === bookingRef ? { ...b, checkInStatus: !currentStatus } : b
          )
        );
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update check-in status');
    }
  };

  // Create Event Form Handler
  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const storedToken = token || localStorage.getItem('token');
      const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};

      const eventPayload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        bannerImage: formData.bannerImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        venue: {
          name: formData.venueName || 'Main Hall Auditorium',
          city: formData.venueCity || 'Vienna',
          address: 'Cultural District, Plaza 4'
        },
        ticketTiers: [
          {
            name: 'Standard Admission',
            price: Number(formData.ticketPrice) || 0,
            totalSeats: Number(formData.totalSeats) || 100,
            availableSeats: Number(formData.totalSeats) || 100
          }
        ]
      };

      await api.post('/events', eventPayload, { headers });

      setShowEventModal(false);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '19:30',
        category: 'Cultural Assembly',
        venueName: '',
        venueCity: 'Vienna',
        totalSeats: 150,
        ticketPrice: 45,
        bannerImage: ''
      });
      fetchAdminData();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to publish new assembly');
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      const storedToken = token || localStorage.getItem('token');
      const headers = storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
      await api.delete(`/events/${eventId}`, { headers });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const attendeeName = (b.user?.name || b.guestInfo?.name || '').toLowerCase();
    const attendeeEmail = (b.user?.email || b.guestInfo?.email || '').toLowerCase();
    const ref = (b.bookingRef || '').toLowerCase();
    const eventTitle = (b.event?.title || '').toLowerCase();
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !search ||
      attendeeName.includes(search) ||
      attendeeEmail.includes(search) ||
      ref.includes(search) ||
      eventTitle.includes(search);

    const matchesEvent = !eventFilter || (b.event?._id === eventFilter || b.event?.title === eventFilter);
    const matchesTier = !tierFilter || b.tier === tierFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'checked-in' && b.checkInStatus) ||
      (statusFilter === 'pending' && !b.checkInStatus);

    return matchesSearch && matchesEvent && matchesTier && matchesStatus;
  });

  if (loading) {
    return (
      <div className="py-32 text-center font-mono text-[#52504A] text-xs uppercase tracking-widest">
        // ACCESSING OPERATIONAL LEDGER & AUDIT STAGE...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 font-sans text-[#141413]">
      
      {/* 1. Header Masthead */}
      <div className="bg-white border border-[#DCD7CE] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
        <div className="space-y-1">
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#141413] tracking-tight">
            Admin Dashboard & Sales Overview
          </h1>

          <p className="font-sans text-xs text-[#52504A]">
            Real-time event metrics, attendee list, door check-ins, and event capacity.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchAdminData}
            disabled={refreshing}
            className="p-3 bg-white border border-[#DCD7CE] hover:border-[#141413] text-[#141413] font-mono text-xs transition"
            title="Refresh Data"
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="flex-1 md:flex-initial py-3.5 px-6 bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-sans font-bold text-xs uppercase tracking-wider transition border border-[#C84B31] shadow-xs flex items-center justify-center gap-2"
          >
            <FaPlusCircle className="text-xs" /> CREATE EVENT
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Grid of 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white p-6 border border-[#DCD7CE] shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center font-mono text-[10px] text-[#52504A] font-bold uppercase tracking-wider">
            <span>TOTAL REVENUE</span>
            <span className="text-[#C84B31] bg-[#FBE9E5] px-1.5 py-0.5 border border-[#F3C5BC]">+14.2%</span>
          </div>
          <h3 className="font-serif font-bold text-3xl sm:text-4xl text-[#141413]">
            ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="font-mono text-[11px] text-[#52504A]">
            Confirmed ticket sales
          </p>
        </div>

        {/* Total Tickets Sold */}
        <div className="bg-white p-6 border border-[#DCD7CE] shadow-sm space-y-2">
          <div className="flex justify-between items-center font-mono text-[10px] text-[#52504A] font-bold uppercase tracking-wider">
            <span>TOTAL TICKETS SOLD</span>
            <FaTicketAlt className="text-[#C84B31] text-xs" />
          </div>
          <h3 className="font-serif font-bold text-3xl sm:text-4xl text-[#141413]">
            {stats.totalTicketsSold} <span className="font-sans text-base font-normal text-[#52504A]">Tickets</span>
          </h3>
          <p className="font-mono text-[11px] text-[#52504A]">
            Verified ticket bookings
          </p>
        </div>

        {/* Active Events */}
        <div className="bg-white p-6 border border-[#DCD7CE] shadow-sm space-y-2">
          <div className="flex justify-between items-center font-mono text-[10px] text-[#52504A] font-bold uppercase tracking-wider">
            <span>ACTIVE EVENTS</span>
            <FaLayerGroup className="text-[#C84B31] text-xs" />
          </div>
          <h3 className="font-serif font-bold text-3xl sm:text-4xl text-[#141413]">
            {stats.activeEventsCount} <span className="font-sans text-base font-normal text-[#52504A]">Active Events</span>
          </h3>
          <p className="font-mono text-[11px] text-[#52504A]">
            Published live events
          </p>
        </div>

        {/* Check-in Attendance Rate */}
        <div className="bg-white p-6 border border-[#DCD7CE] shadow-sm space-y-2">
          <div className="flex justify-between items-center font-mono text-[10px] text-[#52504A] font-bold uppercase tracking-wider">
            <span>CHECK-IN ATTENDANCE RATE</span>
            <FaUserCheck className="text-[#C84B31] text-xs" />
          </div>
          <h3 className="font-serif font-bold text-3xl sm:text-4xl text-[#C84B31]">
            {stats.checkInRate}% <span className="font-sans text-base font-normal text-[#52504A]">Checked In</span>
          </h3>
          <p className="font-mono text-[11px] text-[#52504A]">
            Verified door check-ins
          </p>
        </div>

      </div>

      {/* 3. Event Capacity Overview Section */}
      <div className="bg-white border border-[#DCD7CE] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#DCD7CE] pb-4 font-mono">
          <div>
            <span className="text-[10px] text-[#C84B31] font-bold uppercase tracking-widest block">// SEAT ALLOCATION</span>
            <h2 className="font-serif font-bold text-2xl text-[#141413]">Event Capacity Overview</h2>
          </div>
          <span className="text-xs text-[#52504A]">TOTAL EVENTS ({eventsSummary.length})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsSummary.map((evt) => (
            <div key={evt._id} className="bg-[#F9F7F2] border border-[#DCD7CE] p-5 space-y-3 relative shadow-2xs">
              <div className="flex justify-between items-start font-mono text-xs">
                <span className="text-[#C84B31] font-bold text-[10px]">{evt.customId}</span>
                {evt.alertLevel === 'Critical' ? (
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 font-bold text-[9px] uppercase flex items-center gap-1">
                    <FaExclamationTriangle className="text-[10px]" /> CRITICAL CAPACITY
                  </span>
                ) : evt.alertLevel === 'High Demand' ? (
                  <span className="px-2 py-0.5 bg-[#FBE9E5] text-[#C84B31] border border-[#F3C5BC] font-bold text-[9px] uppercase">
                    Only a few seats left! ({evt.remainingSeats} LEFT)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-white text-[#52504A] border border-[#DCD7CE] font-bold text-[9px] uppercase">
                    NORMAL
                  </span>
                )}
              </div>

              <h4 className="font-serif font-bold text-lg text-[#141413] leading-snug truncate">
                {evt.title}
              </h4>

              <div className="font-mono text-xs text-[#52504A] space-y-1">
                <div className="flex justify-between">
                  <span>CAPACITY:</span>
                  <span className="font-bold text-[#141413]">{evt.soldTickets} / {evt.totalCapacity} seats</span>
                </div>
                <div className="w-full bg-[#EFEAE1] h-2.5 border border-[#DCD7CE] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      evt.occupancyPercentage >= 90
                        ? 'bg-red-600'
                        : evt.occupancyPercentage >= 75
                        ? 'bg-[#C84B31]'
                        : 'bg-[#141413]'
                    }`}
                    style={{ width: `${evt.occupancyPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span>OCCUPANCY: {evt.occupancyPercentage}%</span>
                  <span className="text-[#C84B31] font-bold">{evt.remainingSeats} SEATS REMAINING</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DCD7CE] flex justify-between items-center text-xs font-mono">
                <Link
                  to={`/event/${evt._id}`}
                  className="text-[#141413] hover:text-[#C84B31] font-bold text-[11px] underline"
                >
                  View Details
                </Link>

                <button
                  type="button"
                  onClick={() => handleDeleteEvent(evt._id)}
                  className="text-red-600 hover:text-red-800 font-bold text-[10px] flex items-center gap-1 uppercase"
                >
                  <FaTrash className="text-[10px]" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Sales & Attendee Record Table (Attendee List) */}
      <div className="bg-white border border-[#DCD7CE] p-6 sm:p-8 space-y-6 shadow-sm">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#DCD7CE] pb-4 font-mono">
          <div>
            <span className="text-[10px] text-[#C84B31] font-bold uppercase tracking-widest block">// ATTENDEE LIST</span>
            <h2 className="font-serif font-bold text-2xl text-[#141413]">Attendee List & Check-In ({filteredBookings.length})</h2>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <FaSearch className="absolute left-3 top-3.5 text-[#52504A] text-xs" />
              <input
                type="text"
                placeholder="Search name, email, #EVT..."
                className="w-full pl-9 pr-3 py-2 bg-[#F9F7F2] border border-[#DCD7CE] text-xs text-[#141413] placeholder-[#8C887B] focus:border-[#141413] focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Check-In Filter Dropdown */}
            <select
              className="py-2 px-3 bg-[#F9F7F2] border border-[#DCD7CE] text-xs text-[#141413] font-mono focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">ALL ENTRY STATUSES</option>
              <option value="checked-in">CHECKED IN</option>
              <option value="pending">NOT CHECKED IN</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-[#DCD7CE]">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-[#F9F7F2] border-b border-[#DCD7CE] font-mono text-[11px] text-[#52504A] uppercase tracking-wider">
                <th className="p-3.5 border-r border-[#DCD7CE]">BOOKING ID</th>
                <th className="p-3.5 border-r border-[#DCD7CE]">ATTENDEE</th>
                <th className="p-3.5 border-r border-[#DCD7CE]">EVENT & TIER</th>
                <th className="p-3.5 border-r border-[#DCD7CE]">QTY & TOTAL</th>
                <th className="p-3.5 border-r border-[#DCD7CE]">PURCHASE DATE</th>
                <th className="p-3.5 text-center">ENTRY STATUS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#DCD7CE]">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center font-mono text-xs text-[#52504A]">
                    No attendee records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const attendeeName = b.user?.name || b.guestInfo?.name || 'Verified Attendee';
                  const attendeeEmail = b.user?.email || b.guestInfo?.email || 'N/A';
                  const eventTitle = b.event?.title || 'Gazette Event Assembly';
                  const createdDate = new Date(b.createdAt);
                  const formattedTimestamp = isNaN(createdDate.getTime())
                    ? 'N/A'
                    : createdDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                  return (
                    <tr key={b._id} className="hover:bg-[#F9F7F2] transition">
                      
                      {/* Booking ID */}
                      <td className="p-3.5 font-mono text-xs font-bold text-[#C84B31] border-r border-[#DCD7CE]">
                        {b.bookingRef || 'EVT-STUB'}
                      </td>

                      {/* Attendee Info */}
                      <td className="p-3.5 border-r border-[#DCD7CE]">
                        <div className="font-bold text-[#141413]">{attendeeName}</div>
                        <div className="font-mono text-[10px] text-[#52504A]">{attendeeEmail}</div>
                      </td>

                      {/* Event & Tier */}
                      <td className="p-3.5 border-r border-[#DCD7CE]">
                        <div className="font-serif font-bold text-sm text-[#141413] truncate max-w-xs">{eventTitle}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#FBE9E5] text-[#C84B31] font-mono text-[9px] font-bold border border-[#F3C5BC] uppercase">
                          {b.tier || 'Standard Entry'}
                        </span>
                      </td>

                      {/* Quantity & Total */}
                      <td className="p-3.5 font-mono text-xs border-r border-[#DCD7CE]">
                        <span className="font-bold text-[#141413]">{b.quantity || 1}x</span> • <span className="text-[#C84B31] font-bold">${b.totalPrice}</span>
                      </td>

                      {/* Date Timestamp */}
                      <td className="p-3.5 font-mono text-[11px] text-[#52504A] border-r border-[#DCD7CE]">
                        {formattedTimestamp}
                      </td>

                      {/* Check-In Toggle Button */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckIn(b.bookingRef, b.checkInStatus)}
                          className={`py-1.5 px-3 font-mono font-bold text-[10px] uppercase tracking-wider transition border ${
                            b.checkInStatus
                              ? 'bg-[#141413] text-white border-[#141413] hover:bg-[#C84B31]'
                              : 'bg-white text-[#52504A] border-[#DCD7CE] hover:border-[#141413] hover:text-[#141413]'
                          }`}
                        >
                          {b.checkInStatus ? '[✓ CHECKED IN]' : '[○ PENDING DOOR]'}
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 5. Create Gathering Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#DCD7CE] w-full max-w-2xl p-6 sm:p-8 relative shadow-2xl space-y-6 text-[#141413] font-sans max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowEventModal(false)}
              className="absolute top-4 right-4 text-[#52504A] hover:text-[#141413] text-sm"
            >
              <FaTimes />
            </button>

            <div className="border-b border-[#DCD7CE] pb-3 text-center space-y-1">
              <span className="font-mono text-[10px] text-[#C84B31] font-bold uppercase tracking-widest block">
                // PUBLICATION STAGE FORM
              </span>
              <h3 className="font-serif font-bold text-2xl text-[#141413]">Publish New Cultural Gathering</h3>
            </div>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 font-mono text-xs text-center font-bold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateEventSubmit} className="space-y-4 font-mono text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#52504A] font-bold uppercase mb-1">Gathering Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vienna Avant-Garde Night"
                    className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[#52504A] font-bold uppercase mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Cultural, Classical, Jazz..."
                    className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[#52504A] font-bold uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[#52504A] font-bold uppercase mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    placeholder="19:30"
                    className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[#52504A] font-bold uppercase mb-1">Venue Hall</label>
                  <input
                    type="text"
                    required
                    placeholder="Main Concert Hall"
                    className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[#52504A] font-bold uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Vienna"
                    className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                    value={formData.venueCity}
                    onChange={(e) => setFormData({ ...formData, venueCity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[#52504A] font-bold uppercase mb-1">Seat Capacity</label>
                  <input
                    type="number"
                    required
                    placeholder="150"
                    className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[#52504A] font-bold uppercase mb-1">Ticket Price ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="45"
                    className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#52504A] font-bold uppercase mb-1">Poster Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[#52504A] font-bold uppercase mb-1">Editorial Program Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Full curatorial narrative..."
                  className="w-full p-3 bg-white border border-[#DCD7CE] text-[#141413] focus:border-[#141413] focus:outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3.5 bg-[#C84B31] hover:bg-[#C84B31]/90 text-white font-sans font-bold text-xs uppercase tracking-wider transition border border-[#C84B31] shadow-xs"
              >
                {createLoading ? 'PUBLISHING ASSEMBLY...' : 'PUBLISH GATHERING TO GAZETTE'}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
