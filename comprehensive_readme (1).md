# Branch Manager Dashboard - Backend API

Enterprise-level Node.js + TypeScript backend for the Branch Manager Dashboard application.

## 🏗️ Architecture

This backend follows **Clean Architecture** principles with clear separation of concerns:

```
├── Controllers    → Handle HTTP requests/responses
├── Services       → Business logic layer
├── Repositories   → Data access layer
├── Middleware     → Cross-cutting concerns
├── Utils          → Helper functions
└── Types          → TypeScript type definitions
```

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Validation**: express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest (configured)

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup Steps

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

4. **Create necessary directories**
```bash
mkdir -p src/data logs
```

5. **Add mock data**
- Create `src/data/mockData.json` with the provided sample data structure

## 🎯 Running the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Running Tests
```bash
npm test
npm run test:watch  # Watch mode
```

### Code Quality
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format code
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Available Endpoints

#### 1. Health Check
```http
GET /api/health
```
**Response**: Service health status

#### 2. Dashboard Data
```http
GET /api/dashboard?branch=Nairobi&dateRange=last30days
```

**Query Parameters** (all optional):
- `dateRange`: last7days, last30days, last90days, lastYear, all
- `branch`: Branch name (e.g., Nairobi, Mombasa)
- `agent`: Agent name
- `product`: Product type
- `segment`: Customer segment
- `campaign`: Campaign name

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "kpis": [...],
    "leadsByBranch": [...],
    "revenueByBranch": [...],
    "leadStatus": [...],
    "agentPerformance": [...],
    "topPerformingAgents": [...],
    "branchAgentRanking": [...],
    "filters": {...}
  },
  "message": "Dashboard data retrieved successfully",
  "timestamp": "2024-12-10T10:30:00.000Z"
}
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── app.config.ts    # App settings
│   │   └── cors.config.ts   # CORS configuration
│   ├── controllers/         # Request handlers
│   │   └── dashboard.controller.ts
│   ├── services/            # Business logic
│   │   ├── dashboard.service.ts
│   │   └── filter.service.ts
│   ├── repositories/        # Data access
│   │   └── data.repository.ts
│   ├── middleware/          # Express middleware
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── logging.middleware.ts
│   ├── utils/               # Utilities
│   │   ├── logger.ts
│   │   └── apiResponse.ts
│   ├── types/               # TypeScript types
│   │   └── dashboard.types.ts
│   ├── routes/              # Route definitions
│   │   ├── index.ts
│   │   └── dashboard.routes.ts
│   ├── data/                # Mock data
│   │   └── mockData.json
│   └── app.ts               # Application entry
├── logs/                    # Application logs
├── tests/                   # Test files
├── .env                     # Environment variables
├── .env.example             # Environment template
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

## 🔒 Security Features

1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing
3. **Rate Limiting**: 100 requests per 15 minutes
4. **Input Validation**: Request validation middleware
5. **Error Handling**: Centralized error management
6. **Compression**: Response compression

## 📊 Data Flow

```
Client Request
    ↓
Validation Middleware
    ↓
Controller (HTTP Layer)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Mock Data / Database
    ↓
Response (Standardized Format)
```

## 🛠️ Key Features

### 1. **Caching**
- In-memory cache with configurable TTL (5 minutes default)
- Automatic cache invalidation

### 2. **Logging**
- Winston logger with multiple transports
- Request/response logging
- Error tracking with stack traces
- Separate log files for errors and combined logs

### 3. **Error Handling**
- Custom `AppError` class for operational errors
- Global error handler
- Async error wrapper
- User-friendly error messages

### 4. **Validation**
- Express-validator integration
- Query parameter validation
- Input sanitization

### 5. **Response Standardization**
- Consistent API response format
- Success/error response helpers
- HTTP status code management

## 🔧 Configuration

### Environment Variables

```env
NODE_ENV=development          # Environment
PORT=5000                     # Server port
API_PREFIX=/api              # API route prefix
CORS_ORIGIN=http://localhost:3000  # Allowed origin
LOG_LEVEL=info               # Logging level
CACHE_TTL=300                # Cache duration (seconds)
```

## 📝 Development Guidelines

### Adding New Endpoints

1. **Define types** in `types/`
2. **Create service** in `services/`
3. **Create controller** in `controllers/`
4. **Add routes** in `routes/`
5. **Add validation** middleware if needed

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Write unit tests for services

## 🧪 Testing Strategy

```bash
# Unit tests for services
tests/unit/services/

# Integration tests for API
tests/integration/api/
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up proper logging
- [ ] Enable HTTPS
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up process manager (PM2)
- [ ] Configure monitoring

### PM2 Setup
```bash
npm install -g pm2
pm2 start dist/app.js --name branch-dashboard-api
pm2 save
pm2 startup
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Change PORT in .env or kill existing process
lsof -ti:5000 | xargs kill -9
```

**Module not found**
```bash
# Rebuild and check paths
npm run build
```

**CORS errors**
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:3000
```

## 📈 Performance Considerations

1. **Caching**: Reduces database/file reads
2. **Compression**: Reduces response size
3. **Rate Limiting**: Prevents abuse
4. **Async Operations**: Non-blocking I/O
5. **Connection Pooling**: Ready for database integration

## 🔄 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Authentication & Authorization (JWT)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] WebSocket support for real-time updates
- [ ] Advanced caching (Redis)
- [ ] Background job processing
- [ ] Monitoring & APM integration
- [ ] Docker containerization

## 📞 API Integration (Frontend)

### Example Request
```javascript
const response = await fetch(
  'http://localhost:5000/api/dashboard?branch=Nairobi&dateRange=last30days',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

const data = await response.json();
```

## 🤝 Contributing

1. Follow the established architecture
2. Write tests for new features
3. Update documentation
4. Follow TypeScript best practices
5. Use meaningful commit messages

## 📄 License

MIT License

---

**Built with ❤️ for the Branch Manager Dashboard**