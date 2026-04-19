# UniSync - Campus Event & Assessment Lifecycle Platform

UniSync is a comprehensive platform designed for universities to manage the entire lifecycle of student events, hackathons, and assessments. It bridges the gap between event coordination and technical evaluation through AI-integrated judge engines.

## 🎯 Chosen Vertical
**Education & Innovation Management (EdTech)**
UniSync targets the higher education vertical, specifically focusing on STEM departments, coding clubs, and university placement cells that require structured platforms to host hackathons and technical competitions.

## 🚀 Technical Approach
UniSync is built using a modern **MERN (MongoDB, Express, React, Node.js)** stack, optimized for performance and real-time interaction.
- **Frontend**: A high-fidelity React interface using Glassmorphism design principles and CSS3 custom tokens for a premium, modern feel.
- **Backend**: A robust Node/Express API that manages complex document relationships (Events, Registrations, Submissions).
- **AI Integration**: Leverages the **Google Gemini AI (3.1 Flash Lite)** via a centralized service to provide:
  - Adaptive study roadmaps for students.
  - Strict automated code evaluation based on input/output test cases.
  - Qualitative feedback on project submissions.

## 🧠 Core Logic & Features
1. **Event Lifecycle Management**: Admins have full CRUD control over events, including a cascading deletion system that automatically purges associated registrations and submissions to maintain data integrity.
2. **AI-Powered Assessment**:
   - **MCQ Round**: Instant validation against defined correct indices.
   - **IDE Challenge**: Students write code in a feature-rich editor. The backend sends this code along with admin-defined test cases to Gemini AI, which acts as a "strict judge" to determine pass/fail ratios.
3. **Security Architecture**:
   - Authentication uses **BCrypt (10 rounds)** for secure password hashing.
   - Token-based access control (JWT) ensures role-based permissioning (Admin vs. Student).
4. **Visual Experience**: Integrated Lightbox features for event posters and uncropped image displays for better student engagement.

## 🛠️ How the Solution Works
1. **Creation**: An Admin creates an event, chooses the type (Online/Offline), and configures the Assessment Builder (MCQs and Coding Challenges with test cases).
2. **Engagement**: Students browse events, generate AI roadmaps to prepare, and register for their chosen competitions.
3. **Execution**: During the event, students use the Live Assessment interface to take tests. Coding submissions are simulated/evaluated via the AI service.
4. **Evaluation**: Admins monitor the leaderboard, which is populated by weighted scores from MCQ performance and AI-validated code efficiency.

## 📝 Assumptions
- **Direct Asset Links**: It is assumed that administrators provide direct image URLs for posters (ending in .png, .jpg, etc.) to ensure correct rendering without cross-origin issues.
- **Internet Connectivity**: Constant connectivity is required for the AI service calls (Gemini API) and database synchronization.
- **Environment**: The solution assumes a `.env` file is configured with a valid `MONGODB_URI` and `GEMINI_API_KEY`.
- **Admin Integrity**: The AI evaluation assumes that test cases provided by admins are logically correct for the problem statement.

## 💻 Tech Stack
- **Frontend**: React 18, Vite, Axios, Lucide Icons, Vanilla CSS (Glassmorphism).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas (Mongoose ODM).
- **Security**: BCryptJS (Hashing), JSON Web Tokens (JWT).
- **AI Engine**: Google Gemini 3.1 Flash-Lite (via @google/genai).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A MongoDB Atlas account/cluster
- A Google AI (Gemini) API Key

### 1. Clone the Repository
```bash
git clone https://github.com/Satvik42/Unisync-ai.git
cd Unisync-ai
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder:
   ```env
   PORT=5005
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_secret_string
   ```
4. **Seed Demo Accounts** (Required for the first run):
   ```bash
   node seedUsers.js
   ```
5. Start the server:
   ```bash
   node server.js
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 4. Access the Application
- **Frontend**: Open `http://localhost:5173`
- **Backend API**: `http://localhost:5005/api`

---
Developed as a high-fidelity solution for student innovation and university technical management.
