import os
from fastapi import APIRouter
from pydantic import BaseModel
from tavily import TavilyClient

router = APIRouter(prefix="/api", tags=["Job Hunter"])
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

class JobRequest(BaseModel):
    query: str

@router.post("/search-jobs")
async def search_jobs(request: JobRequest):
    # Search only
    targeted_query = f"{request.query} job openings hiring careers"
    search_result = tavily.search(query=targeted_query, search_depth="advanced")
    
    # Return simple structure
    jobs = [{"title": j['title'], "url": j['url'], "score": 0, "reasoning": "Pending analysis"} for j in search_result['results']]
    return {"jobs": jobs}