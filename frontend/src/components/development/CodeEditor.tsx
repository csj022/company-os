import { useState, useEffect } from 'react';
import {
  FileCode,
  Save,
  GitBranch,
  GitCommit,
  FolderTree,
  Search,
  Maximize2,
  Minimize2,
  Play,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../lib/api';

interface CodeEditorProps {
  selectedRepo: string | null;
}

interface FileTreeItem {
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

export function CodeEditor({ selectedRepo }: CodeEditorProps) {
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedRepo) {
      loadFileTree();
    }
  }, [selectedRepo, currentBranch]);

  useEffect(() => {
    // Initialize Monaco Editor
    initializeMonacoEditor();
  }, []);

  const initializeMonacoEditor = async () => {
    // This would normally load Monaco Editor
    // For now, we'll use a simple textarea as placeholder
    // In production, you would:
    // 1. npm install @monaco-editor/react
    // 2. import Editor from '@monaco-editor/react'
    // 3. Use <Editor /> component
    console.log('Monaco Editor would be initialized here');
  };

  const loadFileTree = async () => {
    if (!selectedRepo) return;

    try {
      const response = await api.get<{ tree: FileTreeItem[] }>(`/api/github/repositories/${selectedRepo}/tree`, {
        params: { branch: currentBranch },
      });
      setFileTree(response.tree || []);
    } catch (error) {
      console.error('Failed to load file tree:', error);
    }
  };

  const loadFile = async (path: string) => {
    if (!selectedRepo) return;

    try {
      const response = await api.get<{ content: string }>(
        `/api/github/repositories/${selectedRepo}/contents/${path}`,
        {
          params: { branch: currentBranch },
        }
      );
      setFileContent(response.content || '');
      setSelectedFile(path);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const saveFile = async () => {
    if (!selectedRepo || !selectedFile) return;

    try {
      await api.put(`/api/github/repositories/${selectedRepo}/contents/${selectedFile}`, {
        content: fileContent,
        branch: currentBranch,
        message: `Update ${selectedFile}`,
      });
      setHasChanges(false);
      alert('File saved successfully!');
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file. Check console for details.');
    }
  };

  const handleContentChange = (value: string) => {
    setFileContent(value);
    setHasChanges(true);
  };

  const renderFileTree = (items: FileTreeItem[], level: number = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#2A3240] ${
            selectedFile === item.path ? 'bg-[#2A3240] text-white' : 'text-slate-400'
          }`}
          onClick={() => item.type === 'file' && loadFile(item.path)}
        >
          {item.type === 'directory' ? (
            <FolderTree className="w-4 h-4" />
          ) : (
            <FileCode className="w-4 h-4" />
          )}
          <span className="text-sm">{item.path.split('/').pop()}</span>
        </div>
        {item.children && renderFileTree(item.children, level + 1)}
      </div>
    ));
  };

  if (!selectedRepo) {
    return (
      <Card>
        <div className="text-center py-12">
          <FileCode className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No Repository Selected</h3>
          <p className="text-slate-400 text-sm">
            Select a repository from the Repositories view to start editing
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Toolbar */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-slate-400" />
              <select
                value={currentBranch}
                onChange={(e) => setCurrentBranch(e.target.value)}
                className="bg-[#232931] text-white text-sm px-3 py-1.5 rounded-lg border border-[#2A3240] focus:border-blue-500 outline-none"
              >
                <option value="main">main</option>
                <option value="develop">develop</option>
                {/* Add more branches from API */}
              </select>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <FileCode className="w-4 h-4" />
                <span>{selectedFile}</span>
              </div>
            )}

            {hasChanges && <Badge variant="warning">Unsaved Changes</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={saveFile}
              variant="primary"
              size="sm"
              disabled={!hasChanges || !selectedFile}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="secondary"
              size="sm"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Editor Layout */}
      <div className="grid grid-cols-4 gap-4">
        {/* File Tree */}
        <Card className="col-span-1">
          <CardHeader>
            <span className="text-sm">Files</span>
            <Button variant="secondary" size="sm">
              <Search className="w-4 h-4" />
            </Button>
          </CardHeader>
          <div className="max-h-[600px] overflow-y-auto">
            {renderFileTree(fileTree)}
          </div>
        </Card>

        {/* Editor */}
        <Card className="col-span-3">
          <div className="h-[600px] relative">
            {selectedFile ? (
              <>
                {/* Monaco Editor Placeholder */}
                <textarea
                  value={fileContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full h-full bg-[#0A0E12] text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none"
                  placeholder="Select a file to edit..."
                  spellCheck={false}
                />

                {/* AI Suggestion Overlay */}
                <div className="absolute bottom-4 right-4">
                  <Button variant="primary" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ask AI Assistant
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileCode className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No File Selected</h3>
                  <p className="text-slate-400 text-sm">
                    Select a file from the tree to start editing
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Editor Info */}
      {selectedFile && (
        <Card>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-slate-400">
              <span>Lines: {fileContent.split('\n').length}</span>
              <span>Characters: {fileContent.length}</span>
              <span>
                Language:{' '}
                {selectedFile.endsWith('.tsx')
                  ? 'TypeScript React'
                  : selectedFile.endsWith('.ts')
                  ? 'TypeScript'
                  : selectedFile.endsWith('.js')
                  ? 'JavaScript'
                  : 'Text'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                <GitCommit className="w-4 h-4 mr-2" />
                Commit
              </Button>
              <Button variant="secondary" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Run
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
