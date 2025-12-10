from typing import List, Dict, Optional
import httpx
from pathlib import Path
import json
import numpy as np

from ..utils.database import get_database
from ..config import settings
from ..services.embedding_service import EmbeddingService
import logging

logger = logging.getLogger(__name__)

class RAGService:
    """Enhanced RAG service with semantic search using embeddings"""
    
    def __init__(self):
        self.results_dir = Path("results")
        self.api_key = settings.OPENAI_API_KEY
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        self.model = "deepseek-chat"
        self.embedding_service = EmbeddingService()
    
    async def answer_question(
        self,
        document_id: str,
        question: str,
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict:
        """Answer question using RAG with semantic search"""
        
        try:
            db = get_database()
            
            # Get document
            document = await db.documents.find_one({"_id": document_id})
            
            if not document:
                raise Exception("Document not found")
            
            logger.info(f"🔍 Processing question for document {document_id}")
            
            # STEP 1: Semantic search for relevant chunks
            relevant_chunks = await self._semantic_search(
                document_id, 
                question,
                top_k=5
            )
            
            if not relevant_chunks:
                logger.warning("No relevant chunks found, using fallback")
                return await self._fallback_answer(document, question)
            
            # STEP 2: Build context from top chunks
            context = self._build_context(relevant_chunks)
            
            logger.info(f"📄 Found {len(relevant_chunks)} relevant chunks")
            logger.info(f"📝 Context length: {len(context)} chars")
            
            # STEP 3: Generate answer
            if self.api_key and len(self.api_key) > 10:
                answer = await self._generate_with_ai(
                    question, 
                    context, 
                    conversation_history
                )
            else:
                logger.warning("⚠️ No API key, using simple answer")
                answer = self._simple_answer(question, context)
            
            # STEP 4: Build response with sources
            sources = self._build_sources(relevant_chunks)
            
            return {
                "answer": answer,
                "sources": sources,
                "confidence": self._calculate_confidence(relevant_chunks)
            }
            
        except Exception as e:
            logger.error(f"❌ RAG error: {e}", exc_info=True)
            return {
                "answer": f"I apologize, but I encountered an error: {str(e)}. Please try rephrasing your question.",
                "sources": [],
                "confidence": 0.0
            }
    
    async def _semantic_search(
        self,
        document_id: str,
        query: str,
        top_k: int = 5
    ) -> List[Dict]:
        """Search for relevant document chunks using embeddings"""
        try:
            db = get_database()
            
            # Generate query embedding
            query_embedding = await self.embedding_service.generate_embedding(query)
            
            if not query_embedding:
                logger.error("Failed to generate query embedding")
                return []
            
            # Get all document embeddings
            embeddings_cursor = db.embeddings.find({"document_id": document_id})
            embeddings = await embeddings_cursor.to_list(length=None)
            
            if not embeddings:
                logger.warning(f"No embeddings found for document {document_id}")
                return []
            
            logger.info(f"🔎 Searching through {len(embeddings)} chunks")
            
            # Calculate similarities
            scored_chunks = []
            for emb in embeddings:
                if emb.get('embedding'):
                    similarity = self.embedding_service.cosine_similarity(
                        query_embedding,
                        emb['embedding']
                    )
                    
                    scored_chunks.append({
                        'text': emb['text'],
                        'page_number': emb.get('page_number', 1),
                        'similarity': similarity,
                        'source_type': emb.get('source_type', 'text'),
                        'metadata': emb.get('metadata', {})
                    })
            
            # Sort by similarity and get top K
            scored_chunks.sort(key=lambda x: x['similarity'], reverse=True)
            top_chunks = scored_chunks[:top_k]
            
            # Log top scores (fix for Python 3.10 f-string limitation)
            top_scores = [f"{c['similarity']:.3f}" for c in top_chunks[:3]]
            logger.info(f"✅ Top similarity scores: {top_scores}")
            
            return top_chunks
            
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return []
    
    def _build_context(self, chunks: List[Dict], max_length: int = 4000) -> str:
        """Build context from relevant chunks"""
        context_parts = []
        current_length = 0
        
        for i, chunk in enumerate(chunks, 1):
            chunk_text = f"[Source {i} - Page {chunk['page_number']} - Relevance: {chunk['similarity']:.2f}]\n{chunk['text']}\n"
            
            if current_length + len(chunk_text) > max_length:
                break
            
            context_parts.append(chunk_text)
            current_length += len(chunk_text)
        
        return "\n".join(context_parts)
    
    def _build_sources(self, chunks: List[Dict]) -> List[Dict]:
        """Build source citations"""
        sources = []
        
        for chunk in chunks[:3]:  # Top 3 sources
            sources.append({
                "page_number": chunk['page_number'],
                "text": chunk['text'][:200] + "...",
                "confidence": float(chunk['similarity'])
            })
        
        return sources
    
    def _calculate_confidence(self, chunks: List[Dict]) -> float:
        """Calculate overall confidence score"""
        if not chunks:
            return 0.0
        
        # Average of top 3 similarities
        top_similarities = [c['similarity'] for c in chunks[:3]]
        return sum(top_similarities) / len(top_similarities)
    
    async def _generate_with_ai(
        self,
        question: str,
        context: str,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """Generate answer using DeepSeek AI"""
        
        try:
            # Build messages
            messages = [
                {
                    "role": "system",
                    "content": """You are a helpful AI assistant that answers questions about documents. 
                    
Rules:
1. Answer based ONLY on the provided context
2. Be concise and accurate
3. If the answer isn't in the context, say "I cannot find this information in the document"
4. Quote relevant parts when appropriate
5. Organize answers clearly with bullet points if needed"""
                },
                {
                    "role": "user",
                    "content": f"""Document Context:
{context}

---

Question: {question}

Please answer based on the document above:"""
                }
            ]
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history[-4:]:
                    if msg.get('role') in ['user', 'assistant']:
                        messages.insert(-1, {
                            "role": msg['role'],
                            "content": msg.get('content', '')[:500]
                        })
            
            logger.info(f"🤖 Calling DeepSeek API...")
            
            # Call API
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.3,  # Lower for more factual
                        "max_tokens": 1000,
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    answer = data['choices'][0]['message']['content']
                    logger.info(f"✅ AI response received ({len(answer)} chars)")
                    return answer
                else:
                    logger.error(f"API error {response.status_code}: {response.text}")
                    return self._simple_answer(question, context)
                    
        except Exception as e:
            logger.error(f"AI API error: {e}")
            return self._simple_answer(question, context)
    
    def _simple_answer(self, question: str, context: str) -> str:
        """Simple rule-based answer when AI unavailable"""
        
        question_lower = question.lower()
        
        # Extract first few sentences from context
        sentences = []
        for line in context.split('\n'):
            if line.strip() and not line.startswith('[Source'):
                sentences.append(line.strip())
                if len(sentences) >= 5:
                    break
        
        answer = '\n\n'.join(sentences[:3])
        
        if not answer:
            answer = "I found relevant information in the document, but need AI assistance to provide a better answer."
        
        # Add helpful note
        answer += "\n\n💡 *Note: For more intelligent answers, please configure the AI API key in settings.*"
        
        return answer
    
    async def _fallback_answer(self, document: Dict, question: str) -> Dict:
        """Fallback when no embeddings available"""
        
        # Try to read OCR results
        ocr_text = ""
        if document.get('ocr_results'):
            ocr_texts = [r.get('text', '') for r in document['ocr_results']]
            ocr_text = '\n\n'.join(ocr_texts)[:2000]
        
        if not ocr_text:
            ocr_text = f"Document: {document['metadata']['original_filename']}"
        
        answer = f"""I found the document, but embeddings haven't been generated yet.

Here's a preview of the content:

{ocr_text[:500]}...

Please wait for processing to complete, or try asking again in a moment."""
        
        return {
            "answer": answer,
            "sources": [],
            "confidence": 0.3
        }