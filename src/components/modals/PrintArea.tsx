import React from 'react';
import type { Employee, Payment, PrintPayload } from '../../types/ems';
import {
  cents,
  computeAccount,
  money,
  sar,
  todayRiyadh,
} from '../../lib/accounting';

interface PrintAreaProps {
  payload: PrintPayload;
  businessName: string;
  employees: Employee[];
  payments: Payment[];
}

export const PrintArea: React.FC<PrintAreaProps> = ({
  payload,
  businessName,
  employees,
  payments,
}) => {
  if (!payload) return null;

  if (payload.type === 'statement') {
    const e = employees.find((x) => x.id === payload.employeeId);
    if (!e) return null;
    const a = computeAccount(e, payments);
    const o = a.opening;

    return (
      <div className="print-only-sheet">
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
          {businessName}
        </h1>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          Worker Account Statement
        </h2>
        <p style={{ fontSize: '13px', marginBottom: '8px' }}>
          {e.fullName} · Iqama {e.iqamaNumber} · {e.phone}
        </p>
        <p style={{ fontSize: '13px', marginBottom: '16px' }}>
          Generated: {todayRiyadh()}
          <br />
          Recorded dues: <strong>{money(a.expected)} SAR</strong> · Paid:{' '}
          <strong>{money(a.paid)} SAR</strong> · Outstanding:{' '}
          <strong>{money(a.balance)} SAR</strong>
          {a.credit ? (
            <>
              <br />
              Extra paid: {money(a.credit)} SAR
            </>
          ) : null}
        </p>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            marginBottom: '16px',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid #111827', textAlign: 'left' }}>
              <th style={{ padding: '8px 6px' }}>Period</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Expected (SAR)</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Paid (SAR)</th>
              <th style={{ padding: '8px 6px', textAlign: 'right' }}>Balance (SAR)</th>
              <th style={{ padding: '8px 6px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {cents(o.amount) > 0 && (
              <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                <td style={{ padding: '7px 6px' }}>
                  Opening balance ({o.date || '—'})
                </td>
                <td style={{ padding: '7px 6px', textAlign: 'right' }}>{sar(o.amount)}</td>
                <td style={{ padding: '7px 6px', textAlign: 'right' }}>{sar(o.paid)}</td>
                <td style={{ padding: '7px 6px', textAlign: 'right' }}>
                  {money(Math.max(0, cents(o.amount) - cents(o.paid)))}
                </td>
                <td style={{ padding: '7px 6px' }}>Previous dues</td>
              </tr>
            )}
            {a.months.map((g) => (
              <tr key={g.key} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '7px 6px' }}>{g.key}</td>
                <td style={{ padding: '7px 6px', textAlign: 'right' }}>
                  {money(g.expected)}
                </td>
                <td style={{ padding: '7px 6px', textAlign: 'right' }}>
                  {money(g.paid)}
                </td>
                <td style={{ padding: '7px 6px', textAlign: 'right' }}>
                  {money(g.balance)}
                </td>
                <td style={{ padding: '7px 6px' }}>
                  {g.balance ? (g.paid ? 'PARTIAL' : 'UNPAID') : 'PAID'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: '11px', color: '#4b5563' }}>
          Only saved monthly records and opening balance are included. Missing months are not estimated.
        </p>

        {o.payments && o.payments.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Opening-balance payments
            </h3>
            {o.payments.map((x) => (
              <p key={x.id} style={{ fontSize: '12px', margin: '3px 0' }}>
                {x.date} · {sar(x.amount)} SAR · {x.method} · {x.reference}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  const p = payments.find((x) => x.id === payload.paymentId);
  if (!p) return null;
  const e = employees.find((x) => x.id === p.employeeId);

  return (
    <div className="print-only-sheet">
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
        {businessName}
      </h1>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
        Monthly Payment Receipt
      </h2>
      <p style={{ fontSize: '13px', marginBottom: '16px' }}>
        {p.employeeName} · Iqama {e?.iqamaNumber || '—'}
        <br />
        Period {p.month}/{p.year} · Last payment date {p.paymentDate}
        <br />
        Reference {p.referenceNumber || '—'}
      </p>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          marginBottom: '16px',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #111827', textAlign: 'left' }}>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>Expected (SAR)</th>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>
              Total Paid on Record (SAR)
            </th>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>
              Saved Balance (SAR)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '8px 6px', textAlign: 'right' }}>
              {sar(p.expectedAmount)}
            </td>
            <td style={{ padding: '8px 6px', textAlign: 'right' }}>
              {sar(p.paidAmount)}
            </td>
            <td style={{ padding: '8px 6px', textAlign: 'right' }}>
              {sar(p.balance)}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: '11px', color: '#4b5563' }}>
        This receipt summarizes this saved monthly record. See the worker statement for the complete account.
      </p>

      {p.paymentEvents && p.paymentEvents.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
            Payment entries
          </h3>
          {p.paymentEvents.map((x, i) => (
            <p key={i} style={{ fontSize: '12px', margin: '3px 0' }}>
              {x.date} · {sar(x.amount)} SAR · {x.method} · {x.reference}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
