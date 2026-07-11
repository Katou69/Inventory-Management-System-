import type {
  StatusCard, Warehouse, Product, ActivityEntry, InventoryDataPoint,
  WarehouseDetail, WarehouseStatus, StockMovement, WarehouseProduct, WarehouseActivity,
  NotificationItem, StaffStat
} from "@/types/dashboard"



export const statusCards: StatusCard[] = [
  {
    id: "total-stocks",
    label: "Total Stocks Among all Warehouses",
    value: "3,842",
    changeText: "increased 215 than last month",
    changeDirection: "up",
    icon: "stocks",
  },
  {
    id: "total-value",
    label: "Total Stock Value",
    value: "$41,111",
    changeText: "increased 215 than last month",
    changeDirection: "up",
    icon: "value",
  },
  {
    id: "total-suppliers",
    label: "Total Suppliers",
    value: "187",
    changeText: "increased 215 than last month",
    changeDirection: "up",
    icon: "suppliers",
  },
  {
    id: "total-revenue",
    label: "Total Revenue Generated",
    value: "187K",
    changeText: "increased 12K than last month",
    changeDirection: "up",
    icon: "revenue",
  },
  {
    id: "low-stock",
    label: "Low Stock Items",
    value: "56",
    changeText: "from this month",
    changeDirection: "up",
    icon: "lowStock",
  },
  {
    id: "orders-completed",
    label: "Total Order Completed",
    value: "230",
    changeText: "this month",
    changeDirection: "up",
    icon: "orders",
  },
]

