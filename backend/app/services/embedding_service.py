from sentence_transformers import SentenceTransformer
from typing import List, Dict
import numpy as np
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize embedding model"""
        try:
            self.model = SentenceTransformer(model_name)
            logger.info(f"Embedding model {model_name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        try:
            if not text or not text.strip():
                return []
            
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return []
    
    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            if not texts:
                return []
            
            # Filter empty texts
            valid_texts = [t for t in texts if t and t.strip()]
            
            if not valid_texts:
                return []
            
            embeddings = self.model.encode(valid_texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            return []
    
    async def chunk_text(
        self, 
        text: str, 
        chunk_size: int = 500,
        overlap: int = 50
    ) -> List[str]:
        """Split text into overlapping chunks"""
        if not text:
            return []
        
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        
        return chunks
    
    async def create_document_embeddings(
        self,
        ocr_results: List,
        tables: List,
        chunk_size: int = 500
    ) -> List[Dict]:
        """Create embeddings for document content"""
        embeddings_data = []
        
        # Process OCR text
        for ocr_result in ocr_results:
            chunks = await self.chunk_text(ocr_result.text, chunk_size)
            
            for idx, chunk in enumerate(chunks):
                embedding = await self.generate_embedding(chunk)
                
                if embedding:
                    embeddings_data.append({
                        'text': chunk,
                        'embedding': embedding,
                        'page_number': ocr_result.page_number,
                        'chunk_index': idx,
                        'source_type': 'ocr_text',
                        'metadata': {
                            'engine': ocr_result.engine.value,
                            'confidence': ocr_result.confidence
                        }
                    })
        
        # Process table data
        for table in tables:
            # Convert table to text representation
            table_text = self._table_to_text(table)
            
            embedding = await self.generate_embedding(table_text)
            
            if embedding:
                embeddings_data.append({
                    'text': table_text,
                    'embedding': embedding,
                    'page_number': table.page_number,
                    'chunk_index': 0,
                    'source_type': 'table',
                    'metadata': {
                        'table_id': table.table_id,
                        'rows': table.rows,
                        'columns': table.columns,
                        'confidence': table.confidence
                    }
                })
        
        logger.info(f"Created {len(embeddings_data)} embeddings")
        return embeddings_data
    
    def _table_to_text(self, table) -> str:
        """Convert table data to text representation"""
        text_parts = [f"Table on page {table.page_number}:"]
        
        for row_idx, row in enumerate(table.data):
            row_text = " | ".join([str(cell) for cell in row])
            text_parts.append(f"Row {row_idx + 1}: {row_text}")
        
        return "\n".join(text_parts)
    
    def cosine_similarity(
        self, 
        embedding1: List[float], 
        embedding2: List[float]
    ) -> float:
        """Calculate cosine similarity between two embeddings"""
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))