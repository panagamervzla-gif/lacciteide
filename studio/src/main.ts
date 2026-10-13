import './styles.css';
import { buildTextureIni, createEmptyDictionary, exportPackage, importPackage, parseTextureIniForProject, validateDictionary } from './archive';
import { createProject, deleteProjectCompletely, getProject, getProjectFiles, getProjectTextureMappings, listProjects, saveProject, saveProjectFile, saveProjectFiles, saveProjectResources } from './storage';
import type { ProjectFile, ProjectRecord, TextureDictionary, TextureMappingRecord } from './types';

interface ProjectTreeNode {
  name: string;
  path: string;
  children: Map<string, ProjectTreeNode>;
  files: ProjectFile[];
  itemCount: number;
  previewFile?: ProjectFile;
}

interface ClipboardResource {
  path: string;
  directory: boolean;
}

const libraryView = document.querySelector<HTMLElement>('#libraryView')!;
const projectView = document.querySelector<HTMLElement>('#projectView')!;
const projectList = document.querySelector<HTMLElement>('#projectList')!;
const emptyLibrary = document.querySelector<HTMLElement>('#emptyLibrary')!;
const libraryStatus = document.querySelector<HTMLElement>('#libraryStatus')!;
const homeButton = document.querySelector<HTMLAnchorElement>('#homeButton')!;
const projectCount = document.querySelector<HTMLElement>('#projectCount')!;
const projectActionsDialog = document.querySelector<HTMLDialogElement>('#projectActionsDialog')!;
const projectActionsTitle = document.querySelector<HTMLElement>('#projectActionsTitle')!;
const closeProjectActionsButton = document.querySelector<HTMLButtonElement>('#closeProjectActions')!;
const projectEditDetailsAction = document.querySelector<HTMLButtonElement>('#projectEditDetailsAction')!;
const projectDeleteAction = document.querySelector<HTMLButtonElement>('#projectDeleteAction')!;
const projectDetailsDialog = document.querySelector<HTMLDialogElement>('#projectDetailsDialog')!;
const projectDetailsForm = document.querySelector<HTMLFormElement>('#projectDetailsForm')!;
const projectNameInput = document.querySelector<HTMLInputElement>('#projectNameInput')!;
const projectDescriptionInput = document.querySelector<HTMLTextAreaElement>('#projectDescriptionInput')!;
const projectDeleteDialog = document.querySelector<HTMLDialogElement>('#projectDeleteDialog')!;
const projectDeleteForm = document.querySelector<HTMLFormElement>('#projectDeleteForm')!;
const projectDeleteMessage = document.querySelector<HTMLElement>('#projectDeleteMessage')!;
const projectDeleteConfirmButton = projectDeleteForm.querySelector<HTMLButtonElement>('[value="delete"]')!;
const projectName = document.querySelector<HTMLElement>('#projectName')!;
const projectMeta = document.querySelector<HTMLElement>('#projectMeta')!;
const topbarProject = document.querySelector<HTMLElement>('#topbarProject')!;
const topbarActions = document.querySelector<HTMLElement>('#topbarActions')!;
const exportProjectButton = document.querySelector<HTMLButtonElement>('#exportProjectButton')!;
const addFilesButton = document.querySelector<HTMLButtonElement>('#addFilesButton')!;
const workspaceTabs = document.querySelector<HTMLElement>('#workspaceTabs')!;
const managerTab = document.querySelector<HTMLButtonElement>('#managerTab')!;
const inspectorTab = document.querySelector<HTMLButtonElement>('#inspectorTab')!;
const managerContent = document.querySelector<HTMLElement>('#managerContent')!;
const editorView = document.querySelector<HTMLElement>('#editorView')!;
const inspectorView = document.querySelector<HTMLElement>('#inspectorView')!;
const fileCount = document.querySelector<HTMLElement>('#fileCount')!;
const browserStatusCount = document.querySelector<HTMLElement>('#browserStatusCount')!;
const browserSelectionCount = document.querySelector<HTMLElement>('#browserSelectionCount')!;
const fileList = document.querySelector<HTMLElement>('#fileList')!;
const folderGrid = document.querySelector<HTMLElement>('#folderGrid')!;
const browserPath = document.querySelector<HTMLElement>('#browserPath')!;
const workbench = document.querySelector<HTMLElement>('#workbench')!;
const dictionaryPane = document.querySelector<HTMLElement>('#dictionaryPane')!;
const showDictionaryButton = document.querySelector<HTMLButtonElement>('#showDictionaryButton')!;
const closeDictionaryButton = document.querySelector<HTMLButtonElement>('#closeDictionaryButton')!;
const fileSearch = document.querySelector<HTMLInputElement>('#fileSearch')!;
const filesPane = document.querySelector<HTMLElement>('.files-pane')!;
const toggleFileSearchButton = document.querySelector<HTMLButtonElement>('#toggleFileSearch')!;
const sidebarResizer = document.querySelector<HTMLElement>('#sidebarResizer')!;
const selectedFileName = document.querySelector<HTMLElement>('#selectedFileName')!;
const selectedFileKind = document.querySelector<HTMLElement>('#selectedFileKind')!;
const assetFacts = document.querySelector<HTMLElement>('#assetFacts')!;
const dictionaryEditor = document.querySelector<HTMLTextAreaElement>('#dictionaryEditor')!;
const dictionaryStatus = document.querySelector<HTMLElement>('#dictionaryStatus')!;
const dictionaryAssetCount = document.querySelector<HTMLElement>('#dictionaryAssetCount')!;
const saveDictionaryButton = document.querySelector<HTMLButtonElement>('#saveDictionaryButton')!;
const saveState = document.querySelector<HTMLElement>('#saveState')!;
const openPhotopeaButton = document.querySelector<HTMLButtonElement>('#openPhotopeaButton')!;
const photopeaFrame = document.querySelector<HTMLIFrameElement>('#photopeaFrame')!;
const photopeaFileName = document.querySelector<HTMLElement>('#photopeaFileName')!;
const photopeaStatus = document.querySelector<HTMLElement>('#photopeaStatus')!;
const saveFromPhotopeaButton = document.querySelector<HTMLButtonElement>('#saveFromPhotopeaButton')!;
const inspectorImage = document.querySelector<HTMLImageElement>('#inspectorImage')!;
const inspectorFileName = document.querySelector<HTMLElement>('#inspectorFileName')!;
const inspectorFilePath = document.querySelector<HTMLElement>('#inspectorFilePath')!;
const inspectorDimensions = document.querySelector<HTMLElement>('#inspectorDimensions')!;
const inspectorFormat = document.querySelector<HTMLElement>('#inspectorFormat')!;
const inspectorSize = document.querySelector<HTMLElement>('#inspectorSize')!;
const inspectorOpenEditor = document.querySelector<HTMLButtonElement>('#inspectorOpenEditor')!;
const browserSearch = document.querySelector<HTMLInputElement>('#browserSearch')!;
const selectionCount = document.querySelector<HTMLElement>('#selectionCount')!;
const createFolderButton = document.querySelector<HTMLButtonElement>('#createFolderButton')!;
const cutResourcesButton = document.querySelector<HTMLButtonElement>('#cutResourcesButton')!;
const copyResourcesButton = document.querySelector<HTMLButtonElement>('#copyResourcesButton')!;
const renameResourceButton = document.querySelector<HTMLButtonElement>('#renameResourceButton')!;
const pasteResourcesButton = document.querySelector<HTMLButtonElement>('#pasteResourcesButton')!;
const exportSelectionButton = document.querySelector<HTMLButtonElement>('#exportSelectionButton')!;
const itemNameDialog = document.querySelector<HTMLDialogElement>('#itemNameDialog')!;
const itemNameTitle = document.querySelector<HTMLElement>('#itemNameTitle')!;
const itemNameLabel = document.querySelector<HTMLElement>('#itemNameLabel')!;
const itemNameInput = document.querySelector<HTMLInputElement>('#itemNameInput')!;
const resourceActionsDialog = document.querySelector<HTMLDialogElement>('#resourceActionsDialog')!;
const resourceActionsName = document.querySelector<HTMLElement>('#resourceActionsName')!;
const resourceActionKind = document.querySelector<HTMLElement>('#resourceActionKind')!;
const resourceRenameAction = document.querySelector<HTMLButtonElement>('#resourceRenameAction')!;
const resourceOpenFolderAction = document.querySelector<HTMLButtonElement>('#resourceOpenFolderAction')!;
const resourceCopyAction = document.querySelector<HTMLButtonElement>('#resourceCopyAction')!;
const resourceCutAction = document.querySelector<HTMLButtonElement>('#resourceCutAction')!;
const resourceExportAction = document.querySelector<HTMLButtonElement>('#resourceExportAction')!;
const resourceViewAction = document.querySelector<HTMLButtonElement>('#resourceViewAction')!;
const resourcePhotopeaAction = document.querySelector<HTMLButtonElement>('#resourcePhotopeaAction')!;
const zipInput = document.querySelector<HTMLInputElement>('#zipInput')!;
const filesInput = document.querySelector<HTMLInputElement>('#filesInput')!;

