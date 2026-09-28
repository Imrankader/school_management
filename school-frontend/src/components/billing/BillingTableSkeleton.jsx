import React from 'react';

/**
 * BillingTableSkeleton renders 6-8 animated skeleton rows matching the exact
 * column structure, padding, and alignment of the Class Billing Summary or
 * Student Billing Records table.
 *
 * Provides a professional, subtle shimmer effect that eliminates layout shift
 * while billing data is being retrieved.
 */
export default function BillingTableSkeleton({ rowCount = 7, type = 'class-summary' }) {
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  // Slight width variation to look realistic and natural
  const classWidths = ['76px', '88px', '65px', '92px', '80px', '70px', '84px', '75px'];
  const nameWidths = ['110px', '125px', '95px', '135px', '105px', '120px', '115px'];
  const admWidths = ['75px', '85px', '95px', '70px', '80px', '90px'];
  const billedWidths = ['95px', '110px', '85px', '100px', '90px', '105px', '80px', '95px'];
  const paidWidths = ['80px', '90px', '75px', '85px', '70px', '95px', '80px', '75px'];
  const outstandingWidths = ['85px', '95px', '80px', '90px', '75px', '85px', '70px', '80px'];

  return (
    <>
      <style>{`
        @keyframes billingSkeletonShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .billing-shimmer-box {
          background: linear-gradient(
            90deg,
            #f1f5f9 0%,
            #e2e8f0 50%,
            #f1f5f9 100%
          );
          background-size: 200% 100%;
          animation: billingSkeletonShimmer 1.8s ease-in-out infinite;
          border-radius: 4px;
          display: inline-block;
        }
      `}</style>

      {rows.map((idx) => {
        if (type === 'student-billing') {
          const nWidth = nameWidths[idx % nameWidths.length];
          const aWidth = admWidths[idx % admWidths.length];
          const bWidth = billedWidths[idx % billedWidths.length];
          const pWidth = paidWidths[idx % paidWidths.length];
          const oWidth = outstandingWidths[idx % outstandingWidths.length];

          return (
            <tr
              key={`student-skeleton-${idx}`}
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                height: '48px',
              }}
            >
              {/* Chevron */}
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '40px' }}>
                <span className="billing-shimmer-box" style={{ width: '14px', height: '14px', borderRadius: '3px' }} />
              </td>
              {/* S.No */}
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '50px' }}>
                <span className="billing-shimmer-box" style={{ width: '18px', height: '14px', borderRadius: '3px' }} />
              </td>
              {/* Student Name */}
              <td style={{ padding: '0.75rem 1rem' }}>
                <span className="billing-shimmer-box" style={{ width: nWidth, height: '16px' }} />
              </td>
              {/* Roll / Adm */}
              <td style={{ padding: '0.75rem 1rem' }}>
                <span className="billing-shimmer-box" style={{ width: aWidth, height: '14px' }} />
              </td>
              {/* Total Billed */}
              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="billing-shimmer-box" style={{ width: bWidth, height: '16px' }} />
                </div>
              </td>
              {/* Paid */}
              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="billing-shimmer-box" style={{ width: pWidth, height: '16px' }} />
                </div>
              </td>
              {/* Outstanding */}
              <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="billing-shimmer-box" style={{ width: oWidth, height: '16px' }} />
                </div>
              </td>
              {/* Status */}
              <td style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '120px' }}>
                <span className="billing-shimmer-box" style={{ width: '74px', height: '22px', borderRadius: '9999px' }} />
              </td>
              {/* Actions (Pay, History, Edit) */}
              <td style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <span className="billing-shimmer-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                  <span className="billing-shimmer-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                  <span className="billing-shimmer-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                </div>
              </td>
            </tr>
          );
        }

        // Default: 'class-summary'
        const cWidth = classWidths[idx % classWidths.length];
        const bWidth = billedWidths[idx % billedWidths.length];
        const pWidth = paidWidths[idx % paidWidths.length];
        const oWidth = outstandingWidths[idx % outstandingWidths.length];

        return (
          <tr
            key={`billing-skeleton-${idx}`}
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              height: '52px',
            }}
          >
            {/* 1. S.No */}
            <td style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '60px' }}>
              <span
                className="billing-shimmer-box"
                style={{ width: '20px', height: '14px', borderRadius: '3px' }}
              />
            </td>

            {/* 2. Class Badge */}
            <td style={{ padding: '0.85rem 1rem' }}>
              <span
                className="billing-shimmer-box"
                style={{
                  width: cWidth,
                  height: '24px',
                  borderRadius: '4px',
                }}
              />
            </td>

            {/* 3. Students Count */}
            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
              <span
                className="billing-shimmer-box"
                style={{ width: '32px', height: '16px' }}
              />
            </td>

            {/* 4. Total Billed */}
            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span
                  className="billing-shimmer-box"
                  style={{ width: bWidth, height: '16px' }}
                />
              </div>
            </td>

            {/* 5. Paid */}
            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span
                  className="billing-shimmer-box"
                  style={{ width: pWidth, height: '16px' }}
                />
              </div>
            </td>

            {/* 6. Outstanding */}
            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span
                  className="billing-shimmer-box"
                  style={{ width: oWidth, height: '16px' }}
                />
              </div>
            </td>

            {/* 7. Collection % */}
            <td style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '130px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                <span
                  className="billing-shimmer-box"
                  style={{ width: '50px', height: '6px', borderRadius: '9999px' }}
                />
                <span
                  className="billing-shimmer-box"
                  style={{ width: '30px', height: '14px' }}
                />
              </div>
            </td>

            {/* 8. Status Pill */}
            <td style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '110px' }}>
              <span
                className="billing-shimmer-box"
                style={{
                  width: '74px',
                  height: '22px',
                  borderRadius: '9999px',
                }}
              />
            </td>

            {/* 9. Actions Buttons */}
            <td style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '140px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <span
                  className="billing-shimmer-box"
                  style={{ width: '58px', height: '26px', borderRadius: '4px' }}
                />
                <span
                  className="billing-shimmer-box"
                  style={{ width: '26px', height: '26px', borderRadius: '4px' }}
                />
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}
