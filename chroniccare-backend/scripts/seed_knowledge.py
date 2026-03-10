import json
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def seed_knowledge():
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "seed_knowledge.json")

    with open(json_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    async with AsyncSessionLocal() as session:
        # 기존 데이터 확인
        result = await session.execute(text("SELECT COUNT(*) FROM knowledge_vectors"))
        count = result.scalar()
        print(f"현재 knowledge_vectors 데이터 수: {count}")

        inserted = 0
        skipped = 0

        for item in items:
            # 중복 체크
            exists = await session.execute(
                text("SELECT id FROM knowledge_vectors WHERE id = :id"),
                {"id": item["id"]}
            )
            if exists.scalar():
                skipped += 1
                continue

            await session.execute(
                text("""
                    INSERT INTO knowledge_vectors (id, category, title, content, tags, severity)
                    VALUES (:id, :category, :title, :content, :tags, :severity)
                """),
                {
                    "id": item["id"],
                    "category": item["category"],
                    "title": item["title"],
                    "content": item["content"],
                    "tags": json.dumps(item.get("tags", []), ensure_ascii=False),
                    "severity": item.get("severity"),
                }
            )
            inserted += 1

        await session.commit()
        print(f"✅ 완료 — 삽입: {inserted}개, 스킵(중복): {skipped}개")


if __name__ == "__main__":
    asyncio.run(seed_knowledge())
