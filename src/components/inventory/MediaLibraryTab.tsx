import { useState, useEffect, useCallback, useRef } from 'react';
import { useMediaLibrary, MediaFile, MediaFolder } from '@/hooks/useMediaLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FolderPlus, Upload, Trash2, Move, Eye, MoreVertical, FolderOpen,
  Image, ChevronRight, Grid3X3, List, Loader2, FileImage, HardDrive,
  FolderTree, ChevronDown, Pencil, Search, X, Download
} from 'lucide-react';

export function MediaLibraryTab() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showProductImages, setShowProductImages] = useState(false);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveFileTarget, setMoveFileTarget] = useState<MediaFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const media = useMediaLibrary({ folderId: currentFolderId, showProductImages, page, pageSize: 60 });

  useEffect(() => {
    media.fetchFolders();
  }, [media.fetchFolders]);

  useEffect(() => {
    media.fetchFiles(currentFolderId, showProductImages);
  }, [currentFolderId, showProductImages, page]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await media.uploadFiles(Array.from(files), currentFolderId);
    media.fetchFiles(currentFolderId, showProductImages);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [media, currentFolderId, showProductImages]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    await media.uploadFiles(Array.from(files), currentFolderId);
    media.fetchFiles(currentFolderId, showProductImages);
  }, [media, currentFolderId, showProductImages]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await media.createFolder(newFolderName.trim(), currentFolderId);
    setNewFolderName('');
    setNewFolderOpen(false);
  };

  const handleRenameFolder = async () => {
    if (!renameFolderId || !renameValue.trim()) return;
    await media.renameFolder(renameFolderId, renameValue.trim());
    setRenameFolderId(null);
    setRenameValue('');
  };

  const handleDeleteFile = async (file: MediaFile) => {
    if (!confirm(`Изтриване на "${file.file_name}"?`)) return;
    await media.deleteFile(file);
    media.fetchFiles(currentFolderId, showProductImages);
  };

  const handleDeleteFolder = async (folder: MediaFolder) => {
    if (!confirm(`Изтриване на папка "${folder.name}" и всичко в нея?`)) return;
    await media.deleteFolder(folder.id);
    if (currentFolderId === folder.id) setCurrentFolderId(null);
  };

  const handleMoveFile = async (targetFolderId: string | null) => {
    if (!moveFileTarget) return;
    await media.moveFile(moveFileTarget.id, targetFolderId);
    setMoveFileTarget(null);
    media.fetchFiles(currentFolderId, showProductImages);
  };

  const currentFolders = media.folders.filter(f => f.parent_id === currentFolderId);
  const breadcrumb = getBreadcrumb(media.folders, currentFolderId);

  const filteredFiles = searchQuery
    ? media.files.filter(f => f.file_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : media.files;

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalPages = Math.ceil(media.totalFiles / 60);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <Card className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              Навигация
            </h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNewFolderOpen(true)} title="Нова папка">
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-0.5">
              <button
                onClick={() => { setCurrentFolderId(null); setShowProductImages(false); setPage(0); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${!currentFolderId && !showProductImages ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
              >
                <FolderOpen className="w-4 h-4" />
                Всички файлове
              </button>
              <button
                onClick={() => { setCurrentFolderId(null); setShowProductImages(true); setPage(0); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${showProductImages ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
              >
                <FileImage className="w-4 h-4" />
                Продуктови снимки
              </button>

              {/* Root folders */}
              {media.folders.filter(f => !f.parent_id).map(folder => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  allFolders={media.folders}
                  currentFolderId={currentFolderId}
                  onSelect={(id) => { setCurrentFolderId(id); setShowProductImages(false); setPage(0); }}
                  onRename={(f) => { setRenameFolderId(f.id); setRenameValue(f.name); }}
                  onDelete={handleDeleteFolder}
                  depth={0}
                />
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mr-auto">
            <button onClick={() => { setCurrentFolderId(null); setShowProductImages(false); }} className="hover:text-foreground">
              <HardDrive className="w-4 h-4" />
            </button>
            {breadcrumb.map((b) => (
              <span key={b.id} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => setCurrentFolderId(b.id)} className="hover:text-foreground">{b.name}</button>
              </span>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Търси..."
              className="pl-8 h-8 w-40"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center border rounded-md">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={media.uploading}>
            {media.uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            Качи
          </Button>
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        {/* Drop zone + content */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="min-h-[300px] border-2 border-dashed border-border/50 rounded-lg p-4 transition-colors hover:border-primary/30"
        >
          {media.loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Subfolders */}
              {currentFolders.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Папки</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {currentFolders.map(folder => (
                      <button
                        key={folder.id}
                        onDoubleClick={() => { setCurrentFolderId(folder.id); setPage(0); }}
                        onClick={() => { setCurrentFolderId(folder.id); setPage(0); }}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <FolderOpen className="w-8 h-8 text-primary" />
                        <span className="text-xs truncate w-full text-center">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {filteredFiles.length === 0 && currentFolders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Image className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm">Няма файлове</p>
                  <p className="text-xs mt-1">Плъзнете файлове тук или натиснете "Качи"</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredFiles.map(file => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onPreview={() => setPreviewFile(file)}
                      onDelete={() => handleDeleteFile(file)}
                      onMove={() => setMoveFileTarget(file)}
                      formatSize={formatSize}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredFiles.map(file => (
                    <FileRow
                      key={file.id}
                      file={file}
                      onPreview={() => setPreviewFile(file)}
                      onDelete={() => handleDeleteFile(file)}
                      onMove={() => setMoveFileTarget(file)}
                      formatSize={formatSize}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Назад</Button>
                  <span className="text-sm text-muted-foreground">Страница {page + 1} от {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Напред</Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground mt-2 text-center">
                {media.totalFiles} файл(а) общо
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.file_name}</DialogTitle>
          </DialogHeader>
          {previewFile?.public_url && (
            <img src={previewFile.public_url} alt={previewFile.file_name} className="w-full max-h-[70vh] object-contain rounded" />
          )}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{formatSize(previewFile?.file_size ?? null)}</span>
            {previewFile?.width && previewFile?.height && <span>{previewFile.width}×{previewFile.height}</span>}
            <span>{previewFile?.created_at ? new Date(previewFile.created_at).toLocaleDateString('bg-BG') : ''}</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Нова папка</DialogTitle>
          </DialogHeader>
          <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Име на папката" onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Отказ</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Създай</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={!!renameFolderId} onOpenChange={() => setRenameFolderId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Преименуване на папка</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRenameFolder()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFolderId(null)}>Отказ</Button>
            <Button onClick={handleRenameFolder} disabled={!renameValue.trim()}>Запази</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move file dialog */}
      <Dialog open={!!moveFileTarget} onOpenChange={() => setMoveFileTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Премести "{moveFileTarget?.file_name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button onClick={() => handleMoveFile(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted">
              <HardDrive className="w-4 h-4" /> Основна директория
            </button>
            {media.folders.map(f => (
              <button key={f.id} onClick={() => handleMoveFile(f.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-muted">
                <FolderOpen className="w-4 h-4" /> {f.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper components
function FileCard({ file, onPreview, onDelete, onMove, onDownload, formatSize }: {
  file: MediaFile; onPreview: () => void; onDelete: () => void; onMove: () => void; onDownload: () => void; formatSize: (n: number | null) => string;
}) {
  return (
    <div className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-card">
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden cursor-pointer" onClick={onPreview}>
        {file.public_url && file.mime_type?.startsWith('image/') ? (
          <img src={file.public_url} alt={file.file_name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <FileImage className="w-10 h-10 text-muted-foreground/50" />
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium truncate" title={file.file_name}>{file.file_name}</p>
        <p className="text-[10px] text-muted-foreground">{formatSize(file.file_size)}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 bg-background/80 backdrop-blur">
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onPreview}><Eye className="w-4 h-4 mr-2" />Преглед</DropdownMenuItem>
          <DropdownMenuItem onClick={onMove}><Move className="w-4 h-4 mr-2" />Премести</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Изтрий</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {file.product_id && (
        <Badge variant="secondary" className="absolute bottom-10 left-2 text-[9px] px-1 py-0">Продукт</Badge>
      )}
    </div>
  );
}

function FileRow({ file, onPreview, onDelete, onMove, formatSize }: {
  file: MediaFile; onPreview: () => void; onDelete: () => void; onMove: () => void; formatSize: (n: number | null) => string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-muted/50 group">
      <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer" onClick={onPreview}>
        {file.public_url && file.mime_type?.startsWith('image/') ? (
          <img src={file.public_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <FileImage className="w-5 h-5 text-muted-foreground/50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{file.file_name}</p>
        <p className="text-xs text-muted-foreground">{formatSize(file.file_size)} · {new Date(file.created_at).toLocaleDateString('bg-BG')}</p>
      </div>
      {file.product_id && <Badge variant="secondary" className="text-[10px]">Продукт</Badge>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onPreview}><Eye className="w-4 h-4 mr-2" />Преглед</DropdownMenuItem>
          <DropdownMenuItem onClick={onMove}><Move className="w-4 h-4 mr-2" />Премести</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Изтрий</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FolderItem({ folder, allFolders, currentFolderId, onSelect, onRename, onDelete, depth }: {
  folder: MediaFolder; allFolders: MediaFolder[]; currentFolderId: string | null;
  onSelect: (id: string) => void; onRename: (f: MediaFolder) => void; onDelete: (f: MediaFolder) => void; depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = allFolders.filter(f => f.parent_id === folder.id);
  const isActive = currentFolderId === folder.id;

  return (
    <div>
      <div
        className={`w-full flex items-center gap-1 px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {children.length > 0 ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? '' : '-rotate-90'}`} />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <button onClick={() => onSelect(folder.id)} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{folder.name}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100">
              <MoreVertical className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRename(folder)}><Pencil className="w-4 h-4 mr-2" />Преименувай</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(folder)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Изтрий</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && children.map(child => (
        <FolderItem
          key={child.id}
          folder={child}
          allFolders={allFolders}
          currentFolderId={currentFolderId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function getBreadcrumb(folders: MediaFolder[], currentId: string | null): MediaFolder[] {
  if (!currentId) return [];
  const result: MediaFolder[] = [];
  let current = folders.find(f => f.id === currentId);
  while (current) {
    result.unshift(current);
    current = current.parent_id ? folders.find(f => f.id === current!.parent_id) : undefined;
  }
  return result;
}
