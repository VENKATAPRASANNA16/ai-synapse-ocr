import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { queryService } from '../services/queryService';
import Loading from '../components/Common/Loading';
import axios from 'axios';

const ResultsPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [zoom, setZoom] = useState(100);
	const [currentPage, setCurrentPage] = useState(1);
	const [document, setDocument] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [queryText, setQueryText] = useState('');
	const [queryResult, setQueryResult] = useState(null);
	const [queryLoading, setQueryLoading] = useState(false);
	const [conversationHistory, setConversationHistory] = useState([]);

	useEffect(() => {
		if (id) {
			loadDocument();
		}
	}, [id]);

	// Auto-refresh if document is processing
	useEffect(() => {
		if (error && error.includes('still processing')) {
			const interval = setInterval(() => {
				loadDocument();
			}, 5000);

			return () => clearInterval(interval);
		}
	}, [error, id]);

	const loadDocument = async () => {
		try {
			setLoading(true);
			setError(null);

			// Validate ID format
			if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
				setError('Invalid document ID format');
				setLoading(false);
				return;
			}

			console.log('📥 Loading document:', id);

			// Get processing status first
			const statusResponse = await axios.get(`/api/ocr/${id}/status`);
			const status = statusResponse.data;

			console.log('📊 Document status:', status);

			// Handle different statuses
			if (status.status === 'uploaded') {
				setError('Document uploaded but processing not started. Click "Start Processing" to begin.');
				setLoading(false);
				return;
			}

			if (['preprocessing', 'ocr_processing', 'table_extraction', 'embedding_generation'].includes(status.status)) {
				setError(`Document is still processing (${status.status.replace('_', ' ')}). Please wait...`);
				setLoading(false);
				return;
			}

			if (status.status === 'failed') {
				setError(`Processing failed: ${status.error_message || 'Unknown error'}`);
				setLoading(false);
				return;
			}

			// If completed, get full results
			if (status.status === 'completed') {
				const resultsResponse = await axios.get(`/api/ocr/${id}/results`);
				const data = resultsResponse.data;
				
				console.log('✅ Document loaded:', data);
				setDocument(data);
				
				if (data.ocr_results && data.ocr_results.length > 0) {
					setCurrentPage(1);
				}
			}

		} catch (err) {
			console.error('❌ Error loading document:', err);
			
			// Handle specific errors
			if (err.response?.status === 404) {
				setError('Document not found');
			} else if (err.response?.status === 403) {
				setError('Access denied');
			} else if (err.response?.status === 400) {
				setError(err.response?.data?.detail || 'Document processing not completed');
			} else {
				setError(err.response?.data?.detail || err.message || 'Failed to load document');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleStartProcessing = async () => {
		try {
			setLoading(true);
			setError(null);
			
			console.log('🚀 Starting OCR processing...');
			
			await axios.post(`/api/ocr/${id}/process`);
			
			console.log('✅ Processing started');
			
			// Wait and reload
			setTimeout(() => {
				loadDocument();
			}, 2000);
			
		} catch (err) {
			console.error('❌ Failed to start processing:', err);
			setError(err.response?.data?.detail || 'Failed to start processing');
			setLoading(false);
		}
	};

	const handleQuery = async (e) => {
		e.preventDefault();
		if (!queryText.trim() || queryLoading) return;

		try {
			setQueryLoading(true);
			setError(null);
			
			console.log('🔍 Asking question:', queryText);

			// Call the query API
			const result = await queryService.askQuestion(
				id,
				queryText,
				conversationHistory
			);

			console.log('✅ Got answer:', result);

			// Add to conversation history
			setConversationHistory(prev => [
				...prev,
				{ role: 'user', content: queryText },
				{ role: 'assistant', content: result.answer }
			]);

			setQueryResult(result);
			setQueryText(''); // Clear input
			
		} catch (err) {
			console.error('❌ Query error:', err);
			setError(err.message || 'Failed to get answer');
		} finally {
			setQueryLoading(false);
		}
	};

	const handleClearQuery = () => {
		setQueryResult(null);
		setConversationHistory([]);
		setQueryText('');
	};

	if (loading) {
		return <Loading />;
	}

	if (error || !document) {
		const isProcessing = error && (
			error.includes('still processing') ||
			error.includes('preprocessing') ||
			error.includes('ocr_processing')
		);

		const isUploaded = error && error.includes('uploaded');

		return (
			<div className='h-full flex items-center justify-center bg-gray-50'>
				<div className='text-center max-w-md mx-auto p-6'>
					<div className='mb-4'>
						{isProcessing ? (
							<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4' />
						) : isUploaded ? (
							<div className='text-blue-500 text-5xl mb-4'>📄</div>
						) : (
							<div className='text-red-500 text-5xl mb-4'>⚠️</div>
						)}
					</div>
					<h2 className='text-xl font-bold text-gray-900 mb-2'>
						{isProcessing ? 'Processing Document' : isUploaded ? 'Document Ready' : 'Error'}
					</h2>
					<p className={`mb-6 ${isProcessing || isUploaded ? 'text-gray-600' : 'text-red-600'}`}>
						{error || 'Document not found'}
					</p>

					{isUploaded && (
						<button
							onClick={handleStartProcessing}
							disabled={loading}
							className='px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 mb-4'
						>
							{loading ? 'Starting...' : 'Start Processing'}
						</button>
					)}

					{isProcessing && (
						<button
							onClick={loadDocument}
							className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 mb-4'
						>
							Refresh Status
						</button>
					)}

					<div className='flex gap-3 justify-center'>
						<button
							onClick={() => navigate('/dashboard')}
							className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300'
						>
							Back to Dashboard
						</button>
						{!isProcessing && !isUploaded && (
							<button
								onClick={loadDocument}
								className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700'
							>
								Retry
							</button>
						)}
					</div>
				</div>
			</div>
		);
	}

	const currentOcrResults = document.ocr_results || [];
	const currentTables = document.tables || [];
	const currentPageResult = currentOcrResults.find(r => r.page_number === currentPage) || currentOcrResults[0];
	const totalPages = document.metadata?.page_count || currentOcrResults.length || 1;

	// Extract structured data
	const extractedData = [
		...currentOcrResults.flatMap(result => {
			const text = result.text || '';
			const financialMatches = text.match(/\$[\d,]+(?:\.\d{2})?/g) || [];
			const percentageMatches = text.match(/\d+\.?\d*%/g) || [];
			const dateMatches = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2}, \d{4}/g) || [];

			return [
				...financialMatches.map(value => ({
					category: 'Financial',
					value,
					page: result.page_number,
					confidence: Math.round(result.confidence * 100),
				})),
				...percentageMatches.map(value => ({
					category: 'Percentage',
					value,
					page: result.page_number,
					confidence: Math.round(result.confidence * 100),
				})),
				...dateMatches.map(value => ({
					category: 'Date',
					value,
					page: result.page_number,
					confidence: Math.round(result.confidence * 100),
				})),
			];
		}),
	];
	const [activeTab, setActiveTab] = useState('extracted'); // 'extracted' or 'original
	<div className="flex space-x-4 mb-6">
		<button
		onClick={() => setActiveTab('extracted')}
		className={`px-6 py-3 rounded-lg font-medium ${
			activeTab === 'extracted'
			? 'bg-blue-600 text-white'
				: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
			}`}
			>
				📄 Extracted Text
				</button>
				<button
				onClick={() => setActiveTab('original')}
				className={`px-6 py-3 rounded-lg font-medium ${
					activeTab === 'original'
					? 'bg-blue-600 text-white'
					: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
				}`}
				>
					🖼️ Original Pages
					</button>
					</div>
					{/* Conditional rendering based on tab */}
					{activeTab === 'extracted' ? (
					<div>{/* Your current extracted text view */}</div>
				) : (
				<OriginalPagesViewer
				documentId={id}
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
				/>
			)}
	const avgConfidence = currentOcrResults.length > 0
		? Math.round((currentOcrResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / currentOcrResults.length) * 100)
		: 0;

	return (
		<div className='h-full flex flex-col'>
			{/* Header */}
			<div className='bg-white border-b border-gray-200 p-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-4'>
						<button onClick={() => navigate('/dashboard')} className='text-gray-600 hover:text-gray-900'>
							← Back
						</button>
						<div>
							<h1 className='text-xl font-bold text-gray-900'>OCR Analysis Results</h1>
							<p className='text-sm text-gray-600'>{document.metadata?.original_filename || 'Document'}</p>
						</div>
					</div>
					<div className='flex items-center space-x-3'>
						<button 
							onClick={() => navigate(`/query/${id}`)}
							className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
						>
							💬 Open Chat
						</button>
					</div>
				</div>
			</div>

			<div className='flex-1 flex overflow-hidden'>
				{/* Document Preview */}
				<div className='flex-1 bg-gray-100 p-6 overflow-y-auto'>
					{/* Page Controls */}
					<div className='mb-4 flex items-center justify-between bg-white p-3 rounded-lg shadow'>
						<div className='flex items-center space-x-4'>
							<button
								onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
								disabled={currentPage === 1}
								className='px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50'
							>
								←
							</button>
							<span className='text-sm'>
								Page{' '}
								<input
									type='number'
									value={currentPage}
									onChange={e => setCurrentPage(Math.max(1, Math.min(totalPages, Number(e.target.value))))}
									className='w-12 text-center border rounded mx-1'
									min='1'
									max={totalPages}
								/>{' '}
								of {totalPages}
							</span>
							<button
								onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
								disabled={currentPage === totalPages}
								className='px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50'
							>
								→
							</button>
						</div>

						<div className='flex items-center space-x-2'>
							<button onClick={() => setZoom(Math.max(50, zoom - 10))} className='px-2 py-1 bg-gray-200 rounded'>
								-
							</button>
							<span className='text-sm w-16 text-center'>{zoom}%</span>
							<button onClick={() => setZoom(Math.min(200, zoom + 10))} className='px-2 py-1 bg-gray-200 rounded'>
								+
							</button>
						</div>
					</div>

					{/* Document Content */}
					<div className='bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto'>
						<div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
							<div className='border border-gray-300 p-8'>
								{currentPageResult ? (
									<div>
										{/* Page Header */}
										<div className='flex items-center justify-between mb-6 pb-4 border-b'>
											<div>
												<h2 className='text-2xl font-bold text-gray-900'>Page {currentPageResult.page_number}</h2>
												<p className='text-sm text-gray-500 mt-1'>
													{document.metadata?.original_filename}
												</p>
											</div>
											<div className='flex items-center space-x-3'>
												<span className='px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium'>
													{currentPageResult.engine}
												</span>
												<span className='px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium'>
													{Math.round(currentPageResult.confidence * 100)}% confident
												</span>
												{currentPageResult.processing_time && (
													<span className='px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium'>
														{currentPageResult.processing_time.toFixed(2)}s
													</span>
												)}
											</div>
										</div>

										{/* Extracted Text */}
										<div className='space-y-6'>
											<div>
												<div className='flex items-center justify-between mb-3'>
													<h3 className='font-bold text-lg text-gray-900'>📄 Extracted Text</h3>
													<button
														onClick={() => {
															navigator.clipboard.writeText(currentPageResult.text || '');
															alert('Text copied to clipboard!');
														}}
														className='text-sm text-blue-600 hover:text-blue-700 font-medium'
													>
														📋 Copy Text
													</button>
												</div>
												<div className='bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-[600px] overflow-y-auto'>
													{currentPageResult.text && currentPageResult.text.trim() ? (
														<div className='text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-mono'>
															{currentPageResult.text}
														</div>
													) : (
														<div className='text-center py-8'>
															<p className='text-gray-500 text-base mb-2'>⚠️ No text extracted from this page</p>
															<p className='text-gray-400 text-sm'>
																The page may contain only images, or the OCR could not detect readable text.
															</p>
														</div>
													)}
												</div>
												
												{/* Text Statistics */}
												{currentPageResult.text && (
													<div className='mt-3 flex items-center space-x-4 text-xs text-gray-500'>
														<span>📊 {currentPageResult.text.length} characters</span>
														<span>📝 {currentPageResult.text.split(/\s+/).filter(w => w.length > 0).length} words</span>
														<span>📄 {currentPageResult.text.split('\n').filter(l => l.trim().length > 0).length} lines</span>
													</div>
												)}
											</div>

											{/* Tables */}
											{currentTables
												.filter(t => t.page_number === currentPage)
												.map((table, idx) => (
													<div key={idx} className='mt-6'>
														<h3 className='font-bold text-lg mb-2'>Table {idx + 1}</h3>
														<div className='overflow-x-auto'>
															<table className='w-full border border-gray-300 text-sm'>
																<tbody>
																	{(table.data || []).map((row, rowIdx) => (
																		<tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
																			{row.map((cell, colIdx) => (
																				<td key={colIdx} className='border border-gray-300 p-2'>
																					{cell || '-'}
																				</td>
																			))}
																		</tr>
																	))}
																</tbody>
															</table>
														</div>
														<p className='text-xs text-gray-500 mt-2'>
															Confidence: {Math.round(table.confidence * 100)}%
														</p>
													</div>
												))}
										</div>
									</div>
								) : (
									<div className='text-center py-12'>
										<p className='text-gray-500'>No content for this page</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Sidebar */}
				<div className='w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col'>
					{/* Query Section */}
					<div className='p-4 border-b border-gray-200'>
						<div className='flex items-center justify-between mb-3'>
							<h2 className='text-lg font-bold text-gray-900'>Ask Questions</h2>
							{queryResult && (
								<button
									onClick={handleClearQuery}
									className='text-xs text-gray-500 hover:text-gray-700'
								>
									Clear
								</button>
							)}
						</div>
						
						<form onSubmit={handleQuery} className='space-y-2'>
							<textarea
								value={queryText}
								onChange={e => setQueryText(e.target.value)}
								placeholder='Ask about this document...'
								className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none'
								rows='3'
								disabled={queryLoading}
							/>
							<button
								type='submit'
								disabled={queryLoading || !queryText.trim()}
								className='w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{queryLoading ? '🔄 Processing...' : '🔍 Ask'}
							</button>
						</form>

						{/* Query Result */}
						{queryResult && (
							<div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
								<h3 className='font-semibold text-sm mb-2 text-blue-900'>Answer:</h3>
								<p className='text-sm text-gray-800 mb-3 whitespace-pre-wrap'>{queryResult.answer}</p>
								
								{queryResult.sources && queryResult.sources.length > 0 && (
									<div className='mt-3 pt-3 border-t border-blue-200'>
										<h4 className='font-semibold text-xs mb-2 text-blue-800'>Sources:</h4>
										{queryResult.sources.map((source, idx) => (
											<div key={idx} className='text-xs text-gray-600 mb-2 bg-white p-2 rounded'>
												<span className='font-medium'>Page {source.page_number}:</span>{' '}
												{source.text.substring(0, 80)}...
												<div className='text-xs text-gray-500 mt-1'>
													Confidence: {Math.round(source.confidence * 100)}%
												</div>
											</div>
										))}
									</div>
								)}
								
								<p className='text-xs text-gray-500 mt-2'>
									Confidence: {Math.round(queryResult.confidence * 100)}%
								</p>
							</div>
						)}
						
						{/* Quick Actions */}
						<div className='mt-3 pt-3 border-t border-gray-200'>
							<p className='text-xs text-gray-500 mb-2'>💡 Try asking:</p>
							<div className='space-y-1'>
								{['What is this document about?', 'Summarize the main points', 'List key findings'].map((q, i) => (
									<button
										key={i}
										onClick={() => setQueryText(q)}
										className='w-full text-left text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded'
									>
										"{q}"
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Extracted Data */}
					<div className='p-4 border-b border-gray-200'>
						<h2 className='text-lg font-bold text-gray-900'>Extracted Data</h2>
						<p className='text-sm text-gray-600 mt-1'>
							{extractedData.length} entries • {currentTables.length} tables
						</p>
					</div>

					<div className='p-4 flex-1 overflow-y-auto'>
						<div className='space-y-3'>
							{extractedData.slice(0, 15).map((item, index) => (
								<div key={index} className='bg-gray-50 p-3 rounded-lg border border-gray-200'>
									<span className='text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded'>
										{item.category}
									</span>
									<p className='text-base font-semibold text-gray-900 mt-2'>{item.value}</p>
									<div className='flex items-center justify-between text-xs text-gray-600 mt-1'>
										<span>Page {item.page}</span>
										<span>{item.confidence}%</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Statistics */}
					<div className='p-4 border-t border-gray-200'>
						<h3 className='font-semibold text-gray-900 mb-3'>Statistics</h3>
						<div className='grid grid-cols-3 gap-3 text-center'>
							<div className='bg-blue-50 p-3 rounded-lg'>
								<p className='text-2xl font-bold text-blue-600'>{extractedData.length}</p>
								<p className='text-xs text-gray-600'>Extracted</p>
							</div>
							<div className='bg-green-50 p-3 rounded-lg'>
								<p className='text-2xl font-bold text-green-600'>{avgConfidence}%</p>
								<p className='text-xs text-gray-600'>Confidence</p>
							</div>
							<div className='bg-purple-50 p-3 rounded-lg'>
								<p className='text-2xl font-bold text-purple-600'>{totalPages}</p>
								<p className='text-xs text-gray-600'>Pages</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ResultsPage;