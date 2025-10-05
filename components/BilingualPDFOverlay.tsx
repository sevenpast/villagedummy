'use client';

import { useState } from 'react';

interface BilingualTextBlock {
  originalText: string;
  translatedText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  language: string;
}

interface BilingualFormField {
  name: string;
  originalName: string;
  translation: string;
  value: string;
  confidence: number;
  isAutoFilled: boolean;
  fieldType: 'text' | 'checkbox' | 'date' | 'email' | 'phone' | 'select';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  context: string;
  contextHints?: string[];
  isRequired?: boolean;
  originalType?: string;
}

interface BilingualPDFOverlayProps {
  pdfUrl: string;
  textBlocks: BilingualTextBlock[];
  formFields: BilingualFormField[];
  scaleFactor: number;
  showOverlays: boolean;
  displayMode: 'original' | 'translated' | 'bilingual' | 'side-by-side';
  onDisplayModeChange: (mode: 'original' | 'translated' | 'bilingual' | 'side-by-side') => void;
  preserveLayout?: boolean;
  showFieldTypes?: boolean;
  highlightRequired?: boolean;
}

export default function BilingualPDFOverlay({
  pdfUrl,
  textBlocks,
  formFields,
  scaleFactor,
  showOverlays,
  displayMode,
  onDisplayModeChange,
  preserveLayout = true,
  showFieldTypes = true,
  highlightRequired = true
}: BilingualPDFOverlayProps) {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  const renderBilingualText = (block: BilingualTextBlock, index: number) => {
    const isHovered = hoveredElement === `text-${index}`;
    
    let content = '';
    let backgroundColor = 'bg-blue-500';
    let textColor = 'text-white';
    
    switch (displayMode) {
      case 'original':
        content = block.originalText;
        backgroundColor = 'bg-blue-500';
        break;
      case 'translated':
        content = block.translatedText;
        backgroundColor = 'bg-green-500';
        break;
      case 'bilingual':
        content = `${block.originalText} → ${block.translatedText}`;
        backgroundColor = 'bg-purple-500';
        break;
      case 'side-by-side':
        content = `${block.originalText} | ${block.translatedText}`;
        backgroundColor = 'bg-indigo-500';
        break;
    }

    return (
      <div
        key={`text-${index}`}
        className={`absolute z-10 ${backgroundColor} bg-opacity-80 ${textColor} text-xs p-1 rounded border transition-all duration-200 ${
          isHovered ? 'bg-opacity-95 scale-105' : ''
        }`}
        style={{
          left: `${block.x * scaleFactor}px`,
          top: `${block.y * scaleFactor}px`,
          width: `${block.width * scaleFactor}px`,
          height: `${block.height * scaleFactor}px`,
        }}
        onMouseEnter={() => setHoveredElement(`text-${index}`)}
        onMouseLeave={() => setHoveredElement(null)}
        title={`Original: ${block.originalText}\nTranslated: ${block.translatedText}\nConfidence: ${block.confidence}%\nLanguage: ${block.language}`}
      >
        <div className="text-center leading-tight break-words">
          {content}
        </div>
        {isHovered && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-black bg-opacity-90 text-white text-xs rounded shadow-lg z-20 whitespace-pre-line">
            <div><strong>Original:</strong> {block.originalText}</div>
            <div><strong>Translated:</strong> {block.translatedText}</div>
            <div><strong>Confidence:</strong> {block.confidence}%</div>
            <div><strong>Language:</strong> {block.language}</div>
          </div>
        )}
      </div>
    );
  };

  const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'checkbox': return '☑';
      case 'date': return '📅';
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'select': return '📋';
      default: return '📝';
    }
  };

  const getFieldBackgroundColor = (field: BilingualFormField) => {
    if (field.isRequired && highlightRequired) {
      return field.isAutoFilled ? 'bg-orange-500' : 'bg-red-500';
    }
    return field.isAutoFilled ? 'bg-green-500' : 'bg-yellow-500';
  };

  const getFieldBorderColor = (field: BilingualFormField) => {
    if (field.isRequired && highlightRequired) {
      return field.isAutoFilled ? 'border-orange-700' : 'border-red-700';
    }
    return field.isAutoFilled ? 'border-green-700' : 'border-yellow-700';
  };

  const renderBilingualFormField = (field: BilingualFormField, index: number) => {
    const isHovered = hoveredElement === `field-${index}`;

    const backgroundColor = getFieldBackgroundColor(field);
    const borderColor = getFieldBorderColor(field);

    return (
      <div
        key={`field-${index}`}
        className={`absolute z-20 border-2 rounded ${backgroundColor} bg-opacity-80 ${borderColor} transition-all duration-200 ${
          isHovered ? 'bg-opacity-95 scale-105' : ''
        } ${
          preserveLayout ? 'shadow-sm' : ''
        }`}
        style={{
          left: `${field.position.x * scaleFactor}px`,
          top: `${field.position.y * scaleFactor}px`,
          width: `${field.position.width * scaleFactor}px`,
          height: `${field.position.height * scaleFactor}px`,
          minHeight: preserveLayout ? `${Math.max(20, field.position.height * scaleFactor)}px` : 'auto'
        }}
        onMouseEnter={() => setHoveredElement(`field-${index}`)}
        onMouseLeave={() => setHoveredElement(null)}
        title={`${field.originalName} → ${field.translation} (${field.confidence}% confidence)`}
      >
        <div className="text-white text-xs p-1 h-full flex flex-col justify-between">
          <div className="font-bold flex items-center gap-1">
            {showFieldTypes && (
              <span className="text-xs opacity-90">{getFieldTypeIcon(field.fieldType)}</span>
            )}
            <span className="truncate">
              {displayMode === 'original' ? field.originalName :
               displayMode === 'translated' ? field.translation :
               displayMode === 'bilingual' ? `${field.originalName} → ${field.translation}` :
               `${field.originalName} | ${field.translation}`}
            </span>
            {field.isRequired && highlightRequired && (
              <span className="text-red-200 font-bold">*</span>
            )}
          </div>
          {field.value && (
            <div className="text-xs opacity-90 truncate">{field.value}</div>
          )}
          <div className="text-xs opacity-75 flex justify-between items-center">
            <span>{field.confidence}%</span>
            {showFieldTypes && (
              <span className="text-xs opacity-70">{field.fieldType}</span>
            )}
          </div>
        </div>

        {isHovered && (
          <div className="absolute top-full left-0 mt-1 p-3 bg-black bg-opacity-95 text-white text-xs rounded-lg shadow-xl z-30 whitespace-pre-line max-w-xs">
            <div className="mb-1"><strong>Original:</strong> {field.originalName}</div>
            <div className="mb-1"><strong>Translation:</strong> {field.translation}</div>
            <div className="mb-1"><strong>Value:</strong> {field.value || 'Not filled'}</div>
            <div className="mb-1"><strong>Confidence:</strong> {field.confidence}%</div>
            <div className="mb-1"><strong>Type:</strong> {field.fieldType} {getFieldTypeIcon(field.fieldType)}</div>
            <div className="mb-1"><strong>Context:</strong> {field.context}</div>
            {field.contextHints && field.contextHints.length > 0 && (
              <div className="mb-1"><strong>Hints:</strong> {field.contextHints.join(', ')}</div>
            )}
            {field.isRequired && (
              <div className="text-red-300"><strong>Required field</strong></div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* PDF Display */}
      <iframe
        src={pdfUrl}
        className="border border-gray-300 shadow-lg"
        style={{
          width: preserveLayout ? 'auto' : '600px',
          height: preserveLayout ? 'auto' : '800px',
          minWidth: '400px',
          minHeight: '600px',
          maxWidth: preserveLayout ? '100%' : 'none'
        }}
        title="PDF with Bilingual Overlay"
      />

      {/* Bilingual Text Overlays */}
      {showOverlays && textBlocks.map((block, index) => 
        renderBilingualText(block, index)
      )}

      {/* Bilingual Form Field Overlays */}
      {showOverlays && formFields.map((field, index) => 
        renderBilingualFormField(field, index)
      )}

      {/* Enhanced Status Panel */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-90 text-white px-3 py-2 rounded-lg text-xs space-y-1 shadow-lg">
        <div><strong>Mode:</strong> {displayMode}</div>
        <div><strong>Text Blocks:</strong> {textBlocks.length}</div>
        <div><strong>Form Fields:</strong> {formFields.length}</div>
        <div><strong>Auto-filled:</strong> {formFields.filter(f => f.isAutoFilled).length}</div>
        {highlightRequired && (
          <div><strong>Required:</strong> {formFields.filter(f => f.isRequired).length}</div>
        )}
        <div className="flex gap-1 pt-1">
          <span className="w-3 h-3 bg-green-500 rounded border border-green-700" title="Auto-filled"></span>
          <span className="w-3 h-3 bg-yellow-500 rounded border border-yellow-700" title="Manual"></span>
          {highlightRequired && (
            <span className="w-3 h-3 bg-red-500 rounded border border-red-700" title="Required"></span>
          )}
        </div>
      </div>

      {/* Field Type Legend */}
      {showFieldTypes && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-90 text-white px-3 py-2 rounded-lg text-xs space-y-1 shadow-lg">
          <div className="font-bold mb-1">Field Types:</div>
          <div>📝 Text • ☑ Checkbox • 📅 Date</div>
          <div>📧 Email • 📞 Phone • 📋 Select</div>
        </div>
      )}
    </div>
  );
}


