<div align="center">

# 🍽️ FoodOrder — Enterprise Food Ordering System

### Production-Grade Restaurant & Food Ordering Management Platform

A full-stack, real-time food ordering system built with **Go**, **Next.js 16.3.5**, and **Tailwind CSS v4.3.3** — featuring role-based workflows, live dashboard streaming, multi-format reporting, and PWA support.

![Go](https://img.shields.io/badge/Go-1.27.1-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-1.11-00ADD8?style=for-the-badge&logo=gin&logoColor=white)
![GORM](https://img.shields.io/badge/GORM-1.30-00ADD8?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.3.5-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4.3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Secure-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active--development-brightgreen?style=for-the-badge)

**[Overview](#-overview)** • **[Features](#-key-features)** • **[Tech Stack](#-technology-stack)** • **[Architecture](#-architecture)** • **[Project Structure](#-project-structure)** • **[Getting Started](#-getting-started)** • **[API Reference](#-api-reference)** • **[Screenshots](#-screenshots)** • **[Author](#-author)**

</div>

---

## 📖 Overview

**FoodOrder** is a production-grade, full-stack food ordering and restaurant management platform designed to replace manual cashier operations with a modern, real-time, fully digital workflow.

Built with a **Go (Gin)** backend and a **Next.js 16 + React 19** frontend, FoodOrder delivers an end-to-end solution covering the entire food service lifecycle — from real-time order monitoring on a public dashboard, to cashier-driven ordering, multi-role status management, and analytical reporting with Excel/PDF exports.

The system demonstrates a real-world, enterprise-style implementation of:

- ⚡ **Real-time data streaming** using Server-Sent Events (SSE) with graceful reconnection
- 🔐 **Role-Based Access Control (RBAC)** with 4 distinct permission levels
- 📊 **Public dashboard** with live queue updates (no login required)
- 📑 **Multi-format reporting** — Excel (`.xlsx`) and PDF with styled headers
- 📱 **Progressive Web App (PWA)** with installable manifest, service worker, and offline caching
- 🏗️ **Clean layered architecture** — Handler → Service → Repository → MySQL
- 🔒 **JWT-secured REST APIs** with bcrypt password hashing
- ✨ **Graceful UX** — toast notifications, modal flows, keyboard shortcuts, responsive design

> 💡 FoodOrder reflects how modern restaurants manage orders in real time — combining live monitoring, cashier workflows, kitchen coordination, and management analytics in a single, cohesive platform.

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 📊 Real-Time Dashboard
- Public live dashboard — no login required
- 3-column grid — Waiting · Processing · Done (5 orders per column)
- SSE-powered realtime updates with auto-reconnect & fallback polling
- Live/Offline indicator with pulsing animation
- Daily filter — only today's orders displayed
- Compact cards with order code, customer, table, status, time
- Responsive — 1 column (mobile) → 2 (tablet) → 3 (desktop)

### 🛒 Order Management
- Cashier order creation with multi-category cart
- Add-to-cart feedback — quantity badges, toasts, highlights
- Debounced search by name/description
- Filter by category, status, and date range
- Pagination with dynamic page controls
- Instant PDF receipt per order (A6 thermal-style)
- Excel export with filter-aware data

### 📋 Approval & Status Workflow
- `waiting → processing → done` status flow
- Cancel option for pending orders
- Role-restricted transitions:
  - **Cashier** → create + confirm payment
  - **Admin** → update status
  - **Superadmin** → full control
- Real-time status broadcast to all connected clients

### 🍽 Menu & Category Management
- Full CRUD for menu items with category classification
- Image URL support with live preview
- Availability toggle (Available / Out of Stock)
- Category CRUD with in-use validation
- Excel export for menu list
- Search + filter + pagination

</td>
<td width="50%" valign="top">

### 📈 Reports & Analytics
- Summary cards — total orders, revenue, average order, items
- Bar chart — daily sales trend (brand gradient)
- Pie chart — status distribution (Recharts)
- Status breakdown — 4 stat cards with per-status revenue
- Date-range filter with native date picker
- Export to Excel — styled `.xlsx` with column widths
- Export to PDF — landscape A4, print-ready
- Filter-aware exports

### 👥 User & Role Management
- Secure JWT authentication, httpOnly-ready design
- 4-role RBAC:
  - **Superadmin** — all features + user management
  - **Admin** — orders, menus, reports
  - **Cashier** — create orders, confirm payment
  - **User** — view public dashboard
- Full CRUD for users with role assignment
- Password change with visibility toggle
- Activity tracking with timestamps
- Self-protection — cannot delete last superadmin

### 📱 Progressive Web App
- Installable on desktop & mobile
- Manifest with theme color `#0EA5E9`
- Service worker with asset caching
- Custom icons (192, 512, maskable, apple-touch)
- Native-app-like experience

### 🔒 Security
- JWT tokens with configurable expiry
- bcrypt password hashing (cost 10)
- RBAC middleware enforcing route permissions
- CORS whitelist for trusted origins
- Parameterized queries (GORM) — SQL-injection safe
- Rate-limit ready structure

</td>
</tr>
</table>

### 🎨 Modern UI/UX

Calm **Green-Blue** design system (`#0EA5E9` brand · `#10B981` accent) · Fully responsive (Desktop / Tablet / Mobile) · Tailwind CSS v4 with CSS-first config · Zustand for lightweight state · Lucide icon set · Toast notifications for all CRUD feedback · Modal flows with ESC-to-close · Accessible focus rings · Fluid typography

---

## 👥 Roles & Permissions

| Role | Level | Dashboard | Orders | Menus | Reports | Users |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Superadmin** | 4 | ✅ Full | ✅ CRUD | ✅ CRUD | ✅ View | ✅ CRUD |
| **Admin** | 3 | ✅ Full | ✅ CRUD | ✅ CRUD | ✅ View | ❌ |
| **Cashier** | 2 | ✅ Full | ➕ Create + Pay | 👁 View only | ❌ | ❌ |
| **User** | 1 | 👁 View only | ❌ | ❌ | ❌ | ❌ |

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Backend Language | Go 1.27.1 |
| Backend Framework | Gin (HTTP router) |
| ORM | GORM |
| Database | MySQL 8.4 |
| Authentication | JWT v5 + bcrypt |
| Realtime | Server-Sent Events (SSE) with Hub pattern |
| Excel Generation | excelize/v2 |
| PDF Generation | go-pdf/fpdf |
| Frontend Framework | Next.js 16.3.5 (App Router, Turbopack) |
| UI Library | React 19 |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS v4.3.3 |
| State Management | Zustand |
| HTTP Client | Axios with interceptors |
| Charts | Recharts |
| Icons | Lucide React |
| PWA | Custom manifest + service worker |
| API Style | RESTful (JSON over HTTP) |
| Architecture | Clean Layered (Handler → Service → Repository) |

---

## 🏗 Architecture

FoodOrder follows a clean layered architecture with strict separation of concerns. Every protected route passes through JWT middleware and RBAC role guards, ensuring zero unauthorized access.

```
┌──────────────────────────────────────┐
│       Client (Browser / PWA)          │
│   Next.js 16 + React 19 + Zustand     │
└───────────────┬───────────────────────┘
                │  RESTful API + SSE
                │  (JSON over HTTP)
┌───────────────▼───────────────────────┐
│         Go 1.27 + Gin Engine          │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │       Middleware Layer            │ │
│  │  • CORS  • JWT Auth  • RBAC       │ │
│  └────────────┬───────────────────────┘ │
│               │                        │
│  ┌────────────▼───────────────────────┐ │
│  │       Controller Layer            │ │
│  │  (HTTP handlers + validation)     │ │
│  └────────────┬───────────────────────┘ │
│               │                        │
│  ┌────────────▼───────────────────────┐ │
│  │        Service Layer              │ │
│  │  (Business logic + Hub SSE)       │ │
│  └────────────┬───────────────────────┘ │
│               │                        │
│  ┌────────────▼───────────────────────┐ │
│  │      Repository Layer             │ │
│  │       (GORM queries)              │ │
│  └────────────┬───────────────────────┘ │
└───────────────┼────────────────────────┘
                │
┌───────────────▼───────────────────────┐
│              MySQL 8.4                │
│     (7 tables with FK constraints)    │
└────────────────────────────────────────┘
```

### 🔌 Realtime Data Flow

```
Order Created/Updated
        │
        ▼
OrderService → Hub.Broadcast("queue.update", data)
        │
        ├──► Client A (Dashboard – SSE stream)
        ├──► Client B (Cashier screen – SSE stream)
        └──► Client C (Admin monitor – SSE stream)
```

---

## 📁 Project Structure

```
foodorder/
│
├── backend/
│   ├── main.go
│   ├── go.mod / go.sum
│   ├── .env
│   ├── config/
│   │   └── config.go
│   ├── database/
│   │   └── database.go
│   ├── models/
│   │   ├── role.go
│   │   ├── user.go
│   │   ├── category.go
│   │   ├── menu.go
│   │   ├── order.go
│   │   └── order_item.go
│   ├── migration/
│   │   └── migration.go
│   ├── seeders/
│   │   └── seeder.go
│   ├── repositories/
│   │   ├── user_repository.go
│   │   ├── category_repository.go
│   │   ├── menu_repository.go
│   │   └── order_repository.go
│   ├── services/
│   │   ├── hub.go              ← SSE broadcast hub
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── menu_service.go
│   │   ├── order_service.go
│   │   └── report_service.go
│   ├── controllers/
│   │   ├── auth_controller.go
│   │   ├── user_controller.go
│   │   ├── menu_controller.go
│   │   ├── order_controller.go
│   │   └── report_controller.go
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── role.go
│   │   └── cors.go
│   ├── routes/
│   │   └── routes.go
│   └── utils/
│       ├── jwt.go
│       ├── password.go
│       ├── response.go
│       ├── pagination.go
│       ├── excel.go
│       └── pdf.go
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── globals.css
    │   │   ├── login/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── orders/
    │   │   │   ├── page.tsx
    │   │   │   ├── OrderFormModal.tsx
    │   │   │   └── OrderDetailModal.tsx
    │   │   ├── menus/
    │   │   │   ├── page.tsx
    │   │   │   ├── MenuFormModal.tsx
    │   │   │   └── CategoryModal.tsx
    │   │   ├── users/
    │   │   │   ├── page.tsx
    │   │   │   └── UserFormModal.tsx
    │   │   └── reports/page.tsx
    │   ├── components/
    │   │   ├── AppShell.tsx
    │   │   ├── PublicHeader.tsx
    │   │   ├── LoginModal.tsx
    │   │   ├── ServiceWorkerRegister.tsx
    │   │   └── ui/
    │   │       ├── Toast.tsx
    │   │       ├── Pagination.tsx
    │   │       ├── SearchInput.tsx
    │   │       ├── StatusBadge.tsx
    │   │       ├── PageHeader.tsx
    │   │       └── EmptyState.tsx
    │   ├── lib/
    │   │   ├── api.ts
    │   │   └── format.ts
    │   ├── store/
    │   │   └── auth.ts
    │   ├── types/
    │   │   └── index.ts
    │   └── proxy.ts
    ├── public/
    │   ├── manifest.json
    │   ├── sw.js
    │   └── icons/
    ├── next.config.ts
    ├── package.json
    └── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Go 1.22+** (recommended 1.27) → [Download](https://go.dev/dl/)
- **Node.js 20+** and **npm 10+** → [Download](https://nodejs.org/)
- **MySQL 8.0+** → [Download](https://dev.mysql.com/downloads/)
- **Git**

### 🔧 Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/foodorder.git
cd foodorder/backend

# 2. Configure environment
cp .env.example .env
# Edit .env with your values:
#   DB_HOST=127.0.0.1
#   DB_PORT=3306
#   DB_USER=root
#   DB_PASS=your_password
#   DB_NAME=food_order
#   JWT_SECRET=your-256-bit-secret

# 3. Install dependencies
go mod download

# 4. Setup database + seed demo data
go run main.go migration:fresh --seed

# 5. Run the server
go run main.go
```

Backend will start at **http://localhost:8080**.

**Default seeded accounts** (password: `password`):

| Email | Role |
|---|---|
| `superadmin@mail.com` | Superadmin |
| `admin@mail.com` | Admin |
| `cashier@mail.com` | Cashier |
| `user@mail.com` | User |

### 🎨 Frontend Setup

```bash
# 1. Navigate to frontend
cd ../frontend

# 2. Install dependencies
npm install

# 3. Configure API endpoint
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env.local

# 4. Generate PWA icons (first time only)
npm run icons

# 5. Start development server
npm run dev
```

Frontend will be available at **http://localhost:3000**.

### 🎯 CLI Commands (Backend)

| Command | Description |
|---|---|
| `go run main.go` | Start server |
| `go run main.go migration:migrate` | Create tables only |
| `go run main.go migration:fresh` | Drop + recreate tables |
| `go run main.go migration:seed` | Seed data only |
| `go run main.go migration:fresh --seed` | Full reset + seed ⭐ |
| `go run main.go help` | Show all commands |

---

## 📡 API Reference

### Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with email + password |
| GET | `/api/dashboard/stats` | Global statistics (waiting/processing/done) |
| GET | `/api/dashboard/waiting` | 5 latest waiting orders |
| GET | `/api/dashboard/processing` | 5 latest processing orders |
| GET | `/api/dashboard/done` | 5 latest done orders |
| GET | `/api/stream/orders` | SSE realtime stream |
| GET | `/api/menus` | List all menus (search + filter) |
| GET | `/api/categories` | List all categories |

### Protected Endpoints (JWT required)

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/auth/me` | All | Get current user |
| GET | `/api/orders` | All | List orders (search + filter + pagination) |
| GET | `/api/orders/:id` | All | Get order detail |
| GET | `/api/orders/:id/pdf` | All | Download PDF receipt |
| POST | `/api/orders` | Cashier, Superadmin | Create new order |
| POST | `/api/orders/:id/pay` | Cashier, Admin, Superadmin | Confirm payment |
| PATCH | `/api/orders/:id/status` | Admin, Superadmin | Update order status |
| GET | `/api/export/menus/excel` | Admin, Superadmin | Export menus to Excel |
| POST / PUT / DELETE | `/api/menus/*` | Admin, Superadmin | Menu CRUD |
| POST / PUT / DELETE | `/api/categories/*` | Admin, Superadmin | Category CRUD |
| GET / POST / PUT / DELETE | `/api/users/*` | Superadmin | User CRUD |
| GET | `/api/reports/orders/excel` | Admin, Superadmin | Export orders to Excel |
| GET | `/api/reports/orders/pdf` | Admin, Superadmin | Export orders to PDF |
| GET | `/api/reports/orders/summary` | Admin, Superadmin | Aggregated statistics |

---

## 📸 Screenshots

### 📊 Dashboard — Real-Time Multi-Status Grid
<img width="1918" height="1015" alt="image" src="https://github.com/user-attachments/assets/34f342ce-7937-43db-8db4-b9e33d584dd0" />
> Live monitoring with 3 columns (Waiting / Processing / Done) and SSE-powered realtime updates.

### 🔐 Login
<img width="1918" height="891" alt="image" src="https://github.com/user-attachments/assets/c3883151-2dcd-4ad3-a852-f856dd494618" />

### 👥 User Management with RBAC
<img width="1918" height="946" alt="image" src="https://github.com/user-attachments/assets/4ddcc466-db28-4c0b-b6f8-b0e1adb908a7" />

### 🍽 Menu Management
<img width="1909" height="957" alt="image" src="https://github.com/user-attachments/assets/5cbb5e03-2cd6-4711-b720-e1ced17ca541" />
<img width="1914" height="909" alt="image" src="https://github.com/user-attachments/assets/f340d956-8505-4a37-b788-2977ef872966" />

### 🛒 Order Creation — Multi-Category Cart
<img width="1893" height="981" alt="image" src="https://github.com/user-attachments/assets/287d1455-9fc9-4273-a329-d695e6ce37d9" />
<img width="1900" height="1014" alt="image" src="https://github.com/user-attachments/assets/517acec1-d85f-4524-b266-f1fa42ca203c" />
<img width="1918" height="948" alt="image" src="https://github.com/user-attachments/assets/2f7fd308-b948-47d2-8866-774001d8df6c" />

### 📈 Reports & Analytics
<img width="1909" height="933" alt="image" src="https://github.com/user-attachments/assets/4c05d77f-6a34-46f4-a35b-377ef5996888" />
<img width="1854" height="949" alt="image" src="https://github.com/user-attachments/assets/9d8d88a6-42c6-43d9-9ef9-8ea2605311ff" />
<img width="1914" height="928" alt="image" src="https://github.com/user-attachments/assets/88226aea-955f-4acb-89cb-50b4931f48ec" />

<details>
<summary><b>🖥️ Local Run Screenshots (Backend & Frontend)</b></summary>
<br>

**Backend (Go)**
<img width="1396" height="1002" alt="image" src="https://github.com/user-attachments/assets/758ca7e3-7e74-41bb-9876-dd12f77fd879" />

**Frontend (Next.js)**
<img width="1153" height="364" alt="image" src="https://github.com/user-attachments/assets/f6b93b6b-b295-41f1-9105-a512f7888a2c" />

</details>

---

## 🔒 Security Highlights

- **JWT tokens** — stateless, 24-hour expiry, configurable secret
- **bcrypt password hashing** with cost factor 10
- **Role-based middleware** — every protected route checks user role
- **Parameterized queries** via GORM — no raw SQL concatenation
- **CORS whitelist** — origins controlled via `CORS_ORIGINS` env
- **Input validation** — server-side using Gin's binding tags
- **Unique constraints** — on email (users), order_code (orders)
- **Idempotent operations** — double payment protection
- **Auto-cleanup** — cancelled orders cannot be paid

---

## 🎯 Roadmap

- [x] Real-time dashboard with SSE
- [x] Multi-role RBAC (4 levels)
- [x] Order CRUD with cart system
- [x] Menu & category management
- [x] Excel export (menus, orders)
- [x] PDF export (receipts, reports)
- [x] Progressive Web App
- [x] Toast notification system
- [x] Search + filter + pagination
- [ ] QR code ordering for customers
- [ ] Kitchen Display System (KDS)
- [ ] WhatsApp notification integration
- [ ] Multi-branch support
- [ ] Docker Compose deployment
- [ ] Dark mode
- [ ] i18n (Bahasa Indonesia / English)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or open a pull request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

## 👨‍💻 Author

**Eben Nezer Manurung**
Full Stack Developer • Backend Engineer

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/EbenEzerManurung)


⭐ **If this project helped you, please consider giving it a star!**

*Built with ❤️ using Go 1.27, Next.js 16.3.5, Tailwind v4.3.3, and MySQL 8.4*

</div>

<div align="center">

**🍽️ FoodOrder — Bringing real-time precision to food service operations.**

</div>
