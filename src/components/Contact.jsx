import React, { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle, Send, CheckCircle } from 'lucide-react';
import { saveToSpreadsheet } from '../services/spreadsheetService';

export default function Contact() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [inputs, setInputs] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!inputs.name.trim()) newErrors.name = 'Full name is required';
    
    if (!inputs.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(inputs.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!inputs.subject.trim()) newErrors.subject = 'Subject is required';
    if (!inputs.message.trim()) newErrors.message = 'Message content is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Save data to Google Sheet
      saveToSpreadsheet({
        formType: 'contact',
        name: inputs.name,
        email: inputs.email,
        subject: inputs.subject,
        message: inputs.message
      });

      // Construct WhatsApp message content
      const messageText = `*New Contact Inquiry*\n-------------------\n*Name:* ${inputs.name}\n*Email:* ${inputs.email}\n*Subject:* ${inputs.subject}\n*Message:* ${inputs.message}`;
      const encodedMessage = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/917021929588?text=${encodedMessage}`;
      
      // Open WhatsApp link in a new tab
      window.open(whatsappUrl, '_blank');

      // Simulate form submission on UI
      setFormSubmitted(true);
      setInputs({ name: '', email: '', subject: '', message: '' });
    }
  };

  return (
    <div className="animate-fade-in page-padding">
      <div className="container">
        {/* Page Header */}
        <div className="section-header">
          <span className="section-subtitle">Get In Touch</span>
          <h2 className="section-title">Contact Azora</h2>
          <p className="section-desc">
            Have a question about our services, styling packages, or bridal bookings? Drop us a line and our guest coordinator will get back to you shortly.
          </p>
        </div>

        {/* Form and Contact Details Grid */}
        <div className="contact-grid">
          
          {/* Contact Form Column */}
          <div className="glass-panel form-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', fontFamily: 'var(--font-heading)', color: 'var(--color-text-bright)' }}>
              Send Us a Message
            </h3>

            {formSubmitted ? (
              <div className="animate-scale-up" style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                backgroundColor: 'rgba(212, 175, 55, 0.03)'
              }}>
                <div style={{ display: 'inline-flex', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                  <CheckCircle size={44} />
                </div>
                <h4 style={{ fontSize: '1.25rem', color: 'var(--color-text-bright)', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Inquiry Received!
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Thank you for reaching out. We have received your message and will contact you via email within 24 hours.
                </p>
                <button className="btn btn-outline-gold" onClick={() => setFormSubmitted(false)}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="name" 
                    value={inputs.name} 
                    onChange={handleInputChange} 
                    placeholder="E.g., Charlotte Green"
                  />
                  {errors.name && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.name}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    name="email" 
                    value={inputs.email} 
                    onChange={handleInputChange} 
                    placeholder="charlotte@example.com"
                  />
                  {errors.email && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="subject" 
                    value={inputs.subject} 
                    onChange={handleInputChange} 
                    placeholder="E.g., Bridal package inquiry"
                  />
                  {errors.subject && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.subject}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Your Message</label>
                  <textarea 
                    className="form-control" 
                    name="message" 
                    value={inputs.message} 
                    onChange={handleInputChange} 
                    placeholder="Write details of your question here..."
                  />
                  {errors.message && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.message}</p>}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  <Send size={16} /> Send Inquiry
                </button>
              </form>
            )}
          </div>

          {/* Contact Info Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Quick Contacts Panel */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--color-text-bright)' }}>
                Contact Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                  <MapPin size={22} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '0.2rem' }} />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-bright)', marginBottom: '0.25rem' }}>Address</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      Shop No:4, Floor No:Ground, Skyline Residency CHS LTD, Sector: 08, Plot: 05, Kamothe, Navi Mumbai, District: Raigad, Maharashtra 410209
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                  <Phone size={22} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '0.2rem' }} />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-bright)', marginBottom: '0.25rem' }}>Phone Number</h4>
                    <a href="tel:+917021929588" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover-gold">
                      +91 70219 29588
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>
                  <Mail size={22} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '0.2rem' }} />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-bright)', marginBottom: '0.25rem' }}>Email</h4>
                    <a href="mailto:azorasalon@gmail.com" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover-gold">
                      azorasalon@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Connect Panel */}
            <div className="glass-panel" style={{ borderLeft: '3px solid #25D366' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)', color: 'var(--color-text-bright)' }}>
                Instant Concierge
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Prefer chatting to calling? Send us a direct message on WhatsApp for instant assistance.
              </p>
              <a 
                href="https://wa.me/917021929588?text=Hello%20Azora%20Salon!%20I'd%20like%20to%20inquire%20about%20booking%20an%20appointment."
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{
                  borderColor: '#25D366',
                  color: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%'
                }}
              >
                <MessageCircle size={18} fill="currentColor" /> Chat on WhatsApp
              </a>
            </div>

            {/* Hours panel */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', color: 'var(--color-text-bright)' }}>
                Salon Hours
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                <p style={{ margin: 0 }}>Mon – Sun: 10AM to 10PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Google Map Section */}
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', fontFamily: 'var(--font-heading)', color: 'var(--color-text-bright)', textAlign: 'center' }}>
            Find Our Sanctuary
          </h3>
          <div className="glass-panel" style={{ padding: '0.5rem', height: '450px', overflow: 'hidden' }}>
            <iframe 
              title="Azora Interactive Map"
              src="https://maps.google.com/maps?q=Skyline%20Residency%20CHS%20LTD%2C%20Sector%208%2C%20Kamothe%2C%20Navi%20Mumbai&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
