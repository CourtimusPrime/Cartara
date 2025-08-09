import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List

from pydantic import BaseModel


class AgentInput(BaseModel):
    data: Any
    metadata: Dict[str, Any] = {}


class AgentOutput(BaseModel):
    data: Any
    metadata: Dict[str, Any] = {}
    success: bool = True
    error_message: str | None = None


class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"agent.{name}")

    @abstractmethod
    async def process(self, input_data: AgentInput) -> AgentOutput:
        pass

    def log_info(self, message: str):
        self.logger.info(f"[{self.name}] {message}")

    def log_error(self, message: str):
        self.logger.error(f"[{self.name}] {message}")

    def create_output(
        self,
        data: Any,
        metadata: Dict[str, Any] = None,
        success: bool = True,
        error_message: str | None = None,
    ) -> AgentOutput:
        return AgentOutput(
            data=data, metadata=metadata or {}, success=success, error_message=error_message
        )