let activeProject: ProjectRecord | undefined;
let selectedLibraryProject: ProjectRecord | undefined;
let activeFiles: ProjectFile[] = [];
let activeDictionary: TextureDictionary | undefined;
let activeTextureMappings: TextureMappingRecord[] = [];
let selectedPath = '';
const selectedItems = new Set<string>();
let selectionAnchor = '';
let selectedDirectory = '';
let expandedDirectories = new Set<string>(['']);
let editorTimer = 0;
const photopeaOrigin = 'https://www.photopea.com';
let photopeaFilePath = '';
let photopeaOutputFormat = 'png';
let photopeaPhase: 'closed' | 'booting' | 'opening' | 'ready' | 'saving' = 'closed';
let pendingPhotopeaSave = false;
let photopeaOpenBuffer: ArrayBuffer | undefined;
const previewObjectUrls = new Set<string>();
let previewUrlsByBlob = new WeakMap<Blob, string>();
let inspectorObjectUrl = '';
let inspectorPath = '';
let resourceActionPath = '';
let clipboardPaths: string[] = [];
let clipboardOperation: 'copy' | 'cut' | undefined;
let resolveItemName: ((value: string | undefined) => void) | undefined;
let exportInProgress = false;

function setLibraryStatus(message: string, error = false): void {
  libraryStatus.textContent = message;
  libraryStatus.classList.toggle('error', error);
}

function setSaveState(message: string, kind: 'saved' | 'busy' | 'error' = 'saved'): void {
  saveState.textContent = message;
  saveState.dataset.state = kind;
}

function setExportInProgress(inProgress: boolean, message = ''): void {
  exportInProgress = inProgress;
  projectView.classList.toggle('exporting', inProgress);
  document.body.classList.toggle('exporting', inProgress);
  exportProjectButton.disabled = inProgress;
  filesInput.disabled = inProgress;
  addFilesButton.disabled = inProgress;
  showDictionaryButton.disabled = inProgress;
  saveDictionaryButton.disabled = inProgress;
  dictionaryEditor.readOnly = inProgress;
  saveFromPhotopeaButton.disabled = inProgress || photopeaPhase !== 'ready';
  if (inProgress) {
    window.clearTimeout(editorTimer);
    setSaveState(message, 'busy');
  }
  updateSelectedFileDetails();
  updateSelectionToolbar();
}

function updateProjectMeta(): void {
  const bytes = activeFiles.reduce((total, file) => total + file.blob.size, 0);
  const size = bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
  projectMeta.textContent = `${activeFiles.length} archivos · ${size}`;
}

function newId(): string {
  return crypto.randomUUID();
}

function makeDictionaryFile(project: ProjectRecord, dictionary: TextureDictionary): ProjectFile {
  const text = `${JSON.stringify(dictionary, null, 2)}\n`;
  return {
    projectId: project.id,
    path: project.dictionaryPath,
    blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
    mimeType: 'text/plain',
    kind: 'dictionary'
  };
}

function isPreviewableImage(file: ProjectFile): boolean {
  return file.mimeType.startsWith('image/') && /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.path);
}

function appendPreviewImage(container: HTMLElement, file: ProjectFile, className: string): void {
  const image = document.createElement('img');
  let url = previewUrlsByBlob.get(file.blob);
  if (!url) {
    url = URL.createObjectURL(file.blob);
    previewUrlsByBlob.set(file.blob, url);
    previewObjectUrls.add(url);
  }
  image.className = className;
  image.src = url;
  image.alt = '';
  image.title = file.path;
  image.loading = 'lazy';
  image.draggable = false;
  image.addEventListener('error', () => image.classList.add('preview-unavailable'), { once: true });
  container.append(image);
}

function clearPreviewObjectUrls(): void {
  for (const url of previewObjectUrls) URL.revokeObjectURL(url);
  previewObjectUrls.clear();
  previewUrlsByBlob = new WeakMap<Blob, string>();
}

async function renderLibrary(): Promise<void> {
  const projects = await listProjects();
  projectList.replaceChildren();
  projectCount.textContent = `${projects.length} proyecto${projects.length === 1 ? '' : 's'}`;
  emptyLibrary.hidden = false;
  for (const project of projects) {
    const row = document.createElement('article');
    row.className = 'project-row';
    const openButton = document.createElement('button');
    openButton.className = 'project-open';
    openButton.type = 'button';
    openButton.setAttribute('aria-label', `Abrir proyecto ${project.name}`);
    const identity = document.createElement('span');
    identity.className = 'project-identity';
    const mark = document.createElement('span');
    mark.className = 'project-mark';
    mark.textContent = '▦';
    const copy = document.createElement('span');
    copy.className = 'project-copy';
    const name = document.createElement('strong');
    name.textContent = project.name;
    copy.append(name);
    if (project.description) {
      const description = document.createElement('span');
      description.className = 'project-description';
      description.textContent = project.description;
      copy.append(description);
    }
    identity.append(mark, copy);
    const files = document.createElement('span');
    files.className = 'project-files-count';
    files.textContent = `${project.fileCount} archivos`;
    const modified = document.createElement('time');
    modified.className = 'project-date';
    modified.textContent = new Date(project.updatedAt).toLocaleString();
    openButton.append(identity, files, modified);
    openButton.addEventListener('click', () => void openProject(project.id).catch(error => setLibraryStatus(errorMessage(error), true)));
    const menuButton = document.createElement('button');
    menuButton.className = 'project-menu-button';
    menuButton.type = 'button';
    menuButton.textContent = '⋯';
    menuButton.title = `Opciones de ${project.name}`;
    menuButton.setAttribute('aria-label', `Opciones de ${project.name}`);
    menuButton.addEventListener('click', () => {
      selectedLibraryProject = project;
      projectActionsTitle.textContent = project.name;
      projectActionsDialog.showModal();
    });
    row.append(openButton, menuButton);
    projectList.append(row);
  }
  projectList.append(emptyLibrary);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

async function createBlankProject(): Promise<void> {
  const now = Date.now();
  const project: ProjectRecord = {
    id: newId(),
    name: 'Nuevo proyecto',
    createdAt: now,
    updatedAt: now,
    fileCount: 1,
    directories: [],
    dictionaryPath: 'texture-dictionary.txt'
  };
  const dictionary = createEmptyDictionary();
  await createProject(project, [makeDictionaryFile(project, dictionary)]);
  await openProject(project.id);
  await requestPersistentStorage();
}

async function importZipFile(file: File): Promise<void> {
  setLibraryStatus(`Importando ${file.name}…`);
  const id = newId();
  const imported = await importPackage(file, id);
  const now = Date.now();
  const project: ProjectRecord = {
    id,
    name: imported.name,
    createdAt: now,
    updatedAt: now,
    fileCount: imported.files.length,
    directories: imported.directories,
    dictionaryPath: imported.dictionaryPath,
    texturesIniPath: imported.texturesIniPath,
    texturesIniHeader: imported.texturesIniHeader
  };
  await createProject(project, imported.files, imported.textureMappings);
  await openProject(id);
  await requestPersistentStorage();
  setLibraryStatus(`Proyecto creado desde ${file.name}. El ZIP original no se modificó.`);
}

async function requestPersistentStorage(): Promise<void> {
  if (!navigator.storage?.persist) return;
  try {
    const persisted = await navigator.storage.persist();
    setSaveState(persisted ? 'Almacenamiento persistente' : 'Guardado local');
  } catch {
    setSaveState('Guardado local');
  }
}

async function openProject(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project) throw new Error('No se encontró el proyecto en este navegador.');
  clearPreviewObjectUrls();
  activeProject = project;
  activeFiles = await getProjectFiles(projectId);
  activeTextureMappings = await getProjectTextureMappings(projectId);
  if (!activeProject.texturesIniPath) {
    const iniFile = activeFiles.find(file => file.path.split('/').at(-1)?.toLowerCase() === 'textures.ini');
    if (iniFile) {
      const parsedIni = parseTextureIniForProject(
        await iniFile.blob.text(),
        activeProject.id,
        iniFile.path,
        activeFiles.map(file => file.path)
      );
      activeProject = { ...activeProject, texturesIniPath: iniFile.path, texturesIniHeader: parsedIni.header };
      activeTextureMappings = parsedIni.mappings;
      await saveProjectResources(activeProject, [], [], { upsert: activeTextureMappings });
    }
  }
  selectedPath = '';
  selectedItems.clear();
  selectionAnchor = '';
  clipboardPaths = [];
  clipboardOperation = undefined;
  selectedDirectory = '';
  expandedDirectories = new Set(['']);
  document.body.classList.add('project-active');
  libraryView.hidden = true;
  projectView.hidden = false;
  topbarProject.textContent = project.name;
  topbarProject.hidden = false;
  topbarActions.hidden = false;
  workspaceTabs.hidden = false;
  showManagerView();
  setFilesPaneWidth(filesPane.getBoundingClientRect().width || 240);
  browserSearch.value = '';
  const sidecar = activeFiles.find(file => file.path === project.dictionaryPath);
  if (!sidecar) {
    const created = makeDictionaryFile(project, createEmptyDictionary());
    await saveProjectFile(project, created);
    activeFiles.push(created);
    activeProject = { ...activeProject, fileCount: activeFiles.length };
    await saveProject(activeProject);
    dictionaryEditor.value = await created.blob.text();
  } else {
    dictionaryEditor.value = await sidecar.blob.text();
  }
  updateProjectMeta();
  try {
    activeDictionary = validateDictionary(dictionaryEditor.value);
    updateDictionaryCount();
    dictionaryStatus.textContent = project.dictionaryPath;
    dictionaryStatus.classList.remove('error');
  } catch {
    activeDictionary = undefined;
    dictionaryStatus.textContent = 'Diccionario no válido; corrige el JSON para guardar.';
    dictionaryStatus.classList.add('error');
  }
  setDictionaryVisible(false);
  updateSelectionToolbar();
  updateSelectedFileDetails();
  renderProjectExplorer();
  setSaveState('Guardado local');
}

