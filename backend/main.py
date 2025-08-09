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

load_dotenv()

app = FastAPI()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)