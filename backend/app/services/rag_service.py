from typing import List, Dict, Optional
import openai
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
from datetime import datetime

from ..models.query import QueryRequest, QueryResponse, Citation
from ..config import settings
from .embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

class RAGService:
    """Retrieval-Augmented Generation service"""
    
    def __init__(self, db: AsyncIOMotorDatabase, embedding_service: EmbeddingService):
        self.db = db
        self.embedding_service = embedding_service
        self.embeddings_collection = db.embeddings
        openai.api_key = settings.OPENAI_API_KEY
    
    async def retrieve_relevant_chunks(
        self,
        query: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 5
    ) -> List[Dict]:
        """Retrieve most relevant text chunks for query"""
        # Generate query embedding
        query_embedding = await self.embedding_service.generate_embedding(query)
        
        if not query_embedding:
            return []
        
        # Build query filter
        filter_query = {}
        if document_ids:
            filter_query['document_id'] = {'$in': document_ids}
        
        # Retrieve all embeddings (in production, use vector search)
        cursor = self.embeddings_collection.find(filter_query)
        all_embeddings = await cursor.to_list(length=1000)
        
        # Calculate similarities
        similarities = []
        for emb_doc in all_embeddings:
            similarity = self.embedding_service.cosine_similarity(
                query_embedding,
                emb_doc['embedding']
            )
            
            similarities.append({
                'similarity': similarity,
                'document': emb_doc
            })
        
        # Sort by similarity and get top K
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        top_results = similarities[:top_k]
        
        return [result['document'] for result in top_results]
    
    async def generate_answer(
        self,
        query: str,
        context_chunks: List[Dict]
    ) -> tuple[str, List[Citation]]:
        """Generate answer using GPT-4 with retrieved context"""
        # Build context from chunks
        context_parts = []
        citations = []
        
        for idx, chunk in enumerate(context_chunks):
            context_parts.append(f"[{idx+1}] {chunk['text']}")
            
            citations.append(Citation(
                document_id=chunk.get('document_id', ''),
                page_number=chunk.get('page_number', 0),
                table_id=chunk.get('metadata', {}).get('table_id'),
                text_snippet=chunk['text'][:200] + "..." if len(chunk['text']) > 200 else chunk['text'],
                confidence=chunk.get('metadata', {}).get('confidence', 0.0)
            ))
        
        context = "\n\n".join(context_parts)
        
        # Create prompt
        prompt = f"""You are an AI assistant helping analyze document content. 
Use the following context to answer the user's question. 
If you cannot answer based on the context, say so clearly.
Always cite your sources using [number] notation.

Context:
{context}

Question: {query}

Answer:"""
        
        try:
            response = openai.ChatCompletion.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful document analysis assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            answer = response.choices[0].message.content.strip()
            return answer, citations
        
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return "I apologize, but I encountered an error generating an answer.", []
    
    async def process_query(
        self,
        query_request: QueryRequest,
        user_id: str
    ) -> QueryResponse:
        """Process a complete RAG query"""
        start_time = datetime.utcnow()
        
        try:
            # Retrieve relevant chunks
            relevant_chunks = await self.retrieve_relevant_chunks(
                query_request.query,
                query_request.document_ids,
                query_request.top_k
            )
            
            if not relevant_chunks:
                return QueryResponse(
                    query=query_request.query,
                    answer="I couldn't find relevant information to answer your question.",
                    citations=[],
                    confidence=0.0,
                    processing_time=0.0
                )
            
            # Generate answer
            answer, citations = await self.generate_answer(
                query_request.query,
                relevant_chunks
            )
            
            # Calculate overall confidence
            avg_confidence = sum(c.confidence for c in citations) / len(citations) if citations else 0.0
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            response = QueryResponse(
                query=query_request.query,
                answer=answer,
                citations=citations,
                confidence=avg_confidence,
                processing_time=processing_time
            )
            
            # Save query history
            await self._save_query_history(user_id, response)
            
            return response
        
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return QueryResponse(
                query=query_request.query,
                answer="An error occurred while processing your query. Please try again.",
                citations=[],
                confidence=0.0,
                processing_time=(datetime.utcnow() - start_time).total_seconds()
            )
    
    async def _save_query_history(self, user_id: str, response: QueryResponse):
        """Save query to history"""
        try:
            query_doc = {
                'user_id': user_id,
                'query': response.query,
                'answer': response.answer,
                'citations': [c.dict() for c in response.citations],
                'confidence': response.confidence,
                'timestamp': datetime.utcnow()
            }
            
            await self.db.query_history.insert_one(query_doc)
        except Exception as e:
            logger.error(f"Error saving query history: {e}")