function buildProjectTree(): ProjectTreeNode {
  updateSelectionToolbar();
  updateSelectedFileDetails();
  const root: ProjectTreeNode = { name: activeProject?.name ?? 'Proyecto', path: '', children: new Map(), files: [], itemCount: 0 };
  for (const file of activeFiles) {
    const parts = file.path.split('/').filter(Boolean);
    const fileName = parts.pop();
    let node = root;
    if (isPreviewableImage(file) && !node.previewFile) node.previewFile = file;
    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!node.children.has(part)) node.children.set(part, { name: part, path: currentPath, children: new Map(), files: [], itemCount: 0 });
      node = node.children.get(part)!;
      if (isPreviewableImage(file) && !node.previewFile) node.previewFile = file;
    }
    if (fileName) node.files.push(file);
  }
  for (const path of activeProject?.directories ?? []) {
    let node = root;
    let currentPath = '';
    for (const part of path.split('/').filter(Boolean)) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!node.children.has(part)) node.children.set(part, { name: part, path: currentPath, children: new Map(), files: [], itemCount: 0 });
      node = node.children.get(part)!;
    }
  }
  const countItems = (node: ProjectTreeNode): number => {
    node.itemCount = node.files.length;
    for (const child of node.children.values()) node.itemCount += countItems(child);
    return node.itemCount;
  };
  countItems(root);
  return root;
}

function findDirectory(root: ProjectTreeNode, path: string): ProjectTreeNode | undefined {
  if (!path) return root;
  let current = root;
  for (const part of path.split('/')) {
    const next = current.children.get(part);
    if (!next) return undefined;
    current = next;
  }
  return current;
}

function renderFolderBranch(container: HTMLElement, node: ProjectTreeNode, depth = 0): void {
  for (const child of node.children.values()) {
    const row = document.createElement('div');
    row.className = 'folder-tree-row';
    row.style.setProperty('--tree-depth', String(depth));
    const toggle = document.createElement('button');
    toggle.className = 'tree-toggle';
    toggle.type = 'button';
    toggle.disabled = child.children.size === 0;
    toggle.textContent = child.children.size ? (expandedDirectories.has(child.path) ? '⌄' : '›') : '·';
    toggle.setAttribute('aria-label', `Expandir o contraer ${child.name}`);
    toggle.addEventListener('click', () => {
      if (expandedDirectories.has(child.path)) expandedDirectories.delete(child.path);
      else expandedDirectories.add(child.path);
      renderProjectExplorer();
    });
    const select = document.createElement('button');
    select.className = `tree-folder${selectedDirectory === child.path ? ' active' : ''}`;
    select.type = 'button';
    select.title = child.path;
    const icon = document.createElement('span');
    icon.className = 'tree-folder-icon';
    icon.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'tree-folder-name';
    name.textContent = child.name;
    select.append(icon);
    if (child.previewFile) appendPreviewImage(select, child.previewFile, 'tree-folder-thumbnail');
    select.append(name);
    select.addEventListener('click', () => selectDirectory(child.path));
    row.append(toggle, select);
    container.append(row);
    if (child.children.size && expandedDirectories.has(child.path)) {
      const branch = document.createElement('div');
      branch.className = 'folder-tree-branch';
      container.append(branch);
      renderFolderBranch(branch, child, depth + 1);
    }
  }
}

function renderFileTree(root = buildProjectTree()): void {
  fileList.replaceChildren();
  const rootRow = document.createElement('button');
  rootRow.className = `file-row${selectedDirectory === '' ? ' active' : ''}`;
  rootRow.type = 'button';
  rootRow.innerHTML = '<span class="file-row-icon tree-folder-icon" aria-hidden="true"></span><span class="file-row-name">Proyecto</span>';
  rootRow.addEventListener('click', () => selectDirectory(''));
  fileList.append(rootRow);
  if (expandedDirectories.has('')) renderFolderBranch(fileList, root);
}

function visibleResourcePaths(): string[] {
  return [...folderGrid.querySelectorAll<HTMLElement>('[data-resource-path]')]
    .map(item => item.dataset.resourcePath)
    .filter((path): path is string => Boolean(path));
}

function updateSelectionToolbar(): void {
  const count = selectedItems.size;
  selectionCount.textContent = `${count} seleccionado${count === 1 ? '' : 's'}`;
  browserSelectionCount.textContent = `${count} seleccionado${count === 1 ? '' : 's'}`;
  const containsProtectedResource = [...selectedItems].some(isProtectedResource);
  createFolderButton.disabled = exportInProgress;
  cutResourcesButton.disabled = exportInProgress || count === 0 || containsProtectedResource;
  copyResourcesButton.disabled = exportInProgress || count === 0 || containsProtectedResource;
  renameResourceButton.disabled = exportInProgress || count !== 1 || containsProtectedResource;
  exportSelectionButton.disabled = exportInProgress || count === 0;
  pasteResourcesButton.hidden = !clipboardOperation;
  pasteResourcesButton.disabled = exportInProgress || !clipboardOperation || clipboardPaths.length === 0;
  if (clipboardOperation) pasteResourcesButton.title = clipboardOperation === 'cut' ? 'Mover aquí' : 'Pegar copia aquí';
}

function updateSelectedFileDetails(): void {
  const selectedFiles = [...selectedItems].filter(path => activeFiles.some(file => file.path === path));
  const file = selectedFiles.length === 1 && selectedItems.size === 1
    ? activeFiles.find(item => item.path === selectedFiles[0])
    : undefined;
  if (!file) {
    selectedFileName.textContent = selectedItems.size ? `${selectedItems.size} recursos seleccionados` : 'Selecciona una textura';
    selectedFileKind.textContent = '';
    assetFacts.textContent = '';
    openPhotopeaButton.disabled = true;
    inspectorTab.disabled = true;
    return;
  }
  const supportedPhotopeaImage = /\.(png|jpe?g|webp|gif)$/i.test(file.path) && file.mimeType.startsWith('image/');
  openPhotopeaButton.disabled = !supportedPhotopeaImage;
  openPhotopeaButton.disabled = exportInProgress || !supportedPhotopeaImage;
  inspectorTab.disabled = exportInProgress || !isPreviewableImage(file);
  selectedFileName.textContent = file.path.split('/').at(-1) ?? file.path;
  selectedFileKind.textContent = file.kind === 'dictionary' ? 'DICCIONARIO' : file.mimeType || 'ARCHIVO';
  const asset = activeDictionary?.assets.find(item => item.path === file.path);
  assetFacts.textContent = asset
    ? `${asset.hashes.length} hashes · ${asset.name || 'Sin nombre descriptivo'}${asset.tags.length ? ` · ${asset.tags.join(', ')}` : ''}${asset.description ? ` · ${asset.description}` : ''}`
    : file.kind === 'dictionary' ? 'Metadata portable del proyecto.' : 'Sin ficha de diccionario asociada.';
}

function syncResourceSelectionStyles(): void {
  for (const card of folderGrid.querySelectorAll<HTMLElement>('[data-resource-path]')) {
    const path = card.dataset.resourcePath ?? '';
    const selected = selectedItems.has(path);
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', String(selected));
    card.classList.toggle('cutting', clipboardOperation === 'cut' && clipboardPaths.includes(path));
  }
}

