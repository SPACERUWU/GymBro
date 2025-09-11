# GymBro - Personal Gym Tracker

แอปพลิเคชันสำหรับบันทึกการออกกำลังกายส่วนตัว ผู้ใช้สามารถเพิ่มท่าออกกำลังกาย, บันทึกน้ำหนักและจำนวนครั้งที่เล่นในแต่ละเซต, ดูประวัติย้อนหลัง, และติดตามสถิติที่ดีที่สุด (Personal Record) ของตัวเองผ่านกราฟและตารางสรุป

## Features

### Core Features
- **Workout Logging**: บันทึกการออกกำลังกายพร้อมน้ำหนักและจำนวนครั้งในแต่ละเซต
- **Exercise Management**: จัดการท่าออกกำลังกาย เพิ่ม แก้ไข ลบ
- **History & Dashboard**: ดูประวัติการออกกำลังกายและภาพรวม
- **Statistics & PRs**: ติดตามสถิติส่วนตัวและพัฒนาการผ่านกราฟ

### Technical Features
- **SQLite Database**: ฐานข้อมูลแบบไฟล์ ไม่ต้องติดตั้งเซิร์ฟเวอร์
- **TypeScript**: Type safety ทั้ง Frontend และ Backend
- **Responsive Design**: ใช้งานได้ทั้งบนเดสก์ท็อปและมือถือ
- **Real-time Charts**: กราฟแสดงพัฒนาการด้วย Recharts

## Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- SQLite3
- REST API

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Recharts (for charts)
- Axios (for API calls)
- Lucide React (for icons)

## Installation & Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Quick Start

1. **Clone and install dependencies:**
```bash
cd GymBro
npm run install:all
```

2. **Start the development servers:**
```bash
npm run dev
```

This will start both backend (port 3001) and frontend (port 3000) servers.

3. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

### Manual Setup

If you prefer to set up manually:

1. **Install root dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

3. **Install frontend dependencies:**
```bash
cd frontend
npm install
```

4. **Start backend server:**
```bash
cd backend
npm run dev
```

5. **Start frontend server (in another terminal):**
```bash
cd frontend
npm run dev
```

## Usage

### 1. Dashboard
- ดูภาพรวมการออกกำลังกายล่าสุด
- ดูสถิติส่วนตัว
- เข้าถึงการดำเนินการด่วน

### 2. Log Workout
- เลือกวันที่ที่ต้องการบันทึก
- เพิ่มท่าออกกำลังกาย
- บันทึกน้ำหนักและจำนวนครั้งในแต่ละเซต
- เพิ่มหมายเหตุ (ไม่บังคับ)

### 3. Exercise Management
- ดูรายการท่าออกกำลังกายทั้งหมด
- เพิ่มท่าออกกำลังกายใหม่
- แก้ไขหรือลบท่าออกกำลังกาย
- ค้นหาท่าออกกำลังกาย

### 4. Statistics
- ดูสถิติส่วนตัว (Personal Records)
- ดูกราฟพัฒนาการ
- เลือกท่าออกกำลังกายและเมตริกที่ต้องการดู

## Database

The application uses SQLite database with the following tables:

- **exercises**: เก็บข้อมูลท่าออกกำลังกาย
- **workouts**: เก็บข้อมูลการออกกำลังกายแต่ละวัน
- **workout_sets**: เก็บข้อมูลเซตในแต่ละท่าออกกำลังกาย

Database file is created automatically at `backend/database.sqlite` when you first run the application.

## API Endpoints

### Exercises
- `GET /api/exercises` - Get all exercises
- `GET /api/exercises/search?q=query` - Search exercises
- `GET /api/exercises/:id` - Get exercise by ID
- `POST /api/exercises` - Create new exercise
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Workouts
- `GET /api/workouts` - Get all workouts
- `GET /api/workouts/:id` - Get workout by ID
- `GET /api/workouts/date/:date` - Get workout by date
- `GET /api/workouts/dates` - Get all workout dates
- `POST /api/workouts` - Create new workout
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout

### Statistics
- `GET /api/stats/personal-records` - Get personal records
- `GET /api/stats/progress/:exerciseId?metric=max_weight|total_volume` - Get progress data

## Development

### Project Structure
```
GymBro/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── database/       # Database setup and schema
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript types
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   └── types/          # TypeScript types
│   └── package.json
└── package.json           # Root package.json with scripts
```

### Available Scripts

**Root level:**
- `npm run dev` - Start both backend and frontend in development mode
- `npm run install:all` - Install dependencies for all packages
- `npm run build` - Build frontend for production
- `npm start` - Start backend in production mode

**Backend:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Production Deployment

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

2. **Build the backend:**
```bash
cd backend
npm run build
```

3. **Start the backend:**
```bash
cd backend
npm start
```

4. **Serve the frontend** using any static file server (nginx, Apache, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

If you encounter any issues or have questions, please create an issue in the repository.
