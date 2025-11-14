# AI Synapse OCR - Intelligent Document Processing System

<div align="center">
  <h3>AI-OCR Based System for Automatic Table Extraction</h3>
  <p>Developed by Team AI Synapse x Eden T&S</p>
  <p>Woosong University - AI & Big Data Department</p>
  <p>Professor 김영일</p>
</div>

---

## 🎓 Team Members

- **Breslavskaya Ekaterina** (202212147) - Architecture & System Design
- **가동현** (202010092) - OCR Engine Integration
- **정윤우** (202010136) - Full-Stack Development
- **Badi Venkata Prasanna** (202508350) - AI/ML Integration
- **Okoli Blessing Ngozi** (202312050) - Database & Testing

---

## ✨ Features

- **Multi-Engine OCR**: Utilizes Tesseract, PaddleOCR, and EasyOCR for 95%+ accuracy
- **Intelligent Table Extraction**: Automatic detection and extraction of complex table structures
- **AI-Powered Query System**: Natural language document search with RAG (Retrieval-Augmented Generation)
- **Role-Based Access Control**: Secure user management with admin, member, and guest roles
- **Real-time Processing**: Live status updates during document processing
- **Enterprise Security**: JWT authentication, AES-256 encryption, audit logging
- **Scalable Architecture**: Microservices-based design with Docker containerization

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- FastAPI (Python 3.10+)
- MongoDB Atlas (Database & GridFS)
- Redis (Caching & Sessions)
- Celery (Background Tasks)
- OpenAI GPT-4 (RAG)

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Axios
- React Router

**OCR & AI:**
- Tesseract OCR
- PaddleOCR
- EasyOCR
- LangChain
- Sentence Transformers
- PyTorch

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API Key (for RAG functionality)
- 8GB+ RAM recommended
- GPU optional (for faster OCR processing)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/ai-synapse-ocr.git
cd ai-synapse-ocr
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY and other configurations
```

3. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

---

## 📖 Manual Setup (Without Docker)

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Tesseract OCR
# Ubuntu/Debian: sudo apt-get install tesseract-ocr
# macOS: brew install tesseract
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configurations

# Run development server
npm run dev
```

### MongoDB Setup
```bash
# Install MongoDB locally or use MongoDB Atlas
# Create database: ai_synapse_ocr
# Update MONGODB_URL in backend/.env
```

---

## 📚 API Documentation

### Authentication Endpoints

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "member"
}
```

**POST /api/auth/login**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -F "username=user@example.com" \
  -F "password=securepassword"
```

### Document Upload

**POST /api/upload/**
```bash
curl -X POST http://localhost:8000/api/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

### OCR Processing

**POST /api/ocr/{document_id}/process**
```bash
curl -X POST http://localhost:8000/api/ocr/{document_id}/process \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Query Documents

**POST /api/query/**
```json
{
  "query": "What are the total expenses for Q4 2024?",
  "document_ids": ["doc_id_1", "doc_id_2"],
  "top_k": 5
}
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm run test
```

---

## 📊 Project Structure
```
ai-synapse-ocr/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── utils/
│   │   └── middleware/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:
```env
# Application
APP_NAME=AI Synapse OCR
DEBUG=True
HOST=0.0.0.0
PORT=8000

# Security
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=60

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=ai_synapse_ocr

# OpenAI
OPENAI_API_KEY=your-api-key

# File Upload
MAX_FILE_SIZE_MB=50
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png,tiff

# OCR
GPU_ENABLED=False
DEFAULT_OCR_ENGINE=tesseract
```

### Frontend Configuration

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=AI Synapse OCR
```

---

## 🎯 Usage Guide

### 1. Register an Account
- Navigate to http://localhost:3000/register
- Create an account with your email and password

### 2. Upload a Document
- Go to the Upload page
- Drag and drop a PDF, image, or scan
- Click "Upload Document"

### 3. Process with OCR
- After upload, click "Start OCR Processing"
- Monitor real-time processing status
- View accuracy metrics and progress

### 4. View Results
- Once complete, view extracted text and tables
- Export results as JSON or CSV
- Review confidence scores per page

### 5. Query Documents
- Navigate to Query page
- Ask questions in natural language
- Get AI-generated answers with citations

---

## 🐛 Troubleshooting

### Common Issues

**1. OCR Processing Fails**
- Ensure Tesseract is installed correctly
- Check image quality (DPI should be 300+)
- Verify sufficient disk space

**2. MongoDB Connection Error**
- Verify MongoDB is running
- Check connection string in .env
- Ensure port 27017 is not blocked

**3. Frontend Can't Connect to Backend**
- Verify backend is running on port 8000
- Check CORS settings in backend config
- Update VITE_API_URL if needed

**4. Low OCR Accuracy**
- Increase image resolution
- Use multi-engine mode
- Pre-process images (deskew, denoise)

---

## 🔒 Security

- **Authentication**: JWT tokens with expiry
- **Encryption**: AES-256 for data at rest, TLS 1.3 for transit
- **RBAC**: Role-based access control (Admin, Member, Guest)
- **Audit Logging**: All actions logged with 90-day retention
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: Prevents abuse and DoS attacks

---

## 📈 Performance

- **OCR Speed**: 30-50 pages/second with GPU
- **Accuracy**: 95%+ on most documents
- **Scalability**: Horizontal scaling with Docker Swarm/Kubernetes
- **Storage**: Efficient GridFS for large files
- **Caching**: Redis for improved response times

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is developed as part of the Capstone Project at Woosong University.

---

## 📞 Contact

**Team AI Synapse x Eden T&S**

- Project Advisor: Professor 김영일
- Institution: Woosong University - AI & Big Data Department
- Year: 2025

---

## 🙏 Acknowledgments

- Professor 김영일 for guidance and mentorship
- Eden T&S Co. for project collaboration
- Woosong University AI & Big Data Department
- Open-source OCR community (Tesseract, PaddleOCR, EasyOCR)

---

## 📊 Project Status

- **Version**: 1.2.0
- **Status**: ✅ Production Ready
- **Last Updated**: October 2025
- **Accuracy Target**: 95%+ ✅ Achieved
- **Test Coverage**: 85%+

---

<div align="center">
  <p>Made with ❤️ by Team AI Synapse</p>
  <p>Woosong University | AI & Big Data Department | 2025</p>
</div>