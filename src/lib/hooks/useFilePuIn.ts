import { FileItemType } from "@/lib/types";
import { Ref, unref } from "vue";
import { commandUpload } from "../command/file/upload";
import { makeFileName } from "../utils/extension";
import { FileStatus } from "../enum/file-status";
import { fileToBase64, isImage } from "../utils/minetype";
import { NK } from "../enum";
import { FileManagerSpirit } from "../types/namespace";
import { commandDirMkdir } from "../command/dir/mkdir";

export const useFilePutIn = ({
  fileList,
}: {
  fileList: Ref<FileManagerSpirit.FileItem[]>;
  currentPath: Ref<string>;
}) => {
  const handlePutIn: FileManagerSpirit.filePutIn = async (
    files: FileList | File[],
    currentPath: string,
    type: FileItemType,
    naming = true
  ) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const newFileName = makeFileName(files[i].name, unref(fileList), type);

      const fileItem: FileManagerSpirit.FileItem = {
        name: newFileName,
        size: file.size,
        type: file.type,
        status: FileStatus.Ready,
        __FILE: file,
        path: `${unref(currentPath)}/${newFileName}`,
        mockname: newFileName,
        nameing: false,
        progress: 0,
        url: isImage(file.type) ? await fileToBase64(file) : "",
        dir: type === NK.FILE_DIR_FLAG_TYPE,
        __isnew: true,
      };
      fileList.value.push(fileItem);

      const currentFile = unref(fileList).find(
        (f) => f.path === fileItem.path
      )!;
      if (!currentFile) return;

      // 如果为图片文件，则需要先编辑
      if (!currentFile.dir && !/image/.test(currentFile.type)) {
        commandUpload(currentFile, currentPath);
      } else if (currentFile.dir) {
        if (naming) {
        } else {
          commandDirMkdir(currentFile, currentFile.path);
        }
      }
    }
  };

  return {
    handlePutIn,
  };
};
