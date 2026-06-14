import os
import time
import logging
from openai import OpenAI, AsyncOpenAI, RateLimitError, APITimeoutError, APIConnectionError
from dotenv import load_dotenv

logging.basicConfig()
logging.getLogger("httpx").setLevel(logging.DEBUG)

load_dotenv()

client = OpenAI(
    api_key=os.getenv("UPSTAGE_API_KEY"),
    base_url="https://api.upstage.ai/v1"
)

_async_client = AsyncOpenAI(
    api_key=os.getenv("UPSTAGE_API_KEY"),
    base_url="https://api.upstage.ai/v1"
)


def call_llm(system_prompt: str, user_message: str) -> str:
    response = client.chat.completions.create(
        model="solar-pro",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        timeout=30.0,
    )
    return response.choices[0].message.content


async def call_llm_async(system_prompt: str, user_message: str, call_id: str = "") -> str:
    t0 = time.perf_counter()
    print(f"[refactor] LLM 호출 레이턴시 체크 | {call_id} 시작")  # [refactor] LLM 호출 레이턴시 체크
    try:
        response = await _async_client.chat.completions.create(
            model="solar-pro",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            # timeout=30.0,
        )
        elapsed = time.perf_counter() - t0
        print(f"[refactor] LLM 호출 레이턴시 체크 | {call_id} 완료 {elapsed:.2f}s")  # [refactor] LLM 호출 레이턴시 체크
        return response.choices[0].message.content
    except RateLimitError as e:
        print(f"[refactor] LLM 호출 레이턴시 체크 | {call_id} Rate limit: {e}")  # [refactor] LLM 호출 레이턴시 체크
        raise
    except APITimeoutError as e:
        print(f"[refactor] LLM 호출 레이턴시 체크 | {call_id} Timeout (30s 초과): {e}")  # [refactor] LLM 호출 레이턴시 체크
        raise
    except APIConnectionError as e:
        print(f"[refactor] LLM 호출 레이턴시 체크 | {call_id} 연결 오류: {e}")  # [refactor] LLM 호출 레이턴시 체크
        raise
