import { FileStatus } from "@/lib/enum/file-status";
import { FileManagerSpirit } from "@/lib/types/namespace";
import { unref } from "vue";

export const commandUpload = async ({
  file,
  dir,
  $fapi,
}: {
  file: FileManagerSpirit.FileItem;
  dir: string;
  $fapi: FileManagerSpirit.$fapi;
}) => {
  file.status = FileStatus.Uploading;
  file.progress = 0;

  // TODO: upload file to server

  const { fileType, md5, uri, size, mineType, path }: any = await unref($fapi).FILE.upload(
    { file: file.__FILE!, dir },
    (progress) => {
      const total = progress.total || 0;

      const loaded = progress.loaded;

      const p = (loaded / total) * 100;

      file.progress = Number(p.toFixed(2));
    }
  );

  file.dir = fileType === "FOLDER";
  file.status = "completed";
  file.path = uri;
  file.__isnew = false;
  file.size = size;
  file.md5 = md5;
  file.type = mineType;
  file.relativePath = path;

  return {
    path: uri,
  };
};