function selectResource(path: string, event?: MouseEvent): void {
  const visiblePaths = visibleResourcePaths();
  const isRange = Boolean(event?.shiftKey && selectionAnchor && visiblePaths.includes(selectionAnchor));
  if (isRange) {
    const start = visiblePaths.indexOf(selectionAnchor);
    const end = visiblePaths.indexOf(path);
    if (!event?.ctrlKey && !event?.metaKey) selectedItems.clear();
    for (const item of visiblePaths.slice(Math.min(start, end), Math.max(start, end) + 1)) selectedItems.add(item);
  } else if (event?.ctrlKey || event?.metaKey) {
    if (selectedItems.has(path)) selectedItems.delete(path);
    else selectedItems.add(path);
    selectionAnchor = path;
  } else {
    selectedItems.clear();
    selectedItems.add(path);
    selectionAnchor = path;
  }
  selectedPath = selectedItems.size === 1 && activeFiles.some(file => file.path === path) && selectedItems.has(path) ? path : '';
  updateSelectedFileDetails();
  updateSelectionToolbar();
  syncResourceSelectionStyles();
}

function openResourceActions(path: string): void {
    if (exportInProgress) return;
  if (selectedItems.size !== 1 || !selectedItems.has(path)) selectResource(path);
  const directory = isDirectoryResource(path);
  const file = activeFiles.find(item => item.path === path);
  resourceActionPath = path;
  resourceActionKind.textContent = directory ? 'Carpeta' : file?.mimeType || 'Archivo';
  resourceActionsName.textContent = resourceName(path);
  resourceRenameAction.disabled = isProtectedResource(path);
  resourceOpenFolderAction.hidden = !directory;
  resourceCopyAction.disabled = isProtectedResource(path);
  resourceCutAction.disabled = isProtectedResource(path);
  resourceExportAction.disabled = false;
  resourceViewAction.hidden = !file || !isPreviewableImage(file);
  resourcePhotopeaAction.hidden = !file || !outputSettings(path);
  resourceActionsDialog.showModal();
}

function renderBrowser(root = buildProjectTree()): void {
  const current = findDirectory(root, selectedDirectory) ?? root;
  const query = (browserSearch.value || fileSearch.value).trim().toLowerCase();
  const pathSegments = selectedDirectory.split('/').filter(Boolean);
  const directoryName = pathSegments.at(-1);
  projectName.textContent = directoryName
    ? directoryName.toLowerCase() === 'textures' ? 'Texturas' : directoryName
    : activeProject?.name ?? 'Proyecto';
  folderGrid.replaceChildren();
  browserPath.replaceChildren();

  const pathParts = selectedDirectory ? [] : [{ label: 'Proyecto', path: '' }];
  let accumulated = '';
  for (const part of pathSegments) {
    accumulated = accumulated ? `${accumulated}/${part}` : part;
    pathParts.push({ label: part, path: accumulated });
  }
  for (const [index, part] of pathParts.entries()) {
    if (index) {
      const separator = document.createElement('span');
      separator.className = 'path-separator';
      separator.textContent = '›';
      browserPath.append(separator);
    }
    const crumb = document.createElement('button');
    crumb.className = `path-crumb${index === pathParts.length - 1 ? ' path-current' : ''}`;
    crumb.type = 'button';
    crumb.textContent = part.label;
    crumb.addEventListener('click', () => selectDirectory(part.path));
    browserPath.append(crumb);
  }

  let shown = 0;
  for (const child of current.children.values()) {
    if (query && !child.name.toLowerCase().includes(query) && !child.path.toLowerCase().includes(query)) continue;
    const card = document.createElement('button');
    card.className = `folder-card${selectedItems.has(child.path) ? ' selected' : ''}${clipboardOperation === 'cut' && clipboardPaths.includes(child.path) ? ' cutting' : ''}`;
    card.type = 'button';
    card.dataset.resourcePath = child.path;
    card.setAttribute('aria-pressed', String(selectedItems.has(child.path)));
    const art = document.createElement('span');
    art.className = 'folder-art';
    const icon = document.createElement('span');
    icon.className = 'folder-symbol';
    icon.setAttribute('aria-hidden', 'true');
    const swatch = document.createElement('span');
    swatch.className = 'folder-swatch';
    swatch.setAttribute('aria-hidden', 'true');
    if (child.previewFile) appendPreviewImage(art, child.previewFile, 'folder-preview');
    art.append(icon, swatch);
    const footer = document.createElement('span');
    footer.className = 'folder-card-footer';
    const label = document.createElement('strong');
    label.textContent = child.name;
    const count = document.createElement('small');
    count.textContent = `${child.itemCount} elementos`;
    footer.append(label, count);
    card.append(art, footer);
    card.addEventListener('click', event => {
      if (event.detail === 0 && !event.shiftKey && !event.ctrlKey && !event.metaKey) selectDirectory(child.path);
      else selectResource(child.path, event);
    });
    card.addEventListener('dblclick', () => openResourceActions(child.path));
    folderGrid.append(card);
    shown += 1;
  }
  const visibleFiles = current.files.filter(file => !query || file.path.toLowerCase().includes(query));
  for (const file of visibleFiles) {
    const card = document.createElement('button');
    card.className = `project-file-card${selectedItems.has(file.path) ? ' selected' : ''}${clipboardOperation === 'cut' && clipboardPaths.includes(file.path) ? ' cutting' : ''}`;
    card.type = 'button';
    card.dataset.resourcePath = file.path;
    card.setAttribute('aria-pressed', String(selectedItems.has(file.path)));
    const icon = document.createElement('span');
    icon.className = 'project-file-icon';
    if (isPreviewableImage(file)) {
      appendPreviewImage(card, file, 'project-file-preview');
    } else {
      icon.textContent = file.kind === 'dictionary' ? '≡' : `.${file.path.split('.').at(-1)?.slice(0, 4).toUpperCase() ?? 'FILE'}`;
      card.append(icon);
    }
    const name = document.createElement('span');
    name.textContent = file.path.split('/').at(-1) ?? file.path;
    name.title = file.path;
    card.append(name);
    card.addEventListener('click', event => selectResource(file.path, event));
    card.addEventListener('dblclick', () => openResourceActions(file.path));
    folderGrid.append(card);
    shown += 1;
  }
  fileCount.textContent = `${shown} elementos`;
  browserStatusCount.textContent = `${shown} elementos`;
  if (shown === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-folder';
    empty.textContent = query ? 'No hay elementos que coincidan.' : 'Esta carpeta está vacía.';
    folderGrid.append(empty);
  }
}

function renderProjectExplorer(): void {
  const root = buildProjectTree();
  renderFileTree(root);
  renderBrowser(root);
}

function setFilesPaneWidth(width: number): void {
  const minimum = parseFloat(getComputedStyle(document.documentElement).fontSize) * 9;
  const maximum = Math.max(minimum, Math.floor(workbench.clientWidth * 0.5));
  const nextWidth = Math.max(minimum, Math.min(maximum, width));
  workbench.style.setProperty('--files-pane-width', `${nextWidth}px`);
  sidebarResizer.setAttribute('aria-valuemin', String(minimum));
  sidebarResizer.setAttribute('aria-valuenow', String(nextWidth));
  sidebarResizer.setAttribute('aria-valuemax', String(maximum));
}

function selectDirectory(path: string): void {
  selectedDirectory = path;
  selectedPath = '';
  selectedItems.clear();
  selectionAnchor = '';
  updateSelectedFileDetails();
  updateSelectionToolbar();
  openPhotopeaButton.disabled = true;
  if (path) expandedDirectories.add(path);
  renderProjectExplorer();
}

function updateDictionaryCount(): void {
  const count = activeDictionary?.assets.length ?? 0;
  dictionaryAssetCount.textContent = `${count} ficha${count === 1 ? '' : 's'}`;
}

function setDictionaryVisible(visible: boolean): void {
  dictionaryPane.hidden = !visible;
  workbench.classList.toggle('dictionary-closed', !visible);
  showDictionaryButton.hidden = visible;
  showDictionaryButton.setAttribute('aria-pressed', String(visible));
  showDictionaryButton.title = visible ? 'Diccionario visible' : 'Mostrar diccionario';
  showDictionaryButton.setAttribute('aria-label', showDictionaryButton.title);
}

function selectFile(path: string): void {
  selectedItems.clear();
  selectedItems.add(path);
  selectedPath = path;
  selectionAnchor = path;
  updateSelectedFileDetails();
  updateSelectionToolbar();
  renderProjectExplorer();
}

function parentResourcePath(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash < 0 ? '' : path.slice(0, slash);
}

function resourceName(path: string): string {
  return path.split('/').at(-1) ?? path;
}

function knownDirectoryPaths(): Set<string> {
  const directories = new Set(activeProject?.directories ?? []);
  for (const file of activeFiles) {
    const parts = file.path.split('/').filter(Boolean);
    parts.pop();
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      directories.add(current);
    }
  }
  return directories;
}

function allResourcePaths(): Set<string> {
  const paths = knownDirectoryPaths();
  for (const file of activeFiles) paths.add(file.path);
  return paths;
}

function isDirectoryResource(path: string): boolean {
  return knownDirectoryPaths().has(path) || activeFiles.some(file => file.path.startsWith(`${path}/`));
}

