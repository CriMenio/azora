import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle, Scissors, Sparkles, UserCheck } from 'lucide-react';
import { saveToSpreadsheet } from '../services/spreadsheetService';

const SERVICES_DATA = [
  { id: 'haircut', name: 'Hair Cut', category: 'Hair', price: 500, duration: '45 mins' },
  { id: 'hairspa', name: 'Hair Spa', category: 'Hair', price: 1200, duration: '60 mins' },
  { id: 'haircoloring', name: 'Hair Coloring', category: 'Hair', price: 2500, duration: '120 mins' },
  { id: 'facial', name: 'Facial Service', category: 'Beauty', price: 1500, duration: '60 mins' },
  { id: 'waxing', name: 'Waxing Full', category: 'Beauty', price: 1000, duration: '45 mins' },
  { id: 'threading', name: 'Threading', category: 'Beauty', price: 150, duration: '15 mins' },
  { id: 'beardstyling', name: 'Beard Styling', category: 'Grooming', price: 300, duration: '30 mins' },
  { id: 'manicure', name: 'Manicure', category: 'Grooming', price: 600, duration: '45 mins' },
  { id: 'pedicure', name: 'Pedicure', category: 'Grooming', price: 800, duration: '50 mins' },
];

const STYLISTS = [
  { id: 'preeti', name: 'Preeti', role: 'Founder & Senior Specialist' },
];

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', 
  '05:00 PM', '06:00 PM', '07:00 PM'
];

