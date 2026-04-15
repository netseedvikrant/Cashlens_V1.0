import * as pdfjs from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const fileToImage = async (file) => {
  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
  } else {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
};

export const parseInvoiceWithAI = async (base64DataUrl, apiKey) => {
  console.log('Step 1: Running Local OCR (Tesseract)...');
  
  // 1. Perform OCR locally in the browser to get raw text
  const { data: { text } } = await Tesseract.recognize(base64DataUrl, 'eng', {
    logger: m => console.log('OCR Progress:', m.status, Math.round(m.progress * 100) + '%')
  });

  if (!text || text.trim().length < 10) {
    throw new Error('OCR failed to extract any meaningful text from the image.');
  }

  console.log('OCR Extracted Text:', text.substring(0, 100) + '...');
  console.log('Step 2: Sending text to Versatile LLM (llama-3.3-70b-versatile)...');

  // 2. Send the extracted text to the "Versatile" model (the same one used for insights)
  // This avoids the "message content must be string" error because we send text only.
  const prompt = `You are a professional financial data extractor. I have extracted text from an invoice using OCR. 
  Carefully analyze the text and extract the following data:
  1. amount: The total transaction amount (as a flat number). Look for "Total", "Amount Due", or "Grand Total".
  2. date: The actual transaction date found in the invoice (format: YYYY-MM-DD). Look for "Date", "Transaction Date", or "Issued On". 
  3. category: Exactly one of: Food & Drink, Transport, Housing, Health, Entertainment, Shopping, Education, or Other.
  4. currency: The currency code (EUR, USD, GBP, INR). search for symbols (€, $, £, ₹) or codes.
  5. vendor: The store, restaurant, or merchant name (usually at the very top of the invoice).
  
  IMPORTANT: The date MUST be the date from the invoice itself. If you cannot find any date, return "2026-01-01" as a indicator that parsing failed, do NOT use today's date.
  
  OCR TEXT:
  """
  ${text}
  """
  
  Return ONLY a valid JSON object.
  Example: {"amount": 150.00, "date": "2026-04-13", "category": "Food & Drink", "currency": "INR", "vendor": "Starbucks"}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // Using the same model as insights
      messages: [
        {
          role: 'user',
          content: prompt // Using a string content to ensure compatibility
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error?.message || 'Groq API request failed');
  }

  const data = await response.json();
  if (data.choices && data.choices[0]) {
    try {
      return JSON.parse(data.choices[0].message.content);
    } catch {
      throw new Error('AI returned malformed JSON');
    }
  }
  
  throw new Error('Incomplete response from AI');
};
