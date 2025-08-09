from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
from typing import List, Dict
from agents.agent_chain import AgentChainOrchestrator

load_dotenv()

app = FastAPI()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
agent_chain = AgentChainOrchestrator()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
                prompt = message_data.get("prompt", data)
                conversation_history = message_data.get("history", [])
                
                # Build messages with conversation context (last 5 messages)
                messages = [{"role": "system", "content": "You are an expert of geopolitics and current events."}]
                
                # Add conversation history (last 5 messages for context)
                if conversation_history:
                    # Take last 5 messages to keep context manageable
                    recent_history = conversation_history[-5:]
                    messages.extend(recent_history)
                
                # Add current user message
                messages.append({"role": "user", "content": prompt})
                
                stream = await client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    stream=True,
                )
                
                async for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        await websocket.send_text(content)
                        await asyncio.sleep(0.01)
                
                # Send end-of-stream signal
                await websocket.send_text("[DONE]")
                        
            except json.JSONDecodeError:
                # If not JSON, treat as plain text prompt
                stream = await client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": data}],
                    stream=True,
                )
                
                async for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        await websocket.send_text(content)
                        await asyncio.sleep(0.01)
                
                # Send end-of-stream signal
                await websocket.send_text("[DONE]")
                        
            except Exception as e:
                await websocket.send_text(f"Error: {str(e)}")
                
    except WebSocketDisconnect:
        pass

# Pydantic models for API
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    prompt: str
    history: List[ChatMessage] = []

class NewsAnalysisRequest(BaseModel):
    question: str

class NewsAnalysisResponse(BaseModel):
    success: bool
    data: Dict = None
    error: Dict = None

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """HTTP endpoint for Streamlit chat interface"""
    try:
        # Build messages with conversation context
        messages = [{"role": "system", "content": "You are an expert of geopolitics and current events."}]
        
        # Add conversation history (last 5 messages for context)
        if request.history:
            # Take last 5 messages to keep context manageable
            recent_history = request.history[-5:]
            for msg in recent_history:
                messages.append({"role": msg.role, "content": msg.content})
        
        # Add current user message
        messages.append({"role": "user", "content": request.prompt})
        
        # Generate streaming response
        async def generate_response():
            stream = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                stream=True,
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    yield content
        
        return StreamingResponse(generate_response(), media_type="text/plain")
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/analyze-news", response_model=NewsAnalysisResponse)
async def analyze_news(request: NewsAnalysisRequest):
    """
    Analyze current events using the agent chain system.
    
    Processes a natural language question through:
    1. Transformer Agent - extracts keywords
    2. Researcher Agent - fetches relevant articles from reputable sources
    3. Summarizer Agent - creates coherent summary
    4. Keyword Extractor Agent - identifies countries and relationships
    5. Divider Agent - creates structured paragraph output
    """
    try:
        result = await agent_chain.process_question(request.question)
        return NewsAnalysisResponse(
            success=result["success"],
            data=result.get("data"),
            error=result.get("error")
        )
    except Exception as e:
        return NewsAnalysisResponse(
            success=False,
            error={"type": "server_error", "message": str(e)}
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)