export const warehouses: Warehouse[] = [
  { id: 1, name: "Yangon Central WH", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-001", location: "Yangon", manager: "Hein Htet Aung", capacityUsed: 8500, capacityTotal: 10000 },
  { id: 2, name: "Mandalay Cold Store", image: "/images/ellipse-3.png", lastInspection: "18-06-2026", warehouseId: "WH-002", location: "Mandalay", manager: "Thaw Thaw Tun", capacityUsed: 2100, capacityTotal: 3000 },
  { id: 3, name: "Taunggyi Distribution", image: "/images/ellipse-4.png", lastInspection: "18-06-2026", warehouseId: "WH-003", location: "Taunggyi", manager: "Aung Htoo Pyae", capacityUsed: 4300, capacityTotal: 6000 },
  { id: 4, name: "Naypyidaw Returns Hub", image: "/images/ellipse-5.png", lastInspection: "18-06-2026", warehouseId: "WH-004", location: "Naypyidaw", manager: "Soe Yadanar", capacityUsed: 950, capacityTotal: 2000 },
  { id: 5, name: "Bago Main Store", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-005", location: "Bago", manager: "Kyaw Ko Htike", capacityUsed: 5600, capacityTotal: 7500 },
  { id: 6, name: "Mawlamyaing Distribution", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-006", location: "Mawlamyaing", manager: "Hein Thu Aung", capacityUsed: 3200, capacityTotal: 5000 },
  { id: 7, name: "Yangon Cold Store 2", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-007", location: "Yangon", manager: "Bhone Wint Kyaw", capacityUsed: 1800, capacityTotal: 2500 },
  { id: 8, name: "Mandalay Distribution", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-008", location: "Mandalay", manager: "Aung Than Lwin Oo", capacityUsed: 4900, capacityTotal: 6000 },
  { id: 9, name: "Yangon Returns Hub", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-009", location: "Yangon", manager: "Billy Jeans", capacityUsed: 700, capacityTotal: 1500 },
  { id: 10, name: "Taunggyi Main Store", image: "/images/ellipse-2.png", lastInspection: "18-06-2026", warehouseId: "WH-010", location: "Taunggyi", manager: "John Doe", capacityUsed: 6100, capacityTotal: 8000 },
]

export const products: Product[] = [
  { id: 1, name: "Grand Royal Signature", image: "/images/ellipse-6.png", category: "Whisky", quantity: "120 units", revenue: "$13,945" },
  { id: 2, name: "Grand Royal Smooth", image: "/images/ellipse-6.png", category: "Whisky", quantity: "120 units", revenue: "$13,945" },
  { id: 3, name: "Grand Royal Black", image: "/images/ellipse-6.png", category: "Whisky", quantity: "120 units", revenue: "$13,945" },
  { id: 4, name: "Grand Royal Special Reserve Double Cask", image: "/images/ellipse-6.png", category: "Whisky", quantity: "120 units", revenue: "$13,945" },
  { id: 5, name: "Chingu Soju (Yogurt)", image: "/images/ellipse-6.png", category: "Non-Whiskey", quantity: "120 units", revenue: "$13,945" },
  { id: 6, name: "Chingu Soju (Peach)", image: "/images/ellipse-6.png", category: "Non-Whiskey", quantity: "120 units", revenue: "$13,945" },
]

export const activities: ActivityEntry[] = [
  { id: 1, name: "Aung Htoo Pyae",   role: "Manager · Taunggyi Distribution", avatar: "/images/ellipse-9.png", description: "Approved a stock transfer of 30 units from WH-001 to WH-003.", date: "26 Jun 2026", time: "3:45 PM" },
  { id: 2, name: "Thaw Thaw Tun",    role: "Inspector · Mandalay Cold Store", avatar: "/images/ellipse-9.png", description: "Completed a routine safety inspection — all clear.",           date: "26 Jun 2026", time: "11:20 AM" },
  { id: 3, name: "Soe Yadanar",      role: "Operator · Naypyidaw Hub",        avatar: "/images/ellipse-9.png", description: "Recorded 150 units inbound for Grand Royal Signature.",       date: "25 Jun 2026", time: "4:10 PM" },
  { id: 4, name: "Hein Htet Aung",   role: "Manager · Yangon Central",        avatar: "/images/ellipse-9.png", description: "Flagged Chingu Soju (Peach) as low stock (38 units left).",   date: "25 Jun 2026", time: "1:05 PM" },
  { id: 5, name: "Kyaw Ko Htike",    role: "Manager · Bago Main Store",       avatar: "/images/ellipse-9.png", description: "Created purchase order PO-2291 for 500 units.",               date: "24 Jun 2026", time: "5:30 PM" },
  { id: 6, name: "Bhone Wint Kyaw",  role: "Coordinator · Yangon Cold 2",     avatar: "/images/ellipse-9.png", description: "Dispatched outbound shipment of 220 units to a retailer.",     date: "24 Jun 2026", time: "9:50 AM" },
  { id: 7, name: "Aung Than Lwin Oo",role: "Manager · Mandalay Distribution", avatar: "/images/ellipse-9.png", description: "Updated capacity records after a warehouse re-layout.",        date: "23 Jun 2026", time: "2:15 PM" },
  { id: 8, name: "Soe Yadanar",      role: "Operator · Naypyidaw Hub",        avatar: "/images/ellipse-9.png", description: "Returned 12 damaged units to supplier for replacement.",       date: "23 Jun 2026", time: "10:40 AM" },
]

export const notifications: NotificationItem[] = [
  { id: 1, type: "alert", title: "Low stock alert",        description: "Chingu Soju (Peach) dropped below 40 units at WH-001.", time: "10 min ago", unread: true },
  { id: 2, type: "order", title: "New purchase order",     description: "PO-2291 for 500 units was created by Kyaw Ko Htike.",    time: "1 hour ago", unread: true },
  { id: 3, type: "stock", title: "Stock transfer approved",description: "30 units moved from WH-001 to WH-003.",                 time: "3 hours ago", unread: true },
  { id: 4, type: "user",  title: "Inspection completed",   description: "Mandalay Cold Store passed its safety inspection.",      time: "Yesterday",  unread: false },
  { id: 5, type: "order", title: "Shipment dispatched",    description: "220 units sent out from Yangon Cold Store 2.",           time: "Yesterday",  unread: false },
]

export const inventoryByPeriod: Record<"days" | "months" | "years", InventoryDataPoint[]> = {
  months: [
    { label: "Jan", stockIn: 18000, stockOut: 12000, stockValue: 28000 },
    { label: "Feb", stockIn: 25000, stockOut: 18000, stockValue: 32000 },
    { label: "Mar", stockIn: 22000, stockOut: 15000, stockValue: 30000 },
    { label: "Apr", stockIn: 30000, stockOut: 22000, stockValue: 38000 },
    { label: "May", stockIn: 27000, stockOut: 20000, stockValue: 35000 },
    { label: "Jun", stockIn: 35000, stockOut: 28000, stockValue: 40000 },
    { label: "Jul", stockIn: 28000, stockOut: 19000, stockValue: 34000 },
    { label: "Aug", stockIn: 32000, stockOut: 24000, stockValue: 37000 },
    { label: "Sep", stockIn: 24000, stockOut: 16000, stockValue: 30000 },
    { label: "Oct", stockIn: 29000, stockOut: 21000, stockValue: 35000 },
    { label: "Nov", stockIn: 38000, stockOut: 30000, stockValue: 42000 },
    { label: "Dec", stockIn: 31000, stockOut: 22000, stockValue: 38000 },
  ],
  years: [
    { label: "2019", stockIn: 180000, stockOut: 130000, stockValue: 220000 },
    { label: "2020", stockIn: 160000, stockOut: 120000, stockValue: 200000 },
    { label: "2021", stockIn: 210000, stockOut: 155000, stockValue: 260000 },
    { label: "2022", stockIn: 275000, stockOut: 200000, stockValue: 320000 },
    { label: "2023", stockIn: 310000, stockOut: 230000, stockValue: 370000 },
    { label: "2024", stockIn: 355000, stockOut: 265000, stockValue: 420000 },
    { label: "2025", stockIn: 390000, stockOut: 290000, stockValue: 460000 },
  ],
  days: [
    { label: "1",  stockIn: 800,  stockOut: 500,  stockValue: 1200 },
    { label: "2",  stockIn: 1100, stockOut: 700,  stockValue: 1600 },
    { label: "3",  stockIn: 600,  stockOut: 900,  stockValue: 1100 },
    { label: "4",  stockIn: 1400, stockOut: 800,  stockValue: 1800 },
    { label: "5",  stockIn: 950,  stockOut: 600,  stockValue: 1400 },
    { label: "6",  stockIn: 700,  stockOut: 1100, stockValue: 1000 },
    { label: "7",  stockIn: 1600, stockOut: 900,  stockValue: 2100 },
    { label: "8",  stockIn: 1200, stockOut: 750,  stockValue: 1700 },
    { label: "9",  stockIn: 500,  stockOut: 600,  stockValue: 900  },
    { label: "10", stockIn: 1800, stockOut: 1100, stockValue: 2400 },
    { label: "11", stockIn: 1300, stockOut: 850,  stockValue: 1900 },
    { label: "12", stockIn: 900,  stockOut: 700,  stockValue: 1300 },
    { label: "13", stockIn: 2100, stockOut: 1300, stockValue: 2800 },
    { label: "14", stockIn: 1500, stockOut: 1000, stockValue: 2200 },
    { label: "15", stockIn: 1100, stockOut: 800,  stockValue: 1600 },
    { label: "16", stockIn: 700,  stockOut: 500,  stockValue: 1000 },
    { label: "17", stockIn: 1900, stockOut: 1200, stockValue: 2500 },
    { label: "18", stockIn: 1400, stockOut: 900,  stockValue: 2000 },
    { label: "19", stockIn: 800,  stockOut: 650,  stockValue: 1200 },
    { label: "20", stockIn: 2300, stockOut: 1500, stockValue: 3000 },
    { label: "21", stockIn: 1700, stockOut: 1100, stockValue: 2300 },
    { label: "22", stockIn: 1000, stockOut: 700,  stockValue: 1500 },
    { label: "23", stockIn: 600,  stockOut: 450,  stockValue: 900  },
    { label: "24", stockIn: 1600, stockOut: 1000, stockValue: 2200 },
    { label: "25", stockIn: 2000, stockOut: 1300, stockValue: 2700 },
    { label: "26", stockIn: 1200, stockOut: 800,  stockValue: 1800 },
    { label: "27", stockIn: 900,  stockOut: 600,  stockValue: 1400 },
    { label: "28", stockIn: 1500, stockOut: 950,  stockValue: 2100 },
    { label: "29", stockIn: 1100, stockOut: 750,  stockValue: 1700 },
    { label: "30", stockIn: 700,  stockOut: 500,  stockValue: 1100 },
  ],
}
// ---------------------------------------------------------------------------
// Warehouse detail data
// ---------------------------------------------------------------------------

const warehouseStatuses: Record<number, WarehouseStatus> = {
  1: "Active", 2: "Active", 3: "Active", 4: "Under Maintenance", 5: "Active",
  6: "Active", 7: "Closed", 8: "Active", 9: "Under Maintenance", 10: "Active",
}

const managerContacts: Record<number, { phone: string; email: string; address: string }> = {
  1:  { phone: "+95 9 770 112 233", email: "hein.htet@grgi.com",   address: "No. 12, Bayint Naung Rd, Yangon" },
  2:  { phone: "+95 9 445 668 900", email: "thaw.tun@grgi.com",    address: "Chan Mya Tharzi, Mandalay" },
  3:  { phone: "+95 9 251 889 077", email: "aung.pyae@grgi.com",   address: "Taunggyi, Shan State, Myanmar" },
  4:  { phone: "+95 9 660 234 118", email: "soe.yadanar@grgi.com", address: "Zabu Thiri, Naypyidaw" },
  5:  { phone: "+95 9 330 552 447", email: "kyaw.htike@grgi.com",  address: "Industrial Zone, Bago" },
  6:  { phone: "+95 9 780 991 223", email: "hein.thu@grgi.com",    address: "Myaing Tharyar, Mawlamyaing" },
  7:  { phone: "+95 9 112 334 556", email: "bhone.kyaw@grgi.com",  address: "Insein Rd, Yangon" },
  8:  { phone: "+95 9 909 887 665", email: "aung.oo@grgi.com",     address: "Pyi Gyi Tagon, Mandalay" },
  9:  { phone: "+95 9 445 110 998", email: "billy.jeans@grgi.com", address: "North Dagon, Yangon" },
  10: { phone: "+95 9 223 447 889", email: "john.doe@grgi.com",    address: "Aye Thar Yar, Taunggyi" },
}

const productPool = [
  { sku: "GRS-001", name: "Grand Royal Signature",       category: "Whisky" },
  { sku: "GRS-002", name: "Grand Royal Smooth",          category: "Whisky" },
  { sku: "GRB-003", name: "Grand Royal Black",           category: "Whisky" },
  { sku: "GRD-004", name: "Grand Royal Double Cask",     category: "Whisky" },
  { sku: "CSY-005", name: "Chingu Soju (Yogurt)",        category: "Non-Whiskey" },
  { sku: "CSP-006", name: "Chingu Soju (Peach)",         category: "Non-Whiskey" },
  { sku: "CSG-007", name: "Chingu Soju (Grape)",         category: "Non-Whiskey" },
  { sku: "GRR-008", name: "Grand Royal Special Reserve", category: "Whisky" },
]

// Small deterministic pseudo-random generator so data is stable per warehouse
function seeded(seed: number) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function buildDailyMovement(rand: () => number) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return days.map((day) => ({
    day,
    inbound:  Math.round(120 + rand() * 400),
    outbound: Math.round(80 + rand() * 320),
  }))
}

function buildMovements(rand: () => number): StockMovement[] {
  const rows: StockMovement[] = []
  const types = ["Inbound", "Outbound", "Transfer Out", "Inbound", "Outbound"] as const
  for (let i = 0; i < 5; i++) {
    const p = productPool[Math.floor(rand() * productPool.length)]
    const type = types[i]
    const magnitude = Math.round(20 + rand() * 230)
    const qty = type === "Inbound" ? magnitude : -magnitude
    rows.push({
      id: i + 1,
      item: p.name,
      type,
      qty,
      date: `${24 - i} Jun 2026`,
    })
  }
  return rows
}

function buildProducts(rand: () => number): WarehouseProduct[] {
  return productPool.map((p, i) => {
    const quantity = Math.round(15 + rand() * 400)
    const status: WarehouseProduct["status"] =
      quantity < 40 ? "Critical" : quantity < 90 ? "Low" : "Normal"
    return {
      id: i + 1,
      sku: p.sku,
      name: p.name,
      category: p.category,
      quantity,
      status,
      lastUpdated: `${20 + (i % 8)} Jun 2026`,
    }
  })
}

function buildActivities(rand: () => number, manager: string): WarehouseActivity[] {
  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
  const base: Omit<WarehouseActivity, "id">[] = [
    { name: manager,          role: "Manager",     initials: initials(manager), description: "Approved stock transfer of 30 units to WH-001", category: "Stock",      date: "26 Jun 2026", time: "3:45 PM" },
    { name: "Thaw Thaw Tun",  role: "Inspector",   initials: "TT",              description: "Conducted routine safety inspection",           category: "Inspection", date: "26 Jun 2026", time: "11:20 AM" },
    { name: "Soe Yadanar",    role: "Operator",    initials: "SY",              description: "Updated inventory records — 150 units inbound",  category: "Stock",      date: "25 Jun 2026", time: "4:10 PM" },
    { name: "Hein Htet Aung", role: "Auditor",     initials: "HH",              description: "Completed monthly audit — all clear",           category: "Inspection", date: "25 Jun 2026", time: "10:30 AM" },
    { name: "Billy Jeans",    role: "Coordinator", initials: "BJ",              description: "Requested stock reallocation for Q3",            category: "User",       date: "24 Jun 2026", time: "2:15 PM" },
  ]
  return base.map((a, i) => ({ id: i + 1, ...a }))
}

export function buildWarehouseDetail(id: number): WarehouseDetail | undefined {
  const base = warehouses.find((w) => w.id === id)
  if (!base) return undefined

  const rand    = seeded(id + 7)
  const contact = managerContacts[id] ?? { phone: "+95 9 000 000 000", email: "team@grgi.com", address: base.location }
  const products = buildProducts(rand)
  const dailyMovement = buildDailyMovement(rand)
  const throughput = dailyMovement.reduce((sum, d) => sum + d.inbound + d.outbound, 0)

  return {
    ...base,
    status: warehouseStatuses[id] ?? "Active",
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
    nextInspection: "18 Dec 2026",
    totalSkus: products.reduce((sum, p) => sum + p.quantity, 0),
    lowStockCount: products.filter((p) => p.status !== "Normal").length,
    pendingInbound: Math.round(2 + rand() * 10),
    throughput,
    dailyMovement,
    movements: buildMovements(rand),
    products,
    activities: buildActivities(rand, base.manager),
  }
}

export const staffStats: StaffStat[] = [
  {
    id: 1,
    title: "Orders Pending",
    value: 5,
    description: "Orders waiting for completion",
    color: "blue",
  },
  {
    id: 2,
    title: "Purchase Deliveries",
    value: 3,
    description: "Incoming purchase deliveries",
    color: "green",
  },
  {
    id: 3,
    title: "Low Stock Alerts",
    value: 7,
    description: "Items requiring attention",
    color: "amber",
  },
  {
    id: 4,
    title: "Today's Movements",
    value: 42,
    description: "Stock in & out today",
    color: "red",
  },
]