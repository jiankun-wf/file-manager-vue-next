import { Ref } from "vue";
import { FileItemType } from ".";
import { NK } from "../enum";
import { FileAction } from "../enum/file-action";
import { FileStatus } from "../enum/file-status";

export namespace FileManagerSpirit {
  export type currentPath = Ref<string>;
  export type selectMode = Ref<NK.SELECT_MODE_MULTIPLE | NK.SELECT_MODE_SINGLE>;
  export type viewType = Ref<"list" | "grid">;
  export type selectedFiles = Ref<FileItem[]>;
  export type draggable = Ref<boolean>;
  export type contextDraggingArgs = Ref<{
    dragging: Extract<
      NK,
      | NK.INNER_DRAG_FILE_TYPE_FILE
      | NK.INNER_DRAG_FILE_TYPE_DIR
      | NK.INNER_DRAG_FILE_TYPE_MIXED
    > | null;
    draggingPath: string;
  }>;
  export type addSelectFile = (file: FileItem) => void;
  export type fileList = Ref<FileItem[]>;
  export type dirList = Ref<FileDirItem[]>;
  export type filePutIn = (
    files: FileList | File[],
    path: string,
    type: FileItemType,
    nameing?: boolean
  ) => Promise<void>;
  export type chooseFile = () => Promise<File[] | null>;
  export type fileRename = (file: FileItem) => void;
  export type copyMode = Ref<
    Extract<FileAction, FileAction.COPY | FileAction.CUT>
  >;
  export type latestCopySelectedFiles = Ref<FileItem[]>;
  export type openFileChangeModal = (data: {
    file: FileItem[];
    action: Extract<FileAction, FileAction.MOVE | FileAction.COPY>;
    currentDirPath: string;
  }) => void;
  export type openImageEditor = (file: FileItem) => void;
  export type goPath = (path: string, replace?: boolean) => void;
  export type loadDirContent = (clear?: boolean) => Promise<void>;

  export type Context = {
    currentPath: currentPath;
    selectMode: selectMode;
    viewType: viewType;
    selectedFiles: selectedFiles;
    draggable: draggable;
    contextDraggingArgs: contextDraggingArgs;
    addSelectFile: addSelectFile;
    fileList: fileList;
    dirList: dirList;
    filePutIn: filePutIn;
    chooseFile: chooseFile;
    fileRename: fileRename;
    copyMode: copyMode;
    latestCopySelectedFiles: latestCopySelectedFiles;
    openFileChangeModal: openFileChangeModal;
    openImageEditor: openImageEditor;
    goPath: goPath;
    loadDirContent: loadDirContent;
    emit: Emit;
  };

  export interface FileItem<T extends "dir" | "file" = "file"> {
    name: string;
    path: string;
    size: number;
    type: T extends "file" ? string : undefined;
    id?: string;
    uploadTime?: number;
    __FILE: File;
    url?: string;
    nameing?: boolean;
    mockname?: string;
    __isnew?: boolean;
    status?: `${FileStatus}`;
    progress?: number;
    dir: boolean;
  }

  export interface FileDirItem {
    name: string;
    path: string;
    children?: Array<FileManagerSpirit.FileDirItem>;
    __new?: boolean;
  }

  export type Emit = (
    event: "path-change" | "file-select" | "file-move",
    ...args: any[]
  ) => void;

  export type Dispose = {
    currentPath: currentPath;
    goPath: goPath;
    filePutIn: filePutIn;
    chooseFile: chooseFile;
  };

  export type AreaRect = {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };

  export type DirContext = {
    expandKeys: Ref<string[]>;
    configKey: { value: string; label: string; children: string };
    emit: Function;
    currentValue: Ref<string>;
  };
}