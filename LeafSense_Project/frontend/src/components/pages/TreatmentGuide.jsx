import React from 'react';
import './TreatmentGuide.css';

const SECTION_ICONS = {
  'TỔNG QUAN:': '📋',
  'NGUYÊN NHÂN:': '🔍',
  'NHẬN BIẾT:': '👁️',
  'GIẢI PHÁP ĐIỀU TRỊ:': '💊',
  'PHÒNG NGỪA:': '🛡️',
};

const SECTION_CLASSES = {
  'TỔNG QUAN:': 'overview',
  'NGUYÊN NHÂN:': 'causes',
  'NHẬN BIẾT:': 'symptoms',
  'GIẢI PHÁP ĐIỀU TRỊ:': 'treatment',
  'PHÒNG NGỪA:': 'prevention',
};

const TreatmentGuide = ({ treatmentData }) => {
  if (!treatmentData) return null;

  const formatContent = (text) => {
    // Highlight percentages
    text = text.replace(/(\d+(?:\.\d+)?%)/g, '<span class="highlight-percentage">$1</span>');
    
    // Highlight important terms
    const importantTerms = ['nguy hiểm', 'khẩn cấp', 'quan trọng', 'cần thiết', 'lưu ý'];
    importantTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      text = text.replace(regex, '<span class="highlight-important">$1</span>');
    });

    // Highlight measurements and numbers
    text = text.replace(/(\d+(?:\.\d+)?)\s*(mg|ml|g|kg|cm|m|°C)/g, 
      '<span class="highlight-measurement">$1$2</span>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  const sections = treatmentData.split('\n').reduce((acc, line) => {
    const sectionKey = Object.keys(SECTION_CLASSES).find(key => line.includes(key));
    if (sectionKey) {
      acc.currentSection = sectionKey;
    }

    if (line.trim()) {
      if (!acc.sections[acc.currentSection]) {
        acc.sections[acc.currentSection] = [];
      }
      acc.sections[acc.currentSection].push(line);
    }

    return acc;
  }, { currentSection: 'intro', sections: {} });

  return (
    <div className="treatment-suggestion">
      <div className="treatment-header">
        <h6>Disease Analysis & Treatment Guide</h6>
        <div className="guide-meta">
          <span className="guide-icon">🌿</span>
          <span className="guide-timestamp">Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="treatment-content">
        {Object.entries(sections.sections).map(([section, lines]) => (
          <div key={section} className={`section-container ${SECTION_CLASSES[section] || ''}`}>
            {lines.map((line, idx) => {
              const isSectionHeader = Object.keys(SECTION_CLASSES).some(key => line.includes(key));
              
              if (isSectionHeader) {
                return (
                  <div key={idx} className={`section-header section-${SECTION_CLASSES[section]}`}>
                    <span className="section-icon">{SECTION_ICONS[section]}</span>
                    <span className="section-title">{line.trim()}</span>
                  </div>
                );
              }

              if (line.startsWith('-')) {
                return (
                  <div key={idx} className="bullet-point-container">
                    <p className="bullet-point">
                      {formatContent(line.substring(1).trim())}
                    </p>
                  </div>
                );
              }

              return (
                <p key={idx} className="content-text">
                  {formatContent(line.trim())}
                </p>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreatmentGuide;