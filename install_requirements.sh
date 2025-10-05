#!/bin/bash
# PDF Translator Installation Script
# ===================================

echo "🔧 Installing PDF Translator dependencies..."

# Update package manager
echo "📦 Updating package manager..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt update
elif [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v brew &> /dev/null; then
        echo "⚠️  Homebrew not found. Please install it first: https://brew.sh"
        exit 1
    fi
    brew update
fi

# Install Tesseract OCR
echo "🔍 Installing Tesseract OCR..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt install -y tesseract-ocr tesseract-ocr-deu tesseract-ocr-fra tesseract-ocr-spa
elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew install tesseract tesseract-lang
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    echo "⚠️  For Windows, please download Tesseract from:"
    echo "   https://github.com/UB-Mannheim/tesseract/wiki"
    echo "   And add it to your PATH"
fi

# Install Python packages
echo "🐍 Installing Python packages..."
pip install --upgrade pip

# Core dependencies (all free)
pip install PyMuPDF pytesseract Pillow PyPDF2

# Translation services
pip install googletrans==4.0.0rc1

# Optional: Gemini (free tier available)
echo "🤖 Installing optional Gemini support..."
pip install google-generativeai

# Verify installations
echo "✅ Verifying installations..."

python3 -c "
import fitz
import pytesseract
from PIL import Image
import PyPDF2
print('✅ Core PDF processing libraries installed')
"

python3 -c "
try:
    from googletrans import Translator
    print('✅ Google Translate available')
except ImportError:
    print('❌ Google Translate not available')

try:
    import google.generativeai as genai
    print('✅ Gemini support available')
except ImportError:
    print('❌ Gemini support not available')
"

# Test Tesseract
echo "🔍 Testing Tesseract OCR..."
if command -v tesseract &> /dev/null; then
    tesseract_version=$(tesseract --version | head -n1)
    echo "✅ Tesseract installed: $tesseract_version"
else
    echo "❌ Tesseract not found in PATH"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test the tool: python pdf_translator.py --help"
echo "2. For Gemini support, get API key: https://aistudio.google.com/app/apikey"
echo "3. Example usage: python pdf_translator.py input.pdf output.pdf --lang en"
echo ""
echo "📁 Sample files created:"
echo "- sample_fill_data.json (example form data)"
echo "- pdf_translator.py (main script)"