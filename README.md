# 🗺️ Cartara
A map-based visualizer of world news that allows you to see the relationships between countries in a new way. Ask a question about geopolitics, and Cartara will analyze the news to show you the countries involved on a 3D globe.

## Features

- 🌍 **3D Globe Visualization:** See the countries involved in a news story on an interactive 3D globe.
- 🗣️ **Natural Language Questions:** Ask questions in plain English, like "What's been going on with Ukraine?".
- 💞 **Relationship Analysis:** The connection between countries is colored to represent the nature of their relationship (e.g., conflict, alliance, trade).
- 🤖 **AI-Powered Analysis:** Cartara uses a chain of AI agents to analyze your question, research the news, and provide a summary of the event.
- **Real-time Updates:** The globe and analysis update in real-time as you ask new questions.

## Technology Stack

- **Frontend:**
  - [Next.js](https://nextjs.org/)
  - [React](https://reactjs.org/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
- **Backend:**
  - [Python](https://www.python.org/)
  - [FastAPI](https://fastapi.tiangolo.com/)
  - [OpenAI API](https://openai.com/api/)
  - [Websockets](https://fastapi.tiangolo.com/advanced/websockets/)


## 🚀 Getting Started

To get a local copy running on your machine, follow these steps:

### 📦 Prerequisites

- [Node.js](https://nodejs.org/en/) (v18.x or later)
- [Python](https://www.python.org/downloads/) (v3.9 or later)
- An [OpenAI API key](https://beta.openai.com/signup/)

### 🏗️ Installation

1. **Clone the repo:**
   ```sh
   git clone https://github.com/courtimusprime/cartara.git
   cd cartara
   ```

2. **Install frontend dependencies:**
   ```sh
   npm install
   ```

3. **Install backend dependencies:**
   ```sh
   cd backend
   uv venv .venv
   source .venv/bin/activate  # On Windows use `.venv\Scripts\activate`
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   - Create a `.env` file in the `backend` directory.
   - Add your OpenAI API key to the `.env` file:
     ```
     OPENAI_API_KEY=your_openai_api_key
     ```

### Running the Application

1. **Start the backend server:**
   ```sh
   cd backend
   source .venv/bin/activate  # If not already activated
   uvicorn main:app --reload
   ```
   The backend will be running at `http://localhost:8000`.

2. **Start the frontend development server:**
   In a new terminal, run:
   ```sh
   npm run dev
   ```
   The frontend will be running at `http://localhost:3000`.

3. **Open your browser:**
   Navigate to `http://localhost:3000` to see the application.

## Usage

- **Ask a question:** Use the prompt at the bottom of the page to ask a question about a geopolitical event.
- **Manual selection:** You can also manually select two countries from the dropdowns at the top of the page to see their relationship.
- **Explore the globe:** Click and drag the globe to rotate it. Use the scroll wheel to zoom in and out.