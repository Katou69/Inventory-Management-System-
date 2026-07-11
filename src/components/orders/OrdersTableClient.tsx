"use client";

import { useMemo, useState } from "react";
import { Order } from "@/types/orders";
import { Badge } from "@/components/ui";
import { ArrowUpDown, X } from "lucide-react";

import Filters, { OrderFilterStatus } from "./Filters";
import OrderActionsMenu from "./OrderActionsMenu";
import OrderFormModal from "./OrderFormModal";
import DeleteOrderModal from "./DeleteOrderModal";

const headers = [
  "No",
  "Order ID",
  "Customer",
  "Products",
  "Total Qty",
  "Total Amount",
  "Status",
  "Order Date",
];

type Props = {
  orders: Order[];
};

export default function OrdersTableClient({ orders }: Props) {
  const [orderList, setOrderList] = useState<Order[]>(orders);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter states
  const [activeStatus, setActiveStatus] =
    useState<OrderFilterStatus>("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredOrders = useMemo(() => {
    return orderList.filter((order) => {
      /*
       * The Filters for every types of Orders
       */
      const matchesStatus =
        activeStatus === "all" ||
        order.status === activeStatus;

      /*
       * Dates use YYYY-MM-DD format, so they can be compared safely
       * as strings.
       */
      const matchesStartDate =
        !startDate || order.date >= startDate;

      const matchesEndDate =
        !endDate || order.date <= endDate;

      return (
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [orderList, activeStatus, startDate, endDate]);

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleAddOrder = () => {
    setEditingOrder(null);
    setIsFormOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleSaveOrder = (savedOrder: Order) => {
    setOrderList((previousOrders) => {
      const orderExists = previousOrders.some(
        (order) => order.id === savedOrder.id
      );

      if (orderExists) {
        return previousOrders.map((order) =>
          order.id === savedOrder.id ? savedOrder : order
        );
      }

      return [savedOrder, ...previousOrders];
    });

    /*
     * Update the details modal too if the currently selected
     * order was edited.
     */
    setSelectedOrder((currentOrder) =>
      currentOrder?.id === savedOrder.id
        ? savedOrder
        : currentOrder
    );
  };

  const handleDeleteOrder = () => {
    if (!deletingOrder) return;

    setOrderList((previousOrders) =>
      previousOrders.filter(
        (order) => order.id !== deletingOrder.id
      )
    );

    if (selectedOrder?.id === deletingOrder.id) {
      setSelectedOrder(null);
    }

    setDeletingOrder(null);
  };

  return (
    <>
      <div className="space-y-5">
        <Filters
          activeStatus={activeStatus}
          startDate={startDate}
          endDate={endDate}
          onStatusChange={setActiveStatus}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClearDates={handleClearDates}
        />

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            Showing {filteredOrders.length} of{" "}
            {orderList.length} orders
          </p>

          <button
            type="button"
            onClick={handleAddOrder}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            + New Order
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-left">
                {headers.map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-600"
                  >
                    <div className="flex items-center gap-1">
                      {header}

                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </th>
                ))}

                <th className="px-6 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => {
                  const totalQuantity = order.items.reduce(
                    (sum, item) =>
                      sum + item.quantity,
                    0
                  );

                  const firstProduct =
                    order.items[0]?.product ||
                    "No product";

                  const remainingProducts =
                    Math.max(order.items.length - 1, 0);

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-slate-500">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
                          {order.id}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-800">
                        {order.customer}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(order)
                          }
                          className="text-left"
                        >
                          <p className="font-medium text-slate-700 hover:text-indigo-600 hover:underline">
                            {firstProduct}
                          </p>

                          {remainingProducts > 0 && (
                            <p className="text-xs text-slate-500">
                              +{remainingProducts} more
                            </p>
                          )}
                        </button>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {totalQuantity.toLocaleString()}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {order.total.toLocaleString()}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge status={order.status} />
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                        {order.date}
                      </td>

                      <td className="px-6 py-4">
                        <OrderActionsMenu
                          order={order}
                          onView={setSelectedOrder}
                          onEdit={handleEditOrder}
                          onDelete={setDeletingOrder}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={headers.length + 1}
                    className="px-6 py-14 text-center"
                  >
                    <p className="font-medium text-slate-700">
                      No orders found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing the status or date
                      filters.
                    </p>

                    {(startDate || endDate) && (
                      <button
                        type="button"
                        onClick={handleClearDates}
                        className="mt-4 text-sm font-medium text-indigo-600 hover:underline"
                      >
                        Clear date filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Order Details
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedOrder.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close order details"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Customer
                </span>

                <span className="text-right font-medium">
                  {selectedOrder.customer}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Status
                </span>

                <Badge status={selectedOrder.status} />
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Order Date
                </span>

                <span>{selectedOrder.date}</span>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <h3 className="mb-3 font-semibold text-slate-800">
                Products
              </h3>

              <div className="max-h-64 space-y-3 overflow-y-auto">
                {selectedOrder.items.map(
                  (item, index) => (
                    <div
                      key={`${item.product}-${index}`}
                      className="flex justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3"
                    >
                      <span className="text-slate-700">
                        {item.product}
                      </span>

                      <span className="whitespace-nowrap font-medium">
                        {item.quantity.toLocaleString()}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-200 pt-5">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Total Quantity
                </span>

                <span className="font-semibold">
                  {selectedOrder.items
                    .reduce(
                      (sum, item) =>
                        sum + item.quantity,
                      0
                    )
                    .toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Total Amount
                </span>

                <span className="font-semibold">
                  {selectedOrder.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <OrderFormModal
        key={editingOrder?.id ?? "new-order"}
        open={isFormOpen}
        order={editingOrder}
        onClose={() => {
          setIsFormOpen(false);
          setEditingOrder(null);
        }}
        onSave={handleSaveOrder}
      />

      <DeleteOrderModal
        order={deletingOrder}
        onClose={() => setDeletingOrder(null)}
        onConfirm={handleDeleteOrder}
      />
    </>
  );
}