function isProtectedResource(path: string): boolean {
  return Boolean(activeProject && (
    activeProject.dictionaryPath === path
    || activeProject.dictionaryPath.startsWith(`${path}/`)
    || activeProject.texturesIniPath === path
    || activeProject.texturesIniPath?.startsWith(`${path}/`)
  ));
}

function hasProtectedSelection(): boolean {
  return [...selectedItems].some(isProtectedResource);
}

function pathCollision(path: string, directory: boolean, occupied: Set<string>): boolean {
  const normalized = path.toLowerCase();
  return [...occupied].some(existing => {
    const candidate = existing.toLowerCase();
    return candidate === normalized || (directory && candidate.startsWith(`${normalized}/`));
  });
}

function uniqueResourcePath(path: string, directory: boolean, occupied: Set<string>): string {
  if (!pathCollision(path, directory, occupied)) return path;
  const parent = parentResourcePath(path);
  const name = resourceName(path);
  const extensionIndex = directory ? -1 : name.lastIndexOf('.');
  const stem = extensionIndex > 0 ? name.slice(0, extensionIndex) : name;
  const extension = extensionIndex > 0 ? name.slice(extensionIndex) : '';
  for (let suffix = 2; ; suffix += 1) {
    const nextName = `${stem} (${suffix})${extension}`;
    const candidate = parent ? `${parent}/${nextName}` : nextName;
    if (!pathCollision(candidate, directory, occupied)) return candidate;
  }
}

function remapResourcePath(path: string, mappings: Map<string, string>): string {
  const mapping = [...mappings.entries()]
    .filter(([source]) => path === source || path.startsWith(`${source}/`))
    .sort((left, right) => right[0].length - left[0].length)[0];
  return mapping ? `${mapping[1]}${path.slice(mapping[0].length)}` : path;
}

function createResourcePathRemapper(mappings: Map<string, string>): (path: string) => string {
  const orderedMappings = [...mappings.entries()].sort((left, right) => right[0].length - left[0].length);
  return path => {
    const mapping = orderedMappings.find(([source]) => path === source || path.startsWith(`${source}/`));
    return mapping ? `${mapping[1]}${path.slice(mapping[0].length)}` : path;
  };
}

function textureIniPathForResource(project: ProjectRecord, resourcePath: string): string {
  const iniRoot = project.texturesIniPath ? parentResourcePath(project.texturesIniPath) : '';
  return iniRoot && resourcePath.startsWith(`${iniRoot}/`) ? resourcePath.slice(iniRoot.length + 1) : resourcePath;
}

function requestItemName(title: string, label: string, initialValue = ''): Promise<string | undefined> {
  itemNameTitle.textContent = title;
  itemNameLabel.textContent = label;
  itemNameInput.value = initialValue;
  itemNameDialog.showModal();
  itemNameInput.focus();
  itemNameInput.select();
  return new Promise(resolve => { resolveItemName = resolve; });
}

function validResourceName(value: string): string | undefined {
  const name = value.trim();
  if (!name || name === '.' || name === '..' || /[/\\\u0000-\u001f]/.test(name)) return undefined;
  return name;
}

async function persistResourceChanges(
  filesToSave: ProjectFile[],
  removedPaths: string[],
  directories: Set<string>,
  mappings: Map<string, string>,
  copyDictionaryEntries = false
): Promise<void> {
  if (!activeProject) return;
  const nextFiles = new Map(activeFiles.filter(file => !removedPaths.includes(file.path)).map(file => [file.path, file]));
  for (const file of filesToSave) nextFiles.set(file.path, file);
  const remapPath = createResourcePathRemapper(mappings);
  let nextDictionary = activeDictionary;
  let dictionaryChanged = false;
  if (nextDictionary && mappings.size) {
    const assets = nextDictionary.assets.flatMap(asset => {
      const path = remapPath(asset.path);
      if (path === asset.path) return [asset];
      dictionaryChanged = true;
      return copyDictionaryEntries ? [asset, { ...asset, id: newId(), path }] : [{ ...asset, path }];
    });
    if (dictionaryChanged) {
      nextDictionary = { ...nextDictionary, assets };
    }
  }
  const nextProject: ProjectRecord = {
    ...activeProject,
    dictionaryPath: copyDictionaryEntries ? activeProject.dictionaryPath : remapPath(activeProject.dictionaryPath),
    directories: [...directories].sort(),
    fileCount: nextFiles.size,
    updatedAt: Date.now()
  };
  const updatedTextureMappings = new Map<string, TextureMappingRecord>();
  if (!copyDictionaryEntries && mappings.size > 0) {
    for (const mapping of activeTextureMappings) {
      if (!mapping.resourcePath) continue;
      const resourcePath = remapPath(mapping.resourcePath);
      if (resourcePath !== mapping.resourcePath) {
        updatedTextureMappings.set(mapping.id, {
          ...mapping,
          resourcePath,
          targetPath: textureIniPathForResource(nextProject, resourcePath)
        });
      }
    }
  }
  if (dictionaryChanged && nextDictionary) {
    const sidecar = makeDictionaryFile(nextProject, nextDictionary);
    filesToSave.push(sidecar);
    nextFiles.set(sidecar.path, sidecar);
  }
  await saveProjectResources(nextProject, filesToSave, removedPaths, updatedTextureMappings.size
    ? { upsert: [...updatedTextureMappings.values()] }
    : undefined);
  activeProject = nextProject;
  activeFiles = [...nextFiles.values()].sort((left, right) => left.path.localeCompare(right.path));
  if (updatedTextureMappings.size) {
    activeTextureMappings = activeTextureMappings.map(mapping => updatedTextureMappings.get(mapping.id) ?? mapping);
  }
  if (dictionaryChanged) activeDictionary = nextDictionary;
  if (nextDictionary) {
    dictionaryEditor.value = `${JSON.stringify(nextDictionary, null, 2)}\n`;
    updateDictionaryCount();
  }
  updateProjectMeta();
  renderProjectExplorer();
  setSaveState('Guardado local');
}

async function createFolder(): Promise<void> {
  if (!activeProject || exportInProgress) return;
  const input = await requestItemName('Nueva carpeta', 'Nombre de la carpeta');
  if (!input) return;
  const name = validResourceName(input);
  if (!name) {
    setSaveState('Nombre de carpeta no válido', 'error');
    return;
  }
  const path = selectedDirectory ? `${selectedDirectory}/${name}` : name;
  if (pathCollision(path, true, allResourcePaths())) {
    setSaveState('Ya existe un recurso con ese nombre', 'error');
    return;
  }
  const directories = knownDirectoryPaths();
  directories.add(path);
  await persistResourceChanges([], [], directories, new Map());
}

function topLevelSelectedResources(): ClipboardResource[] {
  const paths = [...selectedItems].sort((left, right) => left.length - right.length);
  const items: ClipboardResource[] = [];
  for (const path of paths) {
    if (items.some(item => item.directory && path.startsWith(`${item.path}/`))) continue;
    items.push({ path, directory: isDirectoryResource(path) });
  }
  return items;
}

function setResourceClipboard(operation: 'copy' | 'cut'): void {
  if (exportInProgress) return;
  clipboardPaths = topLevelSelectedResources().map(item => item.path);
  clipboardOperation = operation;
  updateSelectionToolbar();
  syncResourceSelectionStyles();
}

function addGeneratedTextureIni(files: ProjectFile[], mappings: TextureMappingRecord[]): ProjectFile[] {
  if (!activeProject?.texturesIniPath) return files;
  const originalIni = activeFiles.find(file => file.path === activeProject!.texturesIniPath);
  if (!originalIni || !activeProject.texturesIniHeader) throw new Error('No se pudo recuperar la cabecera original de textures.ini.');
  const generatedIni = buildTextureIni(activeProject.texturesIniHeader, mappings);
  const outputIni: ProjectFile = {
    ...originalIni,
    blob: new Blob([generatedIni], { type: 'text/plain;charset=utf-8' }),
    mimeType: 'text/plain'
  };
  return [...files.filter(file => file.path !== outputIni.path), outputIni];
}

async function exportSelection(): Promise<void> {
  if (!activeProject || selectedItems.size === 0 || exportInProgress) return;
  setExportInProgress(true, 'Preparando selección…');
  try {
    const entries = topLevelSelectedResources();
    const files = activeFiles.filter(file => entries.some(item =>
      item.directory ? file.path.startsWith(`${item.path}/`) : file.path === item.path
    ));
    const resourcePaths = new Set(files.map(file => file.path));
    const mappings = activeTextureMappings.filter(mapping => mapping.resourcePath && resourcePaths.has(mapping.resourcePath));
    const directories = new Set<string>();
    for (const item of entries.filter(entry => entry.directory)) {
      directories.add(item.path);
      for (const path of activeProject.directories) {
        if (path === item.path || path.startsWith(`${item.path}/`)) directories.add(path);
      }
    }
    const exportFiles = addGeneratedTextureIni(files, mappings);
    setSaveState('Preparando selección…', 'busy');
    setSaveState('Generando ZIP…', 'busy');
    await exportPackage(exportFiles, [...directories], `${activeProject.name}-seleccionados`);
    setSaveState('Selección exportada');
  } catch (error) {
    setSaveState(errorMessage(error), 'error');
  } finally {
    setExportInProgress(false);
  }
}

async function renameSelection(): Promise<void> {
  if (!activeProject || exportInProgress || selectedItems.size !== 1 || hasProtectedSelection()) return;
  const entry = topLevelSelectedResources()[0];
  if (!entry) return;
  const input = await requestItemName('Renombrar recurso', entry.directory ? 'Nombre de la carpeta' : 'Nombre del archivo', resourceName(entry.path));
  if (!input) return;
  const name = validResourceName(input);
  if (!name) {
    setSaveState('Nombre no válido', 'error');
    return;
  }
  const parent = parentResourcePath(entry.path);
  const target = parent ? `${parent}/${name}` : name;
  const knownPaths = allResourcePaths();
  const removedPaths = activeFiles.filter(file => entry.directory
    ? file.path.startsWith(`${entry.path}/`)
    : file.path === entry.path
  ).map(file => file.path);
  const movedDirectories = entry.directory
    ? [...knownDirectoryPaths()].filter(path => path === entry.path || path.startsWith(`${entry.path}/`))
    : [];
  for (const path of [...removedPaths, ...movedDirectories]) knownPaths.delete(path);
  if (target !== entry.path && pathCollision(target, entry.directory, knownPaths)) {
    setSaveState('Ya existe un recurso con ese nombre', 'error');
    return;
  }
  if (target === entry.path) return;
  const mappings = new Map([[entry.path, target]]);
  const filesToSave = activeFiles
    .filter(file => removedPaths.includes(file.path))
    .map(file => ({ ...file, path: remapResourcePath(file.path, mappings) }));
  const directories = new Set([...activeProject.directories].map(path => remapResourcePath(path, mappings)));
  if (entry.directory) directories.add(target);
  await persistResourceChanges(filesToSave, removedPaths, directories, mappings);
  if (clipboardPaths.some(path => path === entry.path || path.startsWith(`${entry.path}/`))) {
    clipboardPaths = [];
    clipboardOperation = undefined;
  }
  selectedItems.clear();
  selectedItems.add(target);
  selectedPath = entry.directory ? '' : target;
  selectionAnchor = target;
  updateSelectedFileDetails();
  updateSelectionToolbar();
  renderProjectExplorer();
}

async function pasteResources(): Promise<void> {
  if (!activeProject || exportInProgress || !clipboardOperation || clipboardPaths.length === 0) return;
  const operation = clipboardOperation;
  const items = clipboardPaths.map(path => ({ path, directory: isDirectoryResource(path) }));
  const occupied = allResourcePaths();
  const directories = knownDirectoryPaths();
  const mappings = new Map<string, string>();
  const filesToSave: ProjectFile[] = [];
  const removedPaths: string[] = [];
  const nextSelection = new Set<string>();

  for (const item of items) {
    if (item.directory && (selectedDirectory === item.path || selectedDirectory.startsWith(`${item.path}/`))) continue;
    if (operation === 'cut' && parentResourcePath(item.path) === selectedDirectory) continue;
    const destination = selectedDirectory ? `${selectedDirectory}/${resourceName(item.path)}` : resourceName(item.path);
    const target = uniqueResourcePath(destination, item.directory, occupied);
    if (target === item.path) continue;
    occupied.add(target);
    mappings.set(item.path, target);
    nextSelection.add(target);

    const sourceFiles = activeFiles.filter(file => item.directory
      ? file.path.startsWith(`${item.path}/`)
      : file.path === item.path
    );
    for (const file of sourceFiles) {
      const nextPath = remapResourcePath(file.path, mappings);
      filesToSave.push({ ...file, path: nextPath });
      if (operation === 'cut') removedPaths.push(file.path);
      occupied.add(nextPath);
    }

    if (item.directory) {
      const sourceDirectories = [...knownDirectoryPaths()].filter(path => path === item.path || path.startsWith(`${item.path}/`));
      if (!sourceDirectories.includes(item.path)) sourceDirectories.push(item.path);
      for (const path of sourceDirectories) {
        if (operation === 'cut') directories.delete(path);
        const nextPath = remapResourcePath(path, mappings);
        directories.add(nextPath);
        occupied.add(nextPath);
      }
    }
  }

  if (!filesToSave.length && !nextSelection.size) {
    setSaveState('No hay recursos que pegar en esta carpeta', 'error');
    return;
  }
  await persistResourceChanges(filesToSave, removedPaths, directories, mappings, operation === 'copy');
  if (operation === 'cut') {
    clipboardPaths = [];
    clipboardOperation = undefined;
  }
  selectedItems.clear();
  for (const path of nextSelection) selectedItems.add(path);
  selectedPath = selectedItems.size === 1 && activeFiles.some(file => file.path === [...selectedItems][0])
    ? [...selectedItems][0]
    : '';
  selectionAnchor = [...selectedItems][0] ?? '';
  updateSelectedFileDetails();
  updateSelectionToolbar();
  renderProjectExplorer();
}

function outputSettings(path: string): { format: string; mimeType: string } | undefined {
  const extension = path.split('.').at(-1)?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return { format: 'jpg', mimeType: 'image/jpeg' };
  if (extension === 'webp') return { format: 'webp', mimeType: 'image/webp' };
  if (extension === 'gif') return { format: 'gif', mimeType: 'image/gif' };
  if (extension === 'png') return { format: 'png', mimeType: 'image/png' };
  return undefined;
}

async function openSelectedInPhotopea(): Promise<void> {
  if (!activeProject || !selectedPath) return;
  const file = activeFiles.find(item => item.path === selectedPath);
  const output = outputSettings(selectedPath);
  if (!file || !output) return;

  photopeaFilePath = file.path;
  photopeaOutputFormat = output.format;
  photopeaOpenBuffer = await file.blob.arrayBuffer();
  pendingPhotopeaSave = false;
  photopeaPhase = 'booting';
  photopeaFileName.textContent = file.path;
  photopeaStatus.textContent = 'Conectando con Photopea…';
  saveFromPhotopeaButton.disabled = true;

  const configuration = {
    environment: {
      intro: false,
      localsave: false,
      customIO: {
        open: 'app.echoToOE("texture-workbench:open");',
        save: `app.echoToOE("texture-workbench:save");app.activeDocument.saveToOE("${output.format}");`
      }
    },
    script: `app.activeDocument.source = ${JSON.stringify(file.path)};`
  };
  managerContent.hidden = true;
  editorView.hidden = false;
  inspectorView.hidden = true;
  managerTab.classList.remove('active');
  managerTab.removeAttribute('aria-current');
  openPhotopeaButton.classList.add('active');
  openPhotopeaButton.setAttribute('aria-current', 'page');
  inspectorTab.classList.remove('active');
  inspectorTab.removeAttribute('aria-current');
  photopeaFrame.src = `${photopeaOrigin}#${encodeURIComponent(JSON.stringify(configuration))}`;
}

