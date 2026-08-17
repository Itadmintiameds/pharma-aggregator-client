"use client";

// Sample data only — order placement/tracking doesn't exist yet for buyers.
// Shows the section with representative content instead of a blank
// "under development" box until real order history is wired up.
const SAMPLE_ORDERS = [
  { id: "ORD-20482", date: "2026-08-10", seller: "MedCore Pharma", items: 3, amount: "₹18,400", status: "Delivered" },
  { id: "ORD-20475", date: "2026-08-08", seller: "Wellness Labs", items: 1, amount: "₹6,750", status: "Shipped" },
  { id: "ORD-20461", date: "2026-08-04", seller: "HealthFirst Distributors", items: 5, amount: "₹42,100", status: "Processing" },
  { id: "ORD-20439", date: "2026-07-29", seller: "SafeCare Supplies", items: 2, amount: "₹9,300", status: "Delivered" },
  { id: "ORD-20402", date: "2026-07-21", seller: "MedCore Pharma", items: 1, amount: "₹2,150", status: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  Delivered: "bg-success-50 text-success-600",
  Shipped: "bg-info-50 text-info-600",
  Processing: "bg-warning-50 text-warning-600",
  Cancelled: "bg-red-50 text-red-500",
};

export default function BuyerOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-h4 font-heading font-bold text-pneutral-900">My Orders</h2>
        <p className="text-p3 font-body text-pneutral-600 mt-1">
          Sample history — live order tracking is coming soon.
        </p>
      </div>

      <div className="bg-base-white rounded-2xl border border-neutral-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="border-b border-neutral-100 text-label-l2 font-heading text-pneutral-500">
              <th className="px-5 py-3 font-medium">Order ID</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Seller</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ORDERS.map((order) => (
              <tr key={order.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-5 py-3 text-p3 font-body font-semibold text-pneutral-900">{order.id}</td>
                <td className="px-5 py-3 text-p3 font-body text-pneutral-600">{order.date}</td>
                <td className="px-5 py-3 text-p3 font-body text-pneutral-600">{order.seller}</td>
                <td className="px-5 py-3 text-p3 font-body text-pneutral-600">{order.items}</td>
                <td className="px-5 py-3 text-p3 font-body text-pneutral-900">{order.amount}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-label-l2 font-heading font-medium ${STATUS_STYLES[order.status]}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
