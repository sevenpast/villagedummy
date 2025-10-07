# Supabase Document Classification Architecture

## 🏗️ Architecture Overview

This implementation follows the correct Supabase pattern:

- **Binary files**: Stored in Supabase Storage (private bucket)
- **Metadata**: Stored in Postgres with proper RLS
- **Classification**: Edge Function with heuristics + Gemini fallback
- **Jobs**: Queue-based processing for scalability

## 📊 Database Schema

### Documents Table
```sql
- id: uuid (primary key)
- user_id: uuid (foreign key to auth.users)
- storage_bucket: text (default: 'documents')
- storage_path: text (e.g., 'user_id/uuid/filename.pdf')
- mime_type: text
- size_bytes: bigint
- status: text (uploaded|processing|done|error)
- primary_tag: text (e.g., 'passport')
- secondary_tags: text[]
- confidence: numeric (0-1)
- signals: jsonb (heuristics + model results)
- error_message: text
- created_at: timestamptz
- updated_at: timestamptz
```

### Classification Jobs Table
```sql
- id: bigserial (primary key)
- document_id: uuid (foreign key to documents)
- created_at: timestamptz
- locked_at: timestamptz
- attempts: int
```

### Review Queue Table
```sql
- id: bigserial (primary key)
- document_id: uuid (foreign key to documents)
- reason: text
- created_at: timestamptz
```

## 🔄 Classification Flow

1. **Upload**: Client uploads file → Storage + DB record
2. **Trigger**: Auto-enqueue classification job
3. **Processing**: Edge Function processes job
4. **Heuristics**: Apply regex rules first
5. **AI Fallback**: Call Gemini only if uncertain
6. **Result**: Update document with classification
7. **Review**: Low-confidence docs go to review queue

## 🎯 Heuristics (Cost-Effective)

### High Confidence (0.9+)
- **MRZ Detection**: Machine Readable Zone regex
- **Passport Keywords**: "passport", "reisepass"
- **ID Keywords**: "identity", "ausweis"

### Medium Confidence (0.7-0.9)
- **Invoice Keywords**: "invoice", "rechnung"
- **Receipt Keywords**: "receipt", "kassenbon"
- **Contract Keywords**: "contract", "vertrag"
- **Resume Keywords**: "cv", "resume", "lebenslauf"
- **IBAN Detection**: Swiss bank account regex

### Low Confidence (0.3-0.7)
- **File Type**: Image vs PDF
- **Filename**: Basic pattern matching

## 🤖 Gemini Integration

- **Model**: gemini-1.5-pro
- **Trigger**: Only when heuristic confidence < 0.85
- **Input**: Base64 file + OCR text (optional)
- **Output**: JSON with label, confidence, reasons
- **Fallback**: "unknown" if parsing fails

## 🔒 Security & Privacy

- **RLS**: Users only see their own documents
- **Storage**: Private bucket with signed URLs
- **Service Role**: Edge Function uses service key
- **Audit**: Log document_id, user_id, classification
- **GDPR**: Delete cascade for user data

## 📈 Performance & Costs

### Cost Optimization
- **Heuristics First**: 80% of docs classified without AI
- **Selective OCR**: Only for uncertain documents
- **Batch Processing**: Queue-based for efficiency
- **Caching**: Reuse results for similar documents

### Scalability
- **Async Processing**: Non-blocking uploads
- **Job Queue**: Handle high volume
- **Retry Logic**: Failed jobs retry automatically
- **Monitoring**: Track success rates and costs

## 🚀 Deployment

1. **Run Migrations**: `supabase db push`
2. **Set Secrets**: GEMINI_API_KEY, SUPABASE_URL, SERVICE_KEY
3. **Deploy Function**: `supabase functions deploy classify-document`
4. **Create Bucket**: 'documents' bucket in Storage
5. **Update Client**: Use upload-v2 API

## 📊 Monitoring

### Key Metrics
- **Classification Accuracy**: Heuristic vs Gemini results
- **Cost per Document**: Gemini API usage
- **Processing Time**: Job queue performance
- **Error Rates**: Failed classifications

### Review Queue
- **Low Confidence**: < 0.75 confidence
- **Human Review**: Manual correction interface
- **Feedback Loop**: Improve heuristics based on corrections

## 🔧 Configuration

### Environment Variables
```bash
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Classification Thresholds
- **High Confidence**: ≥ 0.85 (skip Gemini)
- **Review Threshold**: < 0.75 (human review)
- **Retry Attempts**: 3 max per job

## 📝 API Endpoints

### Client APIs
- `POST /api/documents/upload-v2` - Upload with new architecture
- `GET /api/documents/load-v2` - Load documents with classifications
- `DELETE /api/documents/delete` - Delete document and storage

### Edge Function
- `POST /functions/v1/classify-document` - Process classification job

## 🎯 Benefits

1. **Cost Effective**: 80% reduction in AI API calls
2. **Robust**: Multiple fallback mechanisms
3. **Scalable**: Queue-based processing
4. **Secure**: Proper RLS and private storage
5. **Maintainable**: Clear separation of concerns
6. **Extensible**: Easy to add new heuristics or models