export default function BookingModal({ isOpen, onClose, initialServiceId }) {
  const [step, setStep] = useState(1);
  const [bookingNo, setBookingNo] = useState('');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    serviceIds: [],
    stylistId: 'preeti',
    date: '',
    timeSlot: '',
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialServiceId) {
      setFormData(prev => ({ ...prev, serviceIds: [initialServiceId] }));
      setStep(1); // Reset to first step if reopened with a new initial service
      setBookingNo('');
    } else {
      setFormData(prev => ({
        ...prev,
        serviceIds: [],
        stylistId: 'preeti',
        date: '',
        timeSlot: '',
        name: '',
        email: '',
        phone: '',
        notes: ''
      }));
      setStep(1);
      setBookingNo('');
    }
    setErrors({});
  }, [initialServiceId, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleService = (id) => {
    setFormData(prev => {
      const isSelected = prev.serviceIds.includes(id);
      const serviceIds = isSelected 
        ? prev.serviceIds.filter(sId => sId !== id)
        : [...prev.serviceIds, id];
      return { ...prev, serviceIds };
    });
    if (errors.serviceIds) {
      setErrors(prev => ({ ...prev, serviceIds: '' }));
    }
  };

  const getSelectedServices = () => {
    return SERVICES_DATA.filter(s => formData.serviceIds.includes(s.id));
  };

  const getSelectedStylist = () => {
    return STYLISTS.find(s => s.id === formData.stylistId);
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (formData.serviceIds.length === 0) newErrors.serviceIds = 'Please select at least one service';
      if (!formData.stylistId) newErrors.stylistId = 'Please select a stylist';
    } else if (step === 2) {
      if (!formData.date) newErrors.date = 'Please select an appointment date';
      if (!formData.timeSlot) newErrors.timeSlot = 'Please select a time slot';
      
      // Ensure date is in the future
      if (formData.date) {
        const selectedDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (selectedDate < today) {
          newErrors.date = 'Appointment date cannot be in the past';
        }
      }
    } else if (step === 3) {
      if (!formData.name.trim()) newErrors.name = 'Full name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[+]?[0-9\s-]{7,15}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep()) {
      const generatedNo = `AUR-${Math.floor(Math.random() * 90000) + 10000}`;
      setBookingNo(generatedNo);

      const activeServices = getSelectedServices();
      const activeStylist = getSelectedStylist();

      // Save data to Google Sheet (pricing and duration removed per preference)
      saveToSpreadsheet({
        formType: 'booking',
        bookingNo: generatedNo,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        service: activeServices.map(s => s.name).join(', '),
        price: '',
        duration: '',
        stylist: activeStylist?.name || 'Preeti',
        date: formData.date,
        timeSlot: formData.timeSlot,
        notes: formData.notes
      });

      // Construct WhatsApp message content (no price or duration)
      const messageText = `*New Appointment Booking*\n-------------------------\n*Appointment ID:* ${generatedNo}\n*Client Name:* ${formData.name}\n*Phone:* ${formData.phone}\n*Email:* ${formData.email}\n*Services:* ${activeServices.map(s => s.name).join(', ')}\n*Stylist:* ${activeStylist?.name || 'Preeti'}\n*Date:* ${formData.date}\n*Time Slot:* ${formData.timeSlot}${formData.notes.trim() ? `\n*Notes:* ${formData.notes}` : ''}`;
      
      const encodedMessage = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/917021929588?text=${encodedMessage}`;

      // Open WhatsApp link in a new tab
      window.open(whatsappUrl, '_blank');

      setStep(4); // Move to Confirmation/Receipt
    }
  };

  const selectedServices = getSelectedServices();
  const selectedStylist = getSelectedStylist();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ borderRadius: '4px' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={24} />
        </button>

        {/* Modal Header */}
        <div style={{ padding: '2.5rem 2.5rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
            {step === 4 ? 'Booking Confirmed' : 'Book Your Experience'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {step === 4 ? 'We look forward to welcoming you to Azora.' : 'Indulge in our exquisite beauty and grooming rituals.'}
          </p>
        </div>

        {/* Step Progress Bar */}
        {step < 4 && (
          <div style={{ display: 'flex', padding: '1rem 2.5rem 0', gap: '0.5rem' }}>
            {[1, 2, 3].map((num) => (
              <div 
                key={num} 
                style={{ 
                  flex: 1, 
                  height: '3px', 
                  backgroundColor: step >= num ? 'var(--color-primary)' : 'var(--color-border)',
                  transition: 'var(--transition-smooth)'
                }}
              />
            ))}
          </div>
        )}

        {/* Steps Content */}
        <div style={{ padding: '2rem 2.5rem' }}>
          {step === 1 && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                <Scissors size={18} className="text-gold" style={{ color: 'var(--color-primary)' }} /> Select Service & Stylist
              </h3>
              
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Select Services (Multiple Selection)</label>
                
                {/* Custom Dropdown Trigger */}
                <div 
                  className="form-control" 
                  onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '48px',
                    borderColor: isServiceDropdownOpen ? 'var(--color-primary)' : 'var(--color-border)',
                    boxShadow: isServiceDropdownOpen ? 'var(--shadow-glow)' : 'none',
                    paddingRight: '1.2rem'
                  }}
                >
                  <span style={{ 
                    color: formData.serviceIds.length === 0 ? 'var(--color-text-muted)' : 'var(--color-text-bright)',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '85%'
                  }}>
                    {formData.serviceIds.length === 0 
                      ? '-- Choose Services --' 
                      : formData.serviceIds.map(id => SERVICES_DATA.find(s => s.id === id)?.name).join(', ')
                    }
                  </span>
                  <span style={{ 
                    transform: isServiceDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s ease',
                    display: 'inline-flex',
                    color: 'var(--color-text-muted)'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                </div>

                {/* Click Outside Overlay */}
                {isServiceDropdownOpen && (
                  <div 
                    onClick={() => setIsServiceDropdownOpen(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 199,
                      background: 'transparent'
                    }}
                  />
                )}

                {/* Custom Dropdown Menu */}
                {isServiceDropdownOpen && (
                  <div 
                    className="glass-panel" 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 200,
                      marginTop: '0.5rem',
                      maxHeight: '280px',
                      overflowY: 'auto',
                      padding: '1.25rem',
                      boxShadow: 'var(--shadow-lg)',
                      border: '1px solid var(--color-gold-border)',
                      backgroundColor: 'rgba(22, 22, 22, 0.98)',
                      borderRadius: '4px'
                    }}
                  >
                    {['Hair', 'Beauty', 'Grooming'].map((cat) => {
                      const catLabel = cat === 'Hair' ? 'Hair Care' : cat === 'Beauty' ? 'Beauty & Aesthetic' : 'Grooming & Wellness';
                      const catServices = SERVICES_DATA.filter(s => s.category === cat);
                      
                      return (
                        <div key={cat} style={{ marginBottom: '1.25rem' }}>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: 'var(--color-primary)', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em',
                            marginBottom: '0.75rem',
                            borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
                            paddingBottom: '0.25rem'
                          }}>
                            {catLabel}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {catServices.map(service => {
                              const isSelected = formData.serviceIds.includes(service.id);
                              return (
                                <div 
                                  key={service.id} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    cursor: 'pointer',
                                    padding: '0.5rem 0.6rem',
                                    borderRadius: '4px',
                                    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                                    border: isSelected ? '1px solid var(--color-gold-border)' : '1px solid transparent',
                                    transition: 'var(--transition-fast)'
                                  }}
                                  onClick={() => {
                                    toggleService(service.id);
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected}
                                      readOnly
                                      style={{
                                        accentColor: 'var(--color-primary)',
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer'
                                      }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--color-text-bright)' : 'var(--color-text)' }}>
                                      {service.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {errors.serviceIds && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.serviceIds}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Select Stylist / Therapist</label>
                <select 
                  className="form-control" 
                  name="stylistId" 
                  value={formData.stylistId} 
                  onChange={handleInputChange}
                >
                  {STYLISTS.map(stylist => (
                    <option key={stylist.id} value={stylist.id}>{stylist.name} ({stylist.role})</option>
                  ))}
                </select>
                {errors.stylistId && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.stylistId}</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
                <button className="btn btn-primary" onClick={handleNext}>
                  Next: Choose Date
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                <Calendar size={18} style={{ color: 'var(--color-primary)' }} /> Appointment Schedule
              </h3>

              <div className="form-group">
                <label className="form-label">Preferred Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ colorScheme: 'dark' }}
                />
                {errors.date && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.date}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Available Time Slots</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                  gap: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot }))}
                      style={{
                        padding: '0.6rem 0.5rem',
                        backgroundColor: formData.timeSlot === slot ? 'var(--color-primary)' : '#1e1e1e',
                        color: formData.timeSlot === slot ? 'var(--color-text-dark)' : 'var(--color-text)',
                        border: '1px solid',
                        borderColor: formData.timeSlot === slot ? 'var(--color-primary)' : 'var(--color-border)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'var(--transition-fast)',
                        textAlign: 'center'
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {errors.timeSlot && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.5rem' }}>{errors.timeSlot}</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                <button className="btn btn-secondary" onClick={handleBack}>
                  Back
                </button>
                <button className="btn btn-primary" onClick={handleNext}>
                  Next: Your Details
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="animate-fade-in">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                <UserCheck size={18} style={{ color: 'var(--color-primary)' }} /> Contact Details
              </h3>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                    <User size={16} />
                  </span>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="John Doe"
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
                {errors.name && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.name}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-mobile-1">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                      <Mail size={16} />
                    </span>
                    <input 
                      type="email" 
                      className="form-control" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      placeholder="john@example.com"
                      style={{ paddingLeft: '3rem' }}
                    />
                  </div>
                  {errors.email && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                      <Phone size={16} />
                    </span>
                    <input 
                      type="tel" 
                      className="form-control" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="+1 (555) 019-2834"
                      style={{ paddingLeft: '3rem' }}
                    />
                  </div>
                  {errors.phone && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.phone}</p>}
                </div>
              </div>

              <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 576px) {
                  .grid-mobile-1 { grid-template-columns: 1fr !important; }
                }
              `}} />

              <div className="form-group">
                <label className="form-label">Special Requests (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1.2rem', top: '1.1rem', color: 'var(--color-text-muted)' }}>
                    <FileText size={16} />
                  </span>
                  <textarea 
                    className="form-control" 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleInputChange} 
                    placeholder="Any specific instructions, hair type remarks, or aesthetic goals..."
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Booking
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="animate-scale-up" style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>
                <CheckCircle size={44} />
              </div>
              
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                Appointment Confirmed!
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                A confirmation email and SMS have been sent to you. Your stylist is preparing for your visit.
              </p>

              {/* Receipt Styling */}
              <div style={{ 
                backgroundColor: '#111111', 
                border: '1px dashed var(--color-border)', 
                padding: '2rem', 
                borderRadius: '4px',
                textAlign: 'left',
                maxWidth: '440px',
                margin: '0 auto 2.5rem',
                fontFamily: 'var(--font-body)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>APPOINTMENT NO</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', fontFamily: 'var(--font-body)', marginTop: '0.1rem' }}>{bookingNo}</h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>STATUS</span>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#4caf50', fontFamily: 'var(--font-body)', marginTop: '0.1rem' }}>CONFIRMED</h4>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Client:</span>
                    <span style={{ fontWeight: '500' }}>{formData.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Services:</span>
                    <span style={{ fontWeight: '500', textAlign: 'right', maxWidth: '70%' }}>
                      {selectedServices.map(s => s.name).join(', ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Stylist:</span>
                    <span style={{ fontWeight: '500' }}>{selectedStylist?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Date:</span>
                    <span style={{ fontWeight: '500' }}>{formData.date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Time Slot:</span>
                    <span style={{ fontWeight: '500' }}>{formData.timeSlot}</span>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={onClose}>
                Done & Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
