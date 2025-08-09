from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

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
                
                stream = await client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "system", "content": "You are an expert of geopolitics and current events."},
                              {"role": "user", "content": prompt}],
                    stream=True,
                )
                
                async for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        print(f"Streaming chunk: '{content}'")  # Debug log
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
                        print(f"Streaming chunk: '{content}'")  # Debug log
                        await websocket.send_text(content)
                        await asyncio.sleep(0.01)
                
                # Send end-of-stream signal
                await websocket.send_text("[DONE]")
                        
            except Exception as e:
                await websocket.send_text(f"Error: {str(e)}")
                
    except WebSocketDisconnect:
        pass

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)