function showManagerView(): void {
  managerContent.hidden = false;
  editorView.hidden = true;
  inspectorView.hidden = true;
  managerTab.classList.add('active');
  managerTab.setAttribute('aria-current', 'page');
  openPhotopeaButton.classList.remove('active');
  openPhotopeaButton.removeAttribute('aria-current');
  inspectorTab.classList.remove('active');
  inspectorTab.removeAttribute('aria-current');
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function openInspector(path: string): void {
  const file = activeFiles.find(item => item.path === path);
  if (!file || !isPreviewableImage(file)) return;
  if (selectedItems.size !== 1 || !selectedItems.has(path)) selectFile(path);
  if (inspectorObjectUrl) URL.revokeObjectURL(inspectorObjectUrl);
  inspectorObjectUrl = URL.createObjectURL(file.blob);
  inspectorPath = path;
  inspectorFileName.textContent = resourceName(path);
  inspectorFilePath.textContent = path;
  inspectorDimensions.textContent = 'Leyendo dimensiones…';
  inspectorFormat.textContent = file.mimeType.toUpperCase();
  inspectorSize.textContent = formatFileSize(file.blob.size);
  inspectorImage.alt = resourceName(path);
  inspectorImage.onload = () => {
    if (inspectorPath === path) inspectorDimensions.textContent = `${inspectorImage.naturalWidth} × ${inspectorImage.naturalHeight} px`;
  };
  inspectorImage.onerror = () => {
    if (inspectorPath === path) inspectorDimensions.textContent = 'No se pudo leer la imagen';
  };
  inspectorImage.src = inspectorObjectUrl;
  managerContent.hidden = true;
  editorView.hidden = true;
  inspectorView.hidden = false;
  managerTab.classList.remove('active');
  managerTab.removeAttribute('aria-current');
  openPhotopeaButton.classList.remove('active');
  openPhotopeaButton.removeAttribute('aria-current');
  inspectorTab.classList.add('active');
  inspectorTab.setAttribute('aria-current', 'page');
}

async function handlePhotopeaMessage(event: MessageEvent): Promise<void> {
  if (event.origin !== photopeaOrigin || event.source !== photopeaFrame.contentWindow) return;

  if (event.data === 'done') {
    if (photopeaPhase === 'booting' && photopeaOpenBuffer) {
      photopeaPhase = 'opening';
      photopeaStatus.textContent = 'Abriendo textura…';
      photopeaFrame.contentWindow?.postMessage(photopeaOpenBuffer, photopeaOrigin);
      photopeaOpenBuffer = undefined;
    } else if (photopeaPhase === 'opening') {
      photopeaPhase = 'ready';
      saveFromPhotopeaButton.disabled = false;
      photopeaStatus.textContent = 'Listo · Guardar en Photopea actualiza el proyecto';
    } else if (photopeaPhase === 'saving') {
      photopeaPhase = 'ready';
      saveFromPhotopeaButton.disabled = false;
      photopeaStatus.textContent = 'Textura guardada en el proyecto';
    }
    return;
  }

  if (typeof event.data === 'string') {
    if (event.data === 'texture-workbench:save') {
      pendingPhotopeaSave = true;
      photopeaPhase = 'saving';
      saveFromPhotopeaButton.disabled = true;
      photopeaStatus.textContent = 'Recibiendo textura…';
    } else if (event.data === 'texture-workbench:open') {
      photopeaStatus.textContent = 'Abre texturas desde el gestor del proyecto para conservar el vínculo.';
    }
    return;
  }

  if (!(event.data instanceof ArrayBuffer) || !pendingPhotopeaSave || !activeProject || !photopeaFilePath) return;
  pendingPhotopeaSave = false;
  const existing = activeFiles.find(file => file.path === photopeaFilePath);
  if (!existing) {
    photopeaStatus.textContent = 'El archivo ya no está en el proyecto.';
    return;
  }

  try {
    const blob = new Blob([event.data], { type: outputSettings(photopeaFilePath)?.mimeType ?? 'image/png' });
    const updated: ProjectFile = { ...existing, blob };
    await saveProjectFile(activeProject, updated);
    activeFiles = activeFiles.map(file => file.path === photopeaFilePath ? updated : file);
    selectedPath = photopeaFilePath;
    renderProjectExplorer();
    selectFile(photopeaFilePath);
    photopeaStatus.textContent = 'Textura guardada en IndexedDB';
    setSaveState('Guardado local');
  } catch (error) {
    photopeaStatus.textContent = errorMessage(error);
    setSaveState('Error al guardar textura', 'error');
  }
}

function requestPhotopeaSave(): void {
  if (photopeaPhase !== 'ready') return;
  pendingPhotopeaSave = true;
  photopeaPhase = 'saving';
  saveFromPhotopeaButton.disabled = true;
  photopeaStatus.textContent = 'Solicitando exportación…';
  const command = `app.echoToOE("texture-workbench:save");app.activeDocument.saveToOE("${photopeaOutputFormat}");`;
  photopeaFrame.contentWindow?.postMessage(command, photopeaOrigin);
}

async function saveDictionary(): Promise<void> {
  if (!activeProject) return;
  const dictionary = validateDictionary(dictionaryEditor.value);
  const file = makeDictionaryFile(activeProject, dictionary);
  activeDictionary = dictionary;
  activeFiles = activeFiles.filter(item => item.path !== file.path);
  activeFiles.push(file);
  activeProject = { ...activeProject, fileCount: activeFiles.length, updatedAt: Date.now() };
  await saveProjectFile(activeProject, file);
  await saveProject(activeProject);
  updateProjectMeta();
  dictionaryStatus.textContent = `Guardado · ${new Date().toLocaleTimeString()}`;
  dictionaryStatus.classList.remove('error');
  setSaveState('Guardado local');
  updateDictionaryCount();
  if (selectedPath === file.path) selectFile(file.path);
}

function handleDictionaryInput(): void {
  window.clearTimeout(editorTimer);
  setSaveState('Validando…', 'busy');
  editorTimer = window.setTimeout(() => {
    void saveDictionary().catch(error => {
      dictionaryStatus.textContent = errorMessage(error);
      dictionaryStatus.classList.add('error');
      setSaveState('Cambios sin guardar', 'error');
    });
  }, 700);
}

async function addFiles(files: FileList | File[]): Promise<void> {
  if (!activeProject || exportInProgress) return;
  const additions: ProjectFile[] = [];
  const existing = new Set([...allResourcePaths()].map(path => path.toLowerCase()));
  const directoryPrefix = selectedDirectory ? `${selectedDirectory}/` : '';
  for (const source of [...files]) {
    const dot = source.name.lastIndexOf('.');
    const stem = dot > 0 ? source.name.slice(0, dot) : source.name;
    const extension = dot > 0 ? source.name.slice(dot) : '';
    let name = source.name;
    let suffix = 2;
    while (existing.has(`${directoryPrefix}${name}`.toLowerCase())) {
      name = `${stem} (${suffix})${extension}`;
      suffix += 1;
    }
    const path = `${directoryPrefix}${name}`;
    existing.add(path.toLowerCase());
    additions.push({ projectId: activeProject.id, path, blob: source, mimeType: source.type || 'application/octet-stream', kind: 'source' });
  }
  if (!additions.length) return;
  activeFiles.push(...additions);
  activeProject = { ...activeProject, fileCount: activeFiles.length, updatedAt: Date.now() };
  await saveProjectFiles(activeProject, additions);
  const imageFiles = additions.filter(file => file.mimeType.startsWith('image/'));
  if (activeDictionary && imageFiles.length) {
    for (const file of imageFiles) activeDictionary.assets.push({ id: newId(), path: file.path, hashes: [], name: '', tags: [], description: '' });
    dictionaryEditor.value = `${JSON.stringify(activeDictionary, null, 2)}\n`;
    await saveDictionary();
  }
  updateProjectMeta();
  renderProjectExplorer();
  setSaveState('Guardado local');
}

async function exportActiveProject(): Promise<void> {
  if (!activeProject || exportInProgress) return;
  setExportInProgress(true, 'Preparando ZIP…');
  try {
    setSaveState('Preparando ZIP…', 'busy');
    validateDictionary(dictionaryEditor.value);
    await saveDictionary();
    setSaveState('Generando ZIP…', 'busy');
    const storedFiles = await getProjectFiles(activeProject.id);
    const files = addGeneratedTextureIni(storedFiles, activeTextureMappings);
    await exportPackage(files, activeProject.directories, activeProject.name);
    setSaveState('ZIP exportado');
  } catch (error) {
    setSaveState(errorMessage(error), 'error');
    dictionaryStatus.textContent = errorMessage(error);
    dictionaryStatus.classList.add('error');
  } finally {
    setExportInProgress(false);
  }
}

async function openLibrary(): Promise<void> {
  if (exportInProgress) return;
  clearPreviewObjectUrls();
  activeProject = undefined;
  activeFiles = [];
  activeDictionary = undefined;
  activeTextureMappings = [];
  selectedPath = '';
  selectedItems.clear();
  selectionAnchor = '';
  clipboardPaths = [];
  clipboardOperation = undefined;
  selectedDirectory = '';
  browserSearch.value = '';
  updateSelectionToolbar();
  document.body.classList.remove('project-active');
  projectView.hidden = true;
  topbarProject.hidden = true;
  topbarActions.hidden = true;
  workspaceTabs.hidden = true;
  libraryView.hidden = false;
  await renderLibrary();
}

document.querySelector<HTMLButtonElement>('#openZipButton')!.addEventListener('click', () => zipInput.click());
zipInput.addEventListener('change', () => {
  const file = zipInput.files?.[0];
  if (!file) return;
  void importZipFile(file).then(() => setLibraryStatus('')).catch(error => setLibraryStatus(errorMessage(error), true));
  zipInput.value = '';
});
document.querySelector<HTMLButtonElement>('#createProjectButton')!.addEventListener('click', () => {
  void createBlankProject().catch(error => setLibraryStatus(errorMessage(error), true));
});
closeProjectActionsButton.addEventListener('click', () => projectActionsDialog.close());
projectEditDetailsAction.addEventListener('click', () => {
  if (!selectedLibraryProject) return;
  projectNameInput.value = selectedLibraryProject.name;
  projectDescriptionInput.value = selectedLibraryProject.description ?? '';
  projectActionsDialog.close();
  projectDetailsDialog.showModal();
  projectNameInput.focus();
  projectNameInput.select();
});
projectDetailsForm.addEventListener('submit', event => {
  event.preventDefault();
  if ((event.submitter as HTMLButtonElement | null)?.value !== 'save') {
    projectDetailsDialog.close();
    return;
  }
  const project = selectedLibraryProject;
  const name = validResourceName(projectNameInput.value);
  if (!project || !name) {
    setLibraryStatus('Escribe un nombre de proyecto válido.', true);
    return;
  }
  void saveProject({
    ...project,
    name,
    description: projectDescriptionInput.value.trim() || undefined
  }).then(async () => {
    projectDetailsDialog.close();
    selectedLibraryProject = undefined;
    setLibraryStatus('Detalles del proyecto guardados.');
    await renderLibrary();
  }).catch(error => setLibraryStatus(errorMessage(error), true));
});
projectDeleteAction.addEventListener('click', () => {
  if (!selectedLibraryProject) return;
  projectDeleteMessage.textContent = `Se eliminarán “${selectedLibraryProject.name}” y todos sus archivos y mappings guardados en este navegador. Esta acción no se puede deshacer.`;
  projectActionsDialog.close();
  projectDeleteDialog.showModal();
});
projectDeleteForm.addEventListener('submit', event => {
  event.preventDefault();
  if ((event.submitter as HTMLButtonElement | null)?.value !== 'delete') {
    projectDeleteDialog.close();
    return;
  }
  const projectId = selectedLibraryProject?.id;
  if (!projectId) return;
  projectDeleteConfirmButton.disabled = true;
  projectDeleteMessage.textContent = 'Eliminando proyecto y datos locales…';
  void deleteProjectCompletely(projectId).then(async () => {
    projectDeleteDialog.close();
    selectedLibraryProject = undefined;
    setLibraryStatus('Proyecto y datos locales eliminados.');
    await renderLibrary();
  }).catch(error => {
    projectDeleteMessage.textContent = errorMessage(error);
    setLibraryStatus(errorMessage(error), true);
  }).finally(() => {
    projectDeleteConfirmButton.disabled = false;
  });
});
homeButton.addEventListener('click', event => {
  if (exportInProgress) {
    event.preventDefault();
    return;
  }
  event.preventDefault();
  void openLibrary();
});
managerTab.addEventListener('click', () => {
  showManagerView();
});
inspectorTab.addEventListener('click', () => {
  if (selectedPath) openInspector(selectedPath);
});
emptyLibrary.addEventListener('click', () => {
  void createBlankProject().catch(error => setLibraryStatus(errorMessage(error), true));
});
document.querySelector<HTMLButtonElement>('#addFilesButton')!.addEventListener('click', () => filesInput.click());
filesInput.addEventListener('change', () => {
  if (filesInput.files) void addFiles(filesInput.files).catch(error => setSaveState(errorMessage(error), 'error'));
  filesInput.value = '';
});
showDictionaryButton.addEventListener('click', () => setDictionaryVisible(true));
closeDictionaryButton.addEventListener('click', () => setDictionaryVisible(false));
document.querySelector<HTMLButtonElement>('#exportProjectButton')!.addEventListener('click', () => void exportActiveProject());
createFolderButton.addEventListener('click', () => void createFolder().catch(error => setSaveState(errorMessage(error), 'error')));
cutResourcesButton.addEventListener('click', () => setResourceClipboard('cut'));
copyResourcesButton.addEventListener('click', () => setResourceClipboard('copy'));
renameResourceButton.addEventListener('click', () => void renameSelection().catch(error => setSaveState(errorMessage(error), 'error')));
pasteResourcesButton.addEventListener('click', () => void pasteResources().catch(error => setSaveState(errorMessage(error), 'error')));
exportSelectionButton.addEventListener('click', () => void exportSelection());
document.querySelector<HTMLButtonElement>('#closeResourceActions')!.addEventListener('click', () => resourceActionsDialog.close());
resourceRenameAction.addEventListener('click', () => {
  resourceActionsDialog.close();
  void renameSelection().catch(error => setSaveState(errorMessage(error), 'error'));
});
resourceOpenFolderAction.addEventListener('click', () => {
  resourceActionsDialog.close();
  selectDirectory(resourceActionPath);
});
resourceCopyAction.addEventListener('click', () => {
  setResourceClipboard('copy');
  resourceActionsDialog.close();
});
resourceCutAction.addEventListener('click', () => {
  setResourceClipboard('cut');
  resourceActionsDialog.close();
});
resourceExportAction.addEventListener('click', () => {
  resourceActionsDialog.close();
  void exportSelection();
});
resourceViewAction.addEventListener('click', () => {
  resourceActionsDialog.close();
  openInspector(resourceActionPath);
});
resourcePhotopeaAction.addEventListener('click', () => {
  resourceActionsDialog.close();
  selectFile(resourceActionPath);
  void openSelectedInPhotopea().catch(error => {
    photopeaStatus.textContent = errorMessage(error);
    setSaveState('No se pudo abrir Photopea', 'error');
  });
});
itemNameDialog.addEventListener('close', () => {
  resolveItemName?.(itemNameDialog.returnValue === 'save' ? itemNameInput.value : undefined);
  resolveItemName = undefined;
});
browserSearch.addEventListener('input', renderProjectExplorer);
document.querySelector<HTMLButtonElement>('#saveDictionaryButton')!.addEventListener('click', () => {
  void saveDictionary().catch(error => {
    dictionaryStatus.textContent = errorMessage(error);
    dictionaryStatus.classList.add('error');
  });
});
openPhotopeaButton.addEventListener('click', () => {
  managerTab.classList.remove('active');
  void openSelectedInPhotopea().catch(error => {
    photopeaStatus.textContent = errorMessage(error);
    setSaveState('No se pudo abrir Photopea', 'error');
  });
});
saveFromPhotopeaButton.addEventListener('click', requestPhotopeaSave);
inspectorOpenEditor.addEventListener('click', () => {
  void openSelectedInPhotopea().catch(error => {
    photopeaStatus.textContent = errorMessage(error);
    setSaveState('No se pudo abrir Photopea', 'error');
  });
});
window.addEventListener('message', event => {
  void handlePhotopeaMessage(event).catch(error => {
    photopeaStatus.textContent = errorMessage(error);
    setSaveState('Error al guardar textura', 'error');
  });
});
dictionaryEditor.addEventListener('input', handleDictionaryInput);
fileSearch.addEventListener('input', renderProjectExplorer);
sidebarResizer.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  event.preventDefault();
  sidebarResizer.setPointerCapture(event.pointerId);
  const startX = event.clientX;
  const startWidth = filesPane.getBoundingClientRect().width;
  const onMove = (moveEvent: PointerEvent) => setFilesPaneWidth(startWidth + moveEvent.clientX - startX);
  const onUp = () => {
    sidebarResizer.removeEventListener('pointermove', onMove);
    sidebarResizer.removeEventListener('pointerup', onUp);
    sidebarResizer.removeEventListener('pointercancel', onUp);
  };
  sidebarResizer.addEventListener('pointermove', onMove);
  sidebarResizer.addEventListener('pointerup', onUp);
  sidebarResizer.addEventListener('pointercancel', onUp);
});
sidebarResizer.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const currentWidth = filesPane.getBoundingClientRect().width;
  if (event.key === 'Home') setFilesPaneWidth(parseFloat(getComputedStyle(document.documentElement).fontSize) * 9);
  else if (event.key === 'End') setFilesPaneWidth(workbench.clientWidth * 0.5);
  else setFilesPaneWidth(currentWidth + (event.key === 'ArrowRight' ? 16 : -16) * (event.shiftKey ? 3 : 1));
});
window.addEventListener('resize', () => {
  if (!projectView.hidden) setFilesPaneWidth(filesPane.getBoundingClientRect().width);
});
toggleFileSearchButton.addEventListener('click', () => {
  const expanded = filesPane.classList.toggle('search-open');
  toggleFileSearchButton.setAttribute('aria-expanded', String(expanded));
  if (expanded) fileSearch.focus();
  else {
    fileSearch.value = '';
    renderProjectExplorer();
  }
});
window.addEventListener('keydown', event => {
  const target = event.target;
  const editingText = target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || (target instanceof HTMLElement && target.isContentEditable);
  if (editingText || itemNameDialog.open) return;
  const key = event.key.toLowerCase();
  if (key === 'f2' && !renameResourceButton.disabled) {
    event.preventDefault();
    void renameSelection().catch(error => setSaveState(errorMessage(error), 'error'));
    return;
  }
  if (!(event.ctrlKey || event.metaKey)) return;
  if (key === 'n' && event.shiftKey) {
    event.preventDefault();
    void createFolder().catch(error => setSaveState(errorMessage(error), 'error'));
    return;
  }
  if (key === 'c' && !event.shiftKey && !copyResourcesButton.disabled) {
    event.preventDefault();
    setResourceClipboard('copy');
  } else if (key === 'x' && !event.shiftKey && !cutResourcesButton.disabled) {
    event.preventDefault();
    setResourceClipboard('cut');
  } else if (key === 'v' && clipboardOperation) {
    event.preventDefault();
    void pasteResources().catch(error => setSaveState(errorMessage(error), 'error'));
  }
});

void renderLibrary().catch(error => setLibraryStatus(errorMessage(error), true));