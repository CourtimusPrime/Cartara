import streamlit as st
import asyncio
import websockets
import json
import threading
import time
from typing import List, Dict
import requests

# Page configuration
st.set_page_config(
    page_title="Cartara - Geopolitical AI Chat",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []

if "ws_connected" not in st.session_state:
    st.session_state.ws_connected = False

if "current_response" not in st.session_state:
    st.session_state.current_response = ""

if "is_generating" not in st.session_state:
    st.session_state.is_generating = False

# Custom CSS for better styling
st.markdown("""
<style>
    .stChatMessage > div > div > div > div:nth-child(1) {
        font-weight: 600;
    }
    
    .assistant-message {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 10px;
        margin: 5px 0;
    }
    
    .user-message {
        background-color: #e1f5fe;
        border-radius: 10px;
        padding: 10px;
        margin: 5px 0;
        text-align: right;
    }
    
    .connection-status {
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        z-index: 999;
    }
    
    .connected {
        background-color: #4caf50;
        color: white;
    }
    
    .disconnected {
        background-color: #f44336;
        color: white;
    }
</style>
""", unsafe_allow_html=True)

def stream_response_from_backend(prompt: str, history: List[Dict], placeholder):
    """Send message to FastAPI backend and stream response in real-time"""
    try:
        # Prepare history in the correct format
        formatted_history = []
        for msg in history[-5:] if history else []:
            formatted_history.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Send request to FastAPI backend
        response = requests.post(
            "http://localhost:8000/chat",
            json={
                "prompt": prompt,
                "history": formatted_history
            },
            stream=True,
            timeout=30
        )
        
        if response.status_code == 200:
            full_response = ""
            for chunk in response.iter_content(chunk_size=8, decode_unicode=True):
                if chunk:
                    full_response += chunk
                    # Update the placeholder with streaming text
                    placeholder.markdown(full_response + "▊")
                    time.sleep(0.02)  # Small delay for smooth streaming effect
            
            # Final response without cursor
            placeholder.markdown(full_response)
            return full_response.strip()
        else:
            error_msg = f"Error: Backend returned status {response.status_code}"
            placeholder.error(error_msg)
            return error_msg
            
    except requests.exceptions.RequestException as e:
        error_msg = f"Connection error: {str(e)}"
        placeholder.error(error_msg)
        return error_msg

# Sidebar configuration
with st.sidebar:
    st.title("🗺️ Cartara Chat")
    st.markdown("**Geopolitical AI Assistant**")
    
    # Connection status
    if st.session_state.ws_connected:
        st.success("🟢 Connected")
    else:
        st.error("🔴 Disconnected")
    
    st.markdown("---")
    
    # Chat controls
    if st.button("🗑️ Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()
    
    st.markdown("---")
    
    # Globe visualization placeholder
    st.markdown("### 🌍 Globe View")
    st.info("Globe visualization would be integrated here")
    
    # Country inputs
    country1 = st.text_input("Country 1", placeholder="Enter country name")
    country2 = st.text_input("Country 2", placeholder="Enter country name")
    
    line_color = st.selectbox(
        "Connection Color",
        ["Red", "Green", "Blue", "White"],
        index=0
    )

# Main chat interface
st.title("🗺️ Cartara - Geopolitical AI Chat")

# Display connection status
connection_class = "connected" if st.session_state.ws_connected else "disconnected"
connection_text = "Connected" if st.session_state.ws_connected else "Disconnected"
st.markdown(f'<div class="connection-status {connection_class}">{connection_text}</div>', unsafe_allow_html=True)

# Chat container
chat_container = st.container()

with chat_container:
    # Display existing messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Display current streaming response
    if st.session_state.current_response and st.session_state.is_generating:
        with st.chat_message("assistant"):
            st.markdown(st.session_state.current_response + "▊")

# Chat input
if prompt := st.chat_input("Ask me about geopolitics and current events..."):
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})
    
    # Display user message
    with st.chat_message("user"):
        st.markdown(prompt)
    
    # Generate assistant response
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        
        try:
            st.session_state.is_generating = True
            
            # Prepare conversation history for context
            conversation_history = []
            for msg in st.session_state.messages[:-1]:  # Exclude the current message
                conversation_history.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            # Get streaming response from FastAPI backend
            response_content = stream_response_from_backend(
                prompt, 
                conversation_history, 
                message_placeholder
            )
            
            # Add assistant message to chat history
            if response_content and not response_content.startswith("Error:") and not response_content.startswith("Connection error:"):
                st.session_state.messages.append({"role": "assistant", "content": response_content})
            
        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            message_placeholder.error(error_msg)
            st.session_state.messages.append({"role": "assistant", "content": error_msg})
        
        finally:
            st.session_state.is_generating = False
            st.session_state.current_response = ""

# Footer
st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #666; font-size: 14px;'>
        🗺️ Cartara - Powered by OpenAI GPT-3.5 Turbo | 
        Built with Streamlit & FastAPI
    </div>
    """, 
    unsafe_allow_html=True
)

# Auto-refresh to check connection status (optional)
if not st.session_state.ws_connected:
    # Try to ping backend health endpoint
    try:
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code == 200:
            st.session_state.ws_connected = True
        else:
            st.session_state.ws_connected = False
    except:
        st.session_state.ws_connected = False