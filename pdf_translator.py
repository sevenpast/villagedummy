#!/usr/bin/env python3
"""
PDF Translation and Autofill Tool
=================================

Processes PDFs by extracting text (with OCR for scanned documents),
translating content using Gemini LLM or Google Translate, adding overlay
translations, and auto-filling form fields.

User Story: As a user who needs to edit PDFs in different languages,
I want a Python script that analyzes uploaded PDFs, extracts text,
translates it (e.g., with Gemini LLM support), adds an overlay layer
with translated text, and automatically fills form fields.

Requirements:
- Works with free libraries only
- Robust for all PDF types (including scanned PDFs via OCR)
- Translation via Gemini LLM (if available) or free alternatives
- Autofill based on predefined data source
- Error handling for unrecognizable text or missing fields
- No dependency on paid services

Author: Claude Code Assistant
Date: 2025-10-04
"""

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse
import sys

# Optional imports with graceful fallback
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  google-generativeai not installed. Using Google Translate fallback.")

try:
    from googletrans import Translator
    GOOGLETRANS_AVAILABLE = True
except ImportError:
    GOOGLETRANS_AVAILABLE = False
    print("⚠️  googletrans not installed. Translation will be limited.")

try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False
    print("⚠️  PyPDF2 not installed. Form field autofill will be limited.")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PDFTranslator:
    """Main class for PDF translation and processing."""

    def __init__(self, gemini_api_key: Optional[str] = None):
        """Initialize the PDF translator.

        Args:
            gemini_api_key: Optional Gemini API key for enhanced translations
        """
        self.gemini_api_key = gemini_api_key
        self.gemini_model = None
        self.translator = None

        # Initialize Gemini if available and key provided
        if GEMINI_AVAILABLE and gemini_api_key and gemini_api_key != "YOUR_GEMINI_API_KEY_HERE":
            try:
                genai.configure(api_key=gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("✅ Gemini LLM initialized successfully")
            except Exception as e:
                logger.warning(f"⚠️  Failed to initialize Gemini: {e}")

        # Initialize Google Translate as fallback
        if GOOGLETRANS_AVAILABLE:
            try:
                self.translator = Translator()
                logger.info("✅ Google Translate fallback initialized")
            except Exception as e:
                logger.warning(f"⚠️  Failed to initialize Google Translate: {e}")

    def is_pdf_scanned(self, doc: fitz.Document) -> bool:
        """Determine if PDF is scanned by checking text content.

        Args:
            doc: PyMuPDF document object

        Returns:
            True if PDF appears to be scanned (image-based)
        """
        total_text_length = 0
        sample_pages = min(3, len(doc))  # Check first 3 pages

        for page_num in range(sample_pages):
            page = doc[page_num]
            text = page.get_text().strip()
            total_text_length += len(text)

        # If very little text found, likely scanned
        avg_text_per_page = total_text_length / sample_pages
        is_scanned = avg_text_per_page < 50

        logger.info(f"📄 PDF analysis: {'Scanned' if is_scanned else 'Text-based'} "
                   f"(avg {avg_text_per_page:.1f} chars/page)")
        return is_scanned

    def extract_text_from_page(self, page: fitz.Page, use_ocr: bool = False) -> str:
        """Extract text from a PDF page using direct extraction or OCR.

        Args:
            page: PyMuPDF page object
            use_ocr: Force OCR usage even if text is extractable

        Returns:
            Extracted text string
        """
        try:
            if not use_ocr:
                text = page.get_text()
                if text.strip():
                    return text

            # Use OCR for scanned pages or when forced
            logger.info("🔍 Using OCR for text extraction...")
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # Higher resolution
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))

            # OCR with multiple language support
            text = pytesseract.image_to_string(img, lang='eng+deu+fra+spa')
            return text

        except Exception as e:
            logger.error(f"❌ Text extraction failed: {e}")
            return ""

    def translate_text(self, text: str, target_lang: str = 'en',
                      source_lang: str = 'auto') -> str:
        """Translate text using Gemini LLM or Google Translate.

        Args:
            text: Text to translate
            target_lang: Target language code (e.g., 'en', 'de', 'fr')
            source_lang: Source language code ('auto' for detection)

        Returns:
            Translated text
        """
        if not text.strip():
            return text

        # Try Gemini first if available
        if self.gemini_model:
            try:
                prompt = f"""Translate the following text accurately to {target_lang}.
                Preserve formatting, structure, and meaning.
                If the text is already in {target_lang}, return it unchanged.

                Text to translate:
                {text}

                Translation:"""

                response = self.gemini_model.generate_content(prompt)
                translated = response.text.strip()
                logger.info(f"🔄 Gemini translation: {len(text)} chars -> {len(translated)} chars")
                return translated

            except Exception as e:
                logger.warning(f"⚠️  Gemini translation failed: {e}, falling back to Google Translate")

        # Fallback to Google Translate
        if self.translator:
            try:
                result = self.translator.translate(text, dest=target_lang, src=source_lang)
                translated = result.text
                logger.info(f"🔄 Google Translate: {len(text)} chars -> {len(translated)} chars")
                return translated

            except Exception as e:
                logger.warning(f"⚠️  Google Translate failed: {e}")

        logger.warning("⚠️  No translation service available, returning original text")
        return text

    def add_translation_overlay(self, page: fitz.Page, original_text: str,
                              translated_text: str, position: str = 'right') -> None:
        """Add translated text as overlay to the PDF page.

        Args:
            page: PyMuPDF page object
            original_text: Original text for reference
            translated_text: Translated text to overlay
            position: Overlay position ('right', 'bottom', 'top')
        """
        if not translated_text.strip():
            return

        rect = page.rect
        font_size = 8
        color = (0, 0, 0.8)  # Blue color for translations

        # Calculate position based on preference
        if position == 'right':
            x = rect.width * 0.6  # Right side
            y = rect.height * 0.1  # Top
            max_width = rect.width * 0.35
        elif position == 'bottom':
            x = rect.width * 0.05  # Left margin
            y = rect.height * 0.85  # Bottom
            max_width = rect.width * 0.9
        else:  # top
            x = rect.width * 0.05  # Left margin
            y = rect.height * 0.05  # Top
            max_width = rect.width * 0.9

        # Split text into lines to fit width
        words = translated_text.split()
        lines = []
        current_line = []

        for word in words:
            test_line = ' '.join(current_line + [word])
            if len(test_line) * font_size * 0.6 < max_width:  # Rough width estimation
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]

        if current_line:
            lines.append(' '.join(current_line))

        # Add each line to the page
        for i, line in enumerate(lines[:10]):  # Limit to 10 lines
            line_y = y + (i * font_size * 1.2)
            if line_y < rect.height - 20:  # Don't go off page
                try:
                    page.insert_text((x, line_y), line, fontsize=font_size, color=color)
                except Exception as e:
                    logger.warning(f"⚠️  Failed to add overlay text: {e}")
                    break

    def extract_form_fields(self, pdf_path: str) -> Dict[str, str]:
        """Extract form field names from PDF.

        Args:
            pdf_path: Path to PDF file

        Returns:
            Dictionary of field names and their current values
        """
        if not PYPDF2_AVAILABLE:
            logger.warning("⚠️  PyPDF2 not available, skipping form field extraction")
            return {}

        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                fields = reader.get_form_text_fields()
                if fields:
                    logger.info(f"📝 Found {len(fields)} form fields: {list(fields.keys())}")
                    return fields
                else:
                    logger.info("📝 No form fields found in PDF")
                    return {}
        except Exception as e:
            logger.error(f"❌ Form field extraction failed: {e}")
            return {}

    def autofill_form_fields(self, input_path: str, output_path: str,
                           fill_data: Dict[str, str]) -> bool:
        """Auto-fill form fields in PDF.

        Args:
            input_path: Input PDF path
            output_path: Output PDF path
            fill_data: Dictionary mapping field names to values

        Returns:
            True if successful, False otherwise
        """
        if not PYPDF2_AVAILABLE or not fill_data:
            return False

        try:
            with open(input_path, 'rb') as input_file:
                reader = PyPDF2.PdfReader(input_file)
                writer = PyPDF2.PdfWriter()

                # Get existing fields
                existing_fields = reader.get_form_text_fields() or {}

                # Copy pages and update fields
                for page in reader.pages:
                    writer.add_page(page)

                # Update form fields
                filled_count = 0
                for field_name, field_value in fill_data.items():
                    if field_name in existing_fields:
                        try:
                            writer.update_page_form_field_values(
                                writer.pages[-1], {field_name: field_value}
                            )
                            filled_count += 1
                        except Exception as e:
                            logger.warning(f"⚠️  Failed to fill field '{field_name}': {e}")

                # Write output
                with open(output_path, 'wb') as output_file:
                    writer.write(output_file)

                logger.info(f"✅ Auto-filled {filled_count} form fields")
                return True

        except Exception as e:
            logger.error(f"❌ Auto-fill failed: {e}")
            return False

    def process_pdf(self, input_path: str, output_path: str,
                   target_lang: str = 'en', fill_data: Optional[Dict[str, str]] = None,
                   overlay_position: str = 'right') -> bool:
        """Main processing function for PDF translation and autofill.

        Args:
            input_path: Input PDF file path
            output_path: Output PDF file path
            target_lang: Target language for translation
            fill_data: Optional dictionary for form field autofill
            overlay_position: Position for translation overlay

        Returns:
            True if processing was successful
        """
        logger.info(f"🚀 Starting PDF processing: {input_path} -> {output_path}")

        try:
            # Open PDF document
            doc = fitz.open(input_path)
            logger.info(f"📄 Opened PDF: {len(doc)} pages")

            # Determine if PDF is scanned
            use_ocr = self.is_pdf_scanned(doc)

            # Process each page
            for page_num in range(len(doc)):
                logger.info(f"📖 Processing page {page_num + 1}/{len(doc)}")
                page = doc[page_num]

                # Extract text
                text = self.extract_text_from_page(page, use_ocr)

                if text.strip():
                    # Translate text
                    translated = self.translate_text(text, target_lang)

                    # Add overlay if translation is different from original
                    if translated != text:
                        self.add_translation_overlay(page, text, translated, overlay_position)
                        logger.info(f"✅ Added translation overlay to page {page_num + 1}")
                else:
                    logger.warning(f"⚠️  No text found on page {page_num + 1}")

            # Save document with translations
            doc.save(output_path)
            doc.close()
            logger.info(f"💾 Saved translated PDF: {output_path}")

            # Auto-fill form fields if data provided
            if fill_data:
                logger.info("📝 Processing form field auto-fill...")
                temp_path = output_path + ".temp"
                if self.autofill_form_fields(output_path, temp_path, fill_data):
                    # Replace original with filled version
                    Path(temp_path).replace(output_path)
                    logger.info("✅ Form fields auto-filled successfully")
                else:
                    # Clean up temp file if it exists
                    Path(temp_path).unlink(missing_ok=True)

            logger.info("🎉 PDF processing completed successfully!")
            return True

        except Exception as e:
            logger.error(f"❌ PDF processing failed: {e}")
            return False


def load_fill_data(data_path: str) -> Dict[str, str]:
    """Load auto-fill data from JSON file.

    Args:
        data_path: Path to JSON file with fill data

    Returns:
        Dictionary with field mappings
    """
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            logger.info(f"📋 Loaded fill data: {len(data)} fields")
            return data
    except Exception as e:
        logger.error(f"❌ Failed to load fill data: {e}")
        return {}


def main():
    """Main CLI interface."""
    parser = argparse.ArgumentParser(description="PDF Translation and Autofill Tool")
    parser.add_argument("input", help="Input PDF file path")
    parser.add_argument("output", help="Output PDF file path")
    parser.add_argument("--lang", default="en", help="Target language (default: en)")
    parser.add_argument("--gemini-key", help="Gemini API key for enhanced translations")
    parser.add_argument("--fill-data", help="JSON file with auto-fill data")
    parser.add_argument("--position", choices=['right', 'bottom', 'top'],
                       default='right', help="Translation overlay position")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Enable verbose logging")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Initialize translator
    translator = PDFTranslator(gemini_api_key=args.gemini_key)

    # Load fill data if provided
    fill_data = None
    if args.fill_data:
        fill_data = load_fill_data(args.fill_data)

    # Process PDF
    success = translator.process_pdf(
        input_path=args.input,
        output_path=args.output,
        target_lang=args.lang,
        fill_data=fill_data,
        overlay_position=args.position
    )

    if success:
        print(f"✅ Success! Translated PDF saved to: {args.output}")
        sys.exit(0)
    else:
        print("❌ Processing failed. Check logs for details.")
        sys.exit(1)


if __name__ == "__main__":
    # Example usage when run directly
    if len(sys.argv) == 1:
        print("""
🔧 PDF Translation and Autofill Tool
====================================

Usage examples:

1. Basic translation:
   python pdf_translator.py input.pdf output.pdf --lang en

2. With Gemini API:
   python pdf_translator.py input.pdf output.pdf --lang en --gemini-key YOUR_KEY

3. With auto-fill:
   python pdf_translator.py input.pdf output.pdf --lang en --fill-data data.json

4. Custom position:
   python pdf_translator.py input.pdf output.pdf --lang en --position bottom

Required installations:
   pip install PyMuPDF pytesseract Pillow googletrans==4.0.0rc1 PyPDF2
   pip install google-generativeai  # Optional for Gemini

For OCR support, install Tesseract:
   - Ubuntu/Debian: sudo apt install tesseract-ocr
   - macOS: brew install tesseract
   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki

Sample fill-data.json:
{
    "Name": "Max Mustermann",
    "Email": "max@example.com",
    "Address": "Musterstraße 1, 12345 Berlin"
}
""")
    else:
        main()