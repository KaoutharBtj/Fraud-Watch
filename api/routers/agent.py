# api/routers/agent.py
# ─────────────────────────────────────────────────────────────────────────────
# Exposes chat_agent.py (the text-to-SQL analyst assistant, previously a
# CLI-only tool) as protected API endpoints, backed by Postgres so an
# analyst's conversations survive page reloads, navigation, and logouts
# until they explicitly delete them.
#
# Schema (see init.sql):
#   agent_conversations  — one row per chat thread, owned by an analyst
#   agent_messages       — one row per message, FK to its conversation
#                           with ON DELETE CASCADE (deleting a conversation
#                           deletes its messages automatically)
# ─────────────────────────────────────────────────────────────────────────────
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from db import get_db
from auth import get_current_analyst
from chat_agent import chat as run_chat_agent

router = APIRouter(
    prefix="/agent",
    tags=["agent"],
    dependencies=[Depends(get_current_analyst)],
)

TITLE_MAX_LEN = 60


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[int] = Field(
        None, description="Existing conversation to continue; omit to start a new one"
    )


class ChatResponse(BaseModel):
    answer: str
    conversation_id: int


class ConversationSummary(BaseModel):
    id: int
    title: str
    updated_at: datetime


class ConversationMessage(BaseModel):
    role: str
    content: str
    created_at: datetime


def _make_title(question: str) -> str:
    q = question.strip()
    return q if len(q) <= TITLE_MAX_LEN else q[:TITLE_MAX_LEN].rstrip() + "…"


def _create_conversation(cur, analyst_username: str, first_question: str) -> int:
    cur.execute(
        "INSERT INTO agent_conversations (analyst_username, title) VALUES (%s, %s) RETURNING id",
        (analyst_username, _make_title(first_question)),
    )
    return cur.fetchone()["id"]


def _assert_owns_conversation(cur, conversation_id: int, analyst_username: str):
    cur.execute(
        "SELECT id FROM agent_conversations WHERE id = %s AND analyst_username = %s",
        (conversation_id, analyst_username),
    )
    if cur.fetchone() is None:
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    payload: ChatRequest,
    cur=Depends(get_db),
    analyst=Depends(get_current_analyst),
):
    """
    Ask the fraud chat agent a question, persisting both the question and
    the answer to the database. If conversation_id is omitted, a new
    conversation is created (titled from this first question); otherwise
    the message is appended to the existing thread the analyst owns.
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question must not be empty")

    if payload.conversation_id is not None:
        _assert_owns_conversation(cur, payload.conversation_id, analyst["username"])
        conversation_id = payload.conversation_id
    else:
        conversation_id = _create_conversation(cur, analyst["username"], question)

    # Persist the analyst's question immediately, so it's never lost even
    # if the agent call below fails.
    cur.execute(
        "INSERT INTO agent_messages (conversation_id, role, content) VALUES (%s, 'user', %s)",
        (conversation_id, question),
    )
    cur.connection.commit()

    try:
        answer = await run_in_threadpool(run_chat_agent, question)
    except Exception as e:
        answer = f"Agent failed: {e}"
        cur.execute(
            "INSERT INTO agent_messages (conversation_id, role, content) VALUES (%s, 'agent', %s)",
            (conversation_id, answer),
        )
        cur.execute(
            "UPDATE agent_conversations SET updated_at = NOW() WHERE id = %s", (conversation_id,)
        )
        cur.connection.commit()
        raise HTTPException(status_code=502, detail=answer)

    cur.execute(
        "INSERT INTO agent_messages (conversation_id, role, content) VALUES (%s, 'agent', %s)",
        (conversation_id, answer),
    )
    cur.execute(
        "UPDATE agent_conversations SET updated_at = NOW() WHERE id = %s", (conversation_id,)
    )
    cur.connection.commit()

    return ChatResponse(answer=answer, conversation_id=conversation_id)


@router.get("/conversations", response_model=List[ConversationSummary])
def list_conversations(cur=Depends(get_db), analyst=Depends(get_current_analyst)):
    """This analyst's conversations, most recently active first."""
    cur.execute(
        """
        SELECT id, title, updated_at
        FROM agent_conversations
        WHERE analyst_username = %s
        ORDER BY updated_at DESC
        LIMIT 50
        """,
        (analyst["username"],),
    )
    return cur.fetchall()


@router.get("/conversations/{conversation_id}/messages", response_model=List[ConversationMessage])
def get_conversation_messages(
    conversation_id: int, cur=Depends(get_db), analyst=Depends(get_current_analyst)
):
    """Full message history for one conversation, oldest first."""
    _assert_owns_conversation(cur, conversation_id, analyst["username"])
    cur.execute(
        """
        SELECT role, content, created_at
        FROM agent_messages
        WHERE conversation_id = %s
        ORDER BY created_at ASC
        """,
        (conversation_id,),
    )
    return cur.fetchall()


@router.delete("/conversations/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: int, cur=Depends(get_db), analyst=Depends(get_current_analyst)
):
    """
    Delete a conversation. ON DELETE CASCADE (see init.sql) removes every
    message in it automatically — this single statement is all that's
    needed, no separate cleanup of agent_messages required.
    """
    cur.execute(
        "DELETE FROM agent_conversations WHERE id = %s AND analyst_username = %s",
        (conversation_id, analyst["username"]),
    )
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    cur.connection.commit()