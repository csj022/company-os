import { Palette, Component, Layers } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function Design() {
  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Design System Manager</h1>
          <p className="text-slate-400 mt-1">
            Figma integration and component library management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Figma Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span>Figma</span>
            </div>
            <Badge variant="neutral">Not Connected</Badge>
          </CardHeader>
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-4">
              Connect Figma to sync design files and components
            </p>
            <button className="px-4 py-2 rounded-lg bg-[#0176D3] hover:bg-[#015FB0] text-white text-sm transition-all">
              Connect Figma
            </button>
          </div>
        </Card>

        {/* Component Library */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Component className="w-4 h-4" />
              <span>Component Library</span>
            </div>
            <Badge variant="neutral">Coming Soon</Badge>
          </CardHeader>
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">
              Component library stats will appear here
            </p>
          </div>
        </Card>

        {/* Design Updates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Recent Updates</span>
            </div>
            <Badge variant="neutral">Coming Soon</Badge>
          </CardHeader>
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">
              Design updates will appear here
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <span>Design Token Preview</span>
          </CardHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Colors */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Colors</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#0176D3]"></div>
                  <span className="text-sm text-slate-300">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-emerald-500"></div>
                  <span className="text-sm text-slate-300">Success</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-amber-500"></div>
                  <span className="text-sm text-slate-300">Warning</span>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Typography</h4>
              <div className="space-y-2 text-white">
                <div className="text-2xl font-bold">Heading</div>
                <div className="text-base font-medium">Body</div>
                <div className="text-sm">Caption</div>
              </div>
            </div>

            {/* Spacing */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Spacing</h4>
              <div className="space-y-2">
                <div className="h-2 w-8 bg-slate-600 rounded"></div>
                <div className="h-2 w-12 bg-slate-600 rounded"></div>
                <div className="h-2 w-16 bg-slate-600 rounded"></div>
              </div>
            </div>

            {/* Radius */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-3">Border Radius</h4>
              <div className="space-y-2">
                <div className="h-8 w-16 bg-slate-600 rounded-sm"></div>
                <div className="h-8 w-16 bg-slate-600 rounded-md"></div>
                <div className="h-8 w-16 bg-slate-600 rounded-lg"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
