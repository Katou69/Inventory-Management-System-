"use client";

import { useMemo, useState } from "react";
import { Order } from "@/types/orders";
import { Badge } from "@/components/ui";
import { ArrowUpDown } from "lucide-react";

import Filters, { OrderFilterStatus } from "./Filters";
import OrderActionsMenu, { Role } from "./OrderActionsMenu";
import OrderFormModal from "./OrderFormModal";
import DeleteOrderModal from "./DeleteOrderModal";
import CancelOrderModal from "./CancelOrderModal";
import OrderDetailsModal from "./OrderDetailsModal";
import MoveToShipModal from "./MoveToShipModal";

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
  role: Role;
};

export default function OrdersTableClient({ orders, role }: Props) {
  const [orderList, setOrderList] = useState<Order[]>(orders);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [movingOrder, setMovingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const canManage = role === "admin" || role === "manager";

  // Filter states
  const [activeStatus, setActiveStatus] =
    useState<OrderFilterStatus>("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredOrders = useMemo(() => {
    return orderList.filter((order) => {
      const matchesStatus =
        activeStatus === "all" ||
        order.status === activeStatus;

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

  // Row / menu click routes to the right modal based on order status:
  // pending -> shelf picking modal, everything else -> details modal
  // (details modal shows the picking checklist inline when status is "picking").
  const handleProductClick = (order: Order) => {
    if (order.status === "pending") {
      setMovingOrder(order);
    } else {
      setSelectedOrder(order);
    }
  };

  const handleConfirmMoveToShip = (updatedOrder: Order) => {
    setOrderList((previousOrders) =>
      previousOrders.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
    setMovingOrder(null);
  };

  const handleCompletePicking = (orderId: string) => {
    setOrderList((previousOrders) =>
      previousOrders.map((order) =>
        order.id === orderId ? { ...order, status: "completed" } : order
      )
    );
    setSelectedOrder(null);
  };

  const handleConfirmCancel = () => {
    if (!cancellingOrder) return;

    setOrderList((previousOrders) =>
      previousOrders.map((order) =>
        order.id === cancellingOrder.id
          ? { ...order, status: "cancelled" }
          : order
      )
    );

    setCancellingOrder(null);
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

          {canManage && (
            <button
              type="button"
              onClick={handleAddOrder}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              + New Order
            </button>
          )}
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
                          onClick={() => handleProductClick(order)}
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
                          role={role}
                          onView={setSelectedOrder}
                          onMoveToShip={setMovingOrder}
                          onEdit={handleEditOrder}
                          onDelete={setDeletingOrder}
                          onCancel={setCancellingOrder}
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

      <OrderDetailsModal
          open={selectedOrder !== null}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCompletePicking={handleCompletePicking}
      />

      <MoveToShipModal
        key={movingOrder?.id ?? "none"}
        open={movingOrder !== null}
        order={movingOrder}
        onClose={() => setMovingOrder(null)}
        onConfirm={handleConfirmMoveToShip}
      />

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

      <CancelOrderModal
        order={cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}