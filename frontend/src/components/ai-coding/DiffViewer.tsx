/**
 * Diff Viewer Component
 * Displays side-by-side code comparison with syntax highlighting
 */

import React from 'react';
import { Card } from '../ui/Card';

interface DiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  language?: string;
  fileName?: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ 
  originalCode, 
  modifiedCode, 
  language = 'javascript',
  fileName 
}) => {
  const getLineChanges = () => {
    const originalLines = originalCode.split('\n');
    const modifiedLines = modifiedCode.split('\n');
    const changes: Array<{
      original: string | null;
      modified: string | null;
      type: 'added' | 'removed' | 'unchanged';
      lineNum: number;
    }> = [];

    // Simple diff algorithm (in production, use a proper diff library like diff-match-patch)
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i];
      const modifiedLine = modifiedLines[i];

      if (originalLine === undefined && modifiedLine !== undefined) {
        changes.push({
          original: null,
          modified: modifiedLine,
          type: 'added',
          lineNum: i + 1
        });
      } else if (modifiedLine === undefined && originalLine !== undefined) {
        changes.push({
          original: originalLine,
          modified: null,
          type: 'removed',
          lineNum: i + 1
        });
      } else if (originalLine !== modifiedLine) {
        // Both exist but different
        changes.push({
          original: originalLine,
          modified: modifiedLine,
          type: 'removed',
          lineNum: i + 1
        });
        changes.push({
          original: null,
          modified: modifiedLine,
          type: 'added',
          lineNum: i + 1
        });
      } else {
        changes.push({
          original: originalLine,
          modified: modifiedLine,
          type: 'unchanged',
          lineNum: i + 1
        });
      }
    }

    return changes;
  };

  const changes = getLineChanges();
  const addedCount = changes.filter(c => c.type === 'added').length;
  const removedCount = changes.filter(c => c.type === 'removed').length;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            {fileName && (
              <h3 className="font-semibold text-gray-900">{fileName}</h3>
            )}
            <p className="text-sm text-gray-600">
              <span className="text-green-600">+{addedCount}</span>
              {' / '}
              <span className="text-red-600">-{removedCount}</span>
            </p>
          </div>
          <span className="text-xs text-gray-500 uppercase">{language}</span>
        </div>
      </div>

      {/* Diff View */}
      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* Original */}
        <div className="overflow-x-auto">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-700">Original</span>
          </div>
          <pre className="text-sm font-mono p-0">
            {changes.map((change, index) => {
              if (change.type === 'added') return null;
              
              return (
                <div
                  key={index}
                  className={`flex ${
                    change.type === 'removed'
                      ? 'bg-red-50 text-red-900'
                      : 'text-gray-800'
                  }`}
                >
                  <span className="flex-shrink-0 w-12 px-2 text-right text-gray-500 select-none bg-gray-100 border-r border-gray-200">
                    {change.lineNum}
                  </span>
                  <span className="flex-1 px-3 py-0.5">
                    {change.type === 'removed' && (
                      <span className="text-red-600 font-bold">- </span>
                    )}
                    {change.original || '\u00A0'}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>

        {/* Modified */}
        <div className="overflow-x-auto">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-700">Modified</span>
          </div>
          <pre className="text-sm font-mono p-0">
            {changes.map((change, index) => {
              if (change.type === 'removed') return null;
              
              return (
                <div
                  key={index}
                  className={`flex ${
                    change.type === 'added'
                      ? 'bg-green-50 text-green-900'
                      : 'text-gray-800'
                  }`}
                >
                  <span className="flex-shrink-0 w-12 px-2 text-right text-gray-500 select-none bg-gray-100 border-r border-gray-200">
                    {change.lineNum}
                  </span>
                  <span className="flex-1 px-3 py-0.5">
                    {change.type === 'added' && (
                      <span className="text-green-600 font-bold">+ </span>
                    )}
                    {change.modified || '\u00A0'}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-600">
            <span className="font-semibold text-green-600">{addedCount}</span> additions
          </span>
          <span className="text-gray-600">
            <span className="font-semibold text-red-600">{removedCount}</span> deletions
          </span>
          <span className="text-gray-600">
            <span className="font-semibold">{changes.filter(c => c.type === 'unchanged').length}</span> unchanged
          </span>
        </div>
      </div>
    </Card>
  );
};

export default DiffViewer;
