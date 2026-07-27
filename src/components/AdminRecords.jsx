import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Calendar,
  Mail,
  MessageSquare,
  Receipt,
  Star,
  Search,
} from 'lucide-react';
import { getAdminRecords } from '../services/spreadsheetService';
import { formatCurrency } from '../data/servicesCatalog';

const TABS = [
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'contacts', label: 'Contact', icon: Mail },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return value || '—';
  return formatCurrency(num);
}

function RecordsTable({ columns, rows, emptyMessage }) {
  if (!rows.length) {
    return <p className="admin-records-empty">{emptyMessage}</p>;
  }

  return (
    <div className="admin-records-table-wrap">
      <table className="admin-records-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? index}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.label}>
                  {col.render ? col.render(row) : row[col.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminRecords({ adminPin }) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminRecords(adminPin);
      setRecords(data);
    } catch (err) {
      setRecords(null);
      setError(err.message || 'Could not load sheet data.');
    } finally {
      setLoading(false);
    }
  }, [adminPin]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filterRows = useCallback(
    (rows, fields) => {
      const query = search.trim().toLowerCase();
      if (!query) return rows;
      return rows.filter((row) =>
        fields.some((field) => String(row[field] ?? '').toLowerCase().includes(query))
      );
    },
    [search]
  );

  const tabContent = useMemo(() => {
    if (!records) return { rows: [], columns: [], emptyMessage: 'No data yet.' };

    switch (activeTab) {
      case 'bookings':
        return {
          rows: filterRows(records.bookings || [], [
            'bookingNo',
            'name',
            'phone',
            'email',
            'service',
          ]),
          emptyMessage: 'No bookings saved yet.',
          columns: [
            { key: 'timestamp', label: 'Submitted', render: (r) => formatDate(r.timestamp) },
            { key: 'bookingNo', label: 'Booking ID' },
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'service', label: 'Service' },
            { key: 'date', label: 'Appt. Date' },
            { key: 'timeSlot', label: 'Time' },
            { key: 'price', label: 'Price', render: (r) => formatMoney(r.price) },
            { key: 'notes', label: 'Notes' },
          ],
        };
      case 'contacts':
        return {
          rows: filterRows(records.contacts || [], ['name', 'email', 'subject', 'message']),
          emptyMessage: 'No contact form submissions yet.',
          columns: [
            { key: 'timestamp', label: 'Submitted', render: (r) => formatDate(r.timestamp) },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'subject', label: 'Subject' },
            { key: 'message', label: 'Message' },
          ],
        };
      case 'billing':
        return {
          rows: filterRows(records.billing || [], [
            'billNo',
            'clientName',
            'phone',
            'email',
            'services',
          ]),
          emptyMessage: 'No billing records yet.',
          columns: [
            { key: 'billNo', label: 'Invoice No' },
            { key: 'serviceDate', label: 'Service Date' },
            { key: 'clientName', label: 'Client' },
            { key: 'phone', label: 'Phone' },
            { key: 'services', label: 'Services' },
            { key: 'subtotal', label: 'Subtotal', render: (r) => formatMoney(r.subtotal) },
            { key: 'discount', label: 'Discount', render: (r) => formatMoney(r.discount) },
            { key: 'total', label: 'Total', render: (r) => formatMoney(r.total) },
            { key: 'createdAt', label: 'Created', render: (r) => formatDate(r.createdAt) },
          ],
        };
      case 'feedback':
        return {
          rows: filterRows(records.feedback || [], ['name', 'role', 'quote']),
          emptyMessage: 'No feedback submissions yet.',
          columns: [
            { key: 'timestamp', label: 'Submitted', render: (r) => formatDate(r.timestamp) },
            { key: 'name', label: 'Name' },
            { key: 'role', label: 'Role' },
            {
              key: 'stars',
              label: 'Rating',
              render: (r) => (
                <span className="admin-records-stars">
                  {Array.from({ length: r.stars || 5 }).map((_, i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </span>
              ),
            },
            { key: 'quote', label: 'Review' },
          ],
        };
      default:
        return { rows: [], columns: [], emptyMessage: 'No data.' };
    }
  }, [activeTab, filterRows, records]);

  const counts = records?.counts || {};

  return (
    <section className="admin-records glass-panel">
      <div className="admin-records-header">
        <div className="admin-records-header-row">
          <h2>Sheet Records</h2>
          <button
            type="button"
            className="btn btn-outline-gold admin-records-refresh"
            onClick={loadRecords}
            disabled={loading}
            aria-label="Refresh sheet records"
          >
            <RefreshCw size={14} className={loading ? 'admin-records-spin' : ''} />
            <span className="admin-records-refresh-text">{loading ? '…' : 'Refresh'}</span>
          </button>
        </div>
        <p className="admin-section-desc admin-records-desc">
          View data saved from the website — bookings, contact messages, bills, and feedback.
        </p>
      </div>

      {error && (
        <div className="admin-records-error">
          <p><strong>Could not load sheet data</strong></p>
          <p>{error}</p>
          <ol className="admin-records-deploy-steps">
            <li>Open your Google Sheet → <strong>Extensions → Apps Script</strong></li>
            <li>Replace code with the latest <code>google-apps-script/Code.gs</code> from the project</li>
            <li>Click <strong>Deploy → Manage deployments → Edit (pencil) → New version → Deploy</strong></li>
            <li>Come back here and click <strong>Refresh</strong></li>
          </ol>
        </div>
      )}

      <div className="admin-records-toolbar">
        <div className="admin-records-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`admin-records-tab${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} className="admin-records-tab-icon" />
              <span className="admin-records-tab-label">{label}</span>
              <span className="admin-records-count">{counts[id] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="admin-records-search">
          <Search size={16} />
          <input
            type="search"
            className="form-control"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && !records ? (
        <p className="admin-records-loading">Loading sheet data…</p>
      ) : (
        <RecordsTable
          columns={tabContent.columns}
          rows={tabContent.rows}
          emptyMessage={tabContent.emptyMessage}
        />
      )}
    </section>
  );
}
