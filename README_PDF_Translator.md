# PDF Translation and Autofill Tool 🔄📄

A powerful Python script that processes PDFs by extracting text, translating content, adding overlay translations, and auto-filling form fields. Works with both text-based and scanned PDFs using OCR.

## 🎯 Features

- **Universal PDF Support**: Works with text-based and scanned (image) PDFs
- **Smart Text Extraction**: Automatic detection with OCR fallback
- **Advanced Translation**: Gemini LLM integration with Google Translate fallback
- **Translation Overlays**: Visual overlays showing translations on original document
- **Form Autofill**: Automatic form field filling from JSON data
- **Multi-language Support**: OCR supports English, German, French, Spanish
- **Free Libraries**: Uses only open-source, free dependencies
- **Robust Error Handling**: Graceful fallbacks and detailed logging

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download the files
# Run the installation script
./install_requirements.sh

# Or install manually:
pip install PyMuPDF pytesseract Pillow PyPDF2 googletrans==4.0.0rc1
pip install google-generativeai  # Optional for Gemini

# Install Tesseract OCR:
# Ubuntu/Debian: sudo apt install tesseract-ocr
# macOS: brew install tesseract
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
```

### 2. Basic Usage

```bash
# Simple translation
python pdf_translator.py input.pdf output.pdf --lang en

# With Gemini API (recommended)
python pdf_translator.py input.pdf output.pdf --lang en --gemini-key YOUR_API_KEY

# With form autofill
python pdf_translator.py input.pdf output.pdf --lang en --fill-data sample_fill_data.json

# Custom overlay position
python pdf_translator.py input.pdf output.pdf --lang en --position bottom
```

### 3. Example Workflow

```bash
# 1. Translate German PDF to English with autofill
python pdf_translator.py german_form.pdf english_form.pdf \
  --lang en \
  --gemini-key YOUR_KEY \
  --fill-data sample_fill_data.json \
  --position right

# 2. Process scanned document (OCR automatic)
python pdf_translator.py scanned_doc.pdf translated_doc.pdf --lang de
```

## 📋 Configuration

### Sample Fill Data (sample_fill_data.json)
```json
{
  "Name": "Max Mustermann",
  "Email": "max@example.com",
  "Address": "Musterstraße 42, 12345 Berlin",
  "Phone": "+49 30 12345678",
  "Birth Date": "01.01.1990",
  "Nationality": "Deutsch"
}
```

### Gemini API Key
1. Get free API key: https://aistudio.google.com/app/apikey
2. Use with `--gemini-key YOUR_KEY` for best translations

## 🔧 Advanced Usage

### Command Line Options

```bash
python pdf_translator.py INPUT OUTPUT [OPTIONS]

Positional arguments:
  INPUT                 Input PDF file path
  OUTPUT                Output PDF file path

Options:
  --lang LANG           Target language (default: en)
                        Examples: en, de, fr, es, it, pt, nl, sv, no

  --gemini-key KEY      Gemini API key for enhanced translations

  --fill-data FILE      JSON file with auto-fill data

  --position POS        Translation overlay position
                        Choices: right, bottom, top (default: right)

  --verbose, -v         Enable verbose logging

  --help, -h            Show help message
```

### Language Codes
- `en` - English
- `de` - German (Deutsch)
- `fr` - French (Français)
- `es` - Spanish (Español)
- `it` - Italian (Italiano)
- `pt` - Portuguese (Português)
- `nl` - Dutch (Nederlands)
- `sv` - Swedish (Svenska)
- `no` - Norwegian (Norsk)

### Overlay Positions
- `right` - Translation appears on right side (default)
- `bottom` - Translation appears at bottom of page
- `top` - Translation appears at top of page

## 📊 How It Works

### 1. PDF Analysis
```
Input PDF → Document Type Detection → Text/Scanned
                ↓
Text-based: Direct extraction → Fast processing
Scanned: OCR with Tesseract → Higher quality with multiple languages
```

### 2. Translation Pipeline
```
Extracted Text → Language Detection → Translation Service
                                          ↓
Gemini LLM (Primary) ← → Google Translate (Fallback)
                                          ↓
                                    Overlay Generation
```

### 3. Output Generation
```
Original PDF + Translation Overlays + Form Field Data → Final PDF
```

## 🛠️ Technical Details

### Dependencies
- **PyMuPDF (fitz)**: PDF manipulation and text extraction
- **pytesseract**: OCR for scanned documents
- **Pillow (PIL)**: Image processing for OCR
- **PyPDF2**: Form field handling and autofill
- **googletrans**: Free Google Translate API
- **google-generativeai**: Gemini LLM integration (optional)

### System Requirements
- Python 3.8+
- Tesseract OCR binary
- 500MB+ RAM for processing
- ~100MB disk space for dependencies

### Performance
- Text-based PDFs: ~1-2 seconds per page
- Scanned PDFs: ~5-10 seconds per page (OCR)
- Gemini translation: ~2-3 seconds per page
- Google Translate: ~1 second per page

## 🔍 Troubleshooting

### Common Issues

1. **"Tesseract not found"**
   ```bash
   # Check installation
   tesseract --version

   # Install if missing
   sudo apt install tesseract-ocr  # Linux
   brew install tesseract          # macOS
   ```

2. **"No translation service available"**
   ```bash
   # Install googletrans
   pip install googletrans==4.0.0rc1

   # Or use Gemini key
   python pdf_translator.py input.pdf output.pdf --gemini-key YOUR_KEY
   ```

3. **"OCR produces poor results"**
   - Ensure high-quality scan (300 DPI minimum)
   - Use appropriate language codes
   - Consider pre-processing images for better contrast

4. **"Form fields not detected"**
   - PDF may not have fillable fields
   - Check with: `python -c "import PyPDF2; print(PyPDF2.PdfReader('file.pdf').get_form_text_fields())"`

### Debug Mode
```bash
python pdf_translator.py input.pdf output.pdf --verbose
```

## 📈 Examples

### Real-world Use Cases

1. **German School Forms** (Anmeldung)
   ```bash
   python pdf_translator.py school_form_de.pdf school_form_en.pdf \
     --lang en --fill-data student_data.json
   ```

2. **French Tax Documents**
   ```bash
   python pdf_translator.py tax_form_fr.pdf tax_form_en.pdf \
     --lang en --position bottom
   ```

3. **Scanned Spanish Contracts**
   ```bash
   python pdf_translator.py contract_es_scan.pdf contract_en.pdf \
     --lang en --gemini-key YOUR_KEY --verbose
   ```

## 🤝 Contributing

The script is modular and extensible:

1. **Add new translation services**: Extend `translate_text()` method
2. **Custom overlay styles**: Modify `add_translation_overlay()` method
3. **Additional form field mapping**: Extend `autofill_form_fields()` method
4. **New output formats**: Add methods for different file types

## 📜 License

Open source - feel free to modify and distribute.

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Run with `--verbose` for detailed logs
3. Verify all dependencies are installed correctly

---

**Happy translating! 🌍📄✨**