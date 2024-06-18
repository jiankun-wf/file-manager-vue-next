import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  toRef,
  unref,
} from "vue";
import { FileItem } from "../types";
import { formatDate } from "../utils/date";
import { formatSize } from "../utils/size";
import { resizeImage } from "../utils/resize";
import { useContextMenu } from "../hooks/useContextMenu";
import { useContext } from "../utils/context";
import {
  DownloadOutlined,
  CopyOutlined,
  DragOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@vicons/antd";
import { renderIcon } from "../utils/icon";
import { eventStop, eventStopPropagation } from "../utils/event";
import { uid } from "../utils/uid";
import { isImage } from "../utils/minetype";
import { useUploadProgress } from "../hooks/useUploadProgress";
import { FileAction } from "../enum/file-action";
import { commandDelete } from "../command/file/delete";
import { useDialog, useMessage } from "naive-ui";

const contextMenuOptions = [
  {
    label: "复制",
    key: FileAction.COPY,
    icon: renderIcon(CopyOutlined),
  },
  {
    label: "移动",
    key: FileAction.MOVE,
    icon: renderIcon(DragOutlined),
  },
  {
    label: "重命名",
    key: FileAction.RENAME,
    icon: renderIcon(EditOutlined),
  },
  {
    type: "divider",
    key: "d1",
  },
  {
    label: "下载",
    key: FileAction.DOWNLOAD,
    icon: renderIcon(DownloadOutlined),
  },
  {
    label: "删除",
    key: FileAction.DELETE,
    props: {
      style: { color: "#d03050" },
    },
    icon: renderIcon(DeleteOutlined, { color: "#d03050" }),
  },
];

export const FileGridCard = defineComponent({
  name: "FileGridCard",

  setup() {
    const { fileList, selectedFiles, fileRename, fileChange, currentPath } =
      useContext();

    const message = useMessage();
    const dialog = useDialog();

    const contextMenuOnSelect = async (...args: any[]) => {
      const [action, _, file] = args;

      switch (action) {
        case FileAction.COPY:
          fileChange({
            file: [file],
            action: FileAction.COPY,
            currentDirPath: unref(currentPath),
          });
          return;
        case FileAction.MOVE:
          fileChange({
            file: [file],
            action: FileAction.MOVE,
            currentDirPath: unref(currentPath),
          });
          return;
        case FileAction.RENAME:
          fileRename(file);
          return;
        case FileAction.DELETE:
          const flag = await commandDelete({
            files: [file],
            fileList,
            selectedFiles,
            dialog,
          });
          flag && message.success("删除成功");
          return;
        case FileAction.DOWNLOAD:
      }
    };

    const { renderContextMenu, handleContextMenu } = useContextMenu({
      options: contextMenuOptions,
      onSelect: contextMenuOnSelect,
    });
    return () => (
      <div class="file-manager__file-list--grid">
        {unref(fileList).map((f) => (
          <FileGridCardItem
            currentFile={f}
            onMouseContextMenu={handleContextMenu}
          />
        ))}
        {renderContextMenu()}
      </div>
    );
  },
});

const FileGridCardItem = defineComponent({
  props: {
    currentFile: {
      type: Object as PropType<FileItem>,
      required: true,
    },
  },
  emits: ["mouseContextMenu"],
  setup(props, { emit }) {
    const imageId = uid("file-manager-file-grid-thumb-image");

    // 得到变量
    const { selectedFiles, addSelectFile, draggable } = useContext();

    // 点击选取文件
    const handleSelectFile = (e: MouseEvent) => {
      e.stopPropagation();
      addSelectFile(props.currentFile);
    };

    const currentFile = toRef(props, "currentFile");

    const getCurrentFileThumbnail = computed(() => {
      if (isImage(unref(currentFile).type) && unref(currentFile).url) {
        return unref(currentFile).url as string;
      }
      return new URL("@/assets/otherfile.png", import.meta.url).href;
    });

    const isSliceFile = computed(() => {
      return unref(selectedFiles).some(
        (i) => i.name === unref(currentFile).name
      );
    });

    const handleDragStart = (e: DragEvent) => {};

    const handleContextMenu = (e: MouseEvent) => {
      eventStop(e);
      emit("mouseContextMenu", e, unref(currentFile));
    };

    onMounted(() => {
      const imgEl = document.getElementById(imageId) as HTMLImageElement;
      if (/image/.test(unref(currentFile).type)) {
        resizeImage(unref(getCurrentFileThumbnail), imgEl, 150, 100);
      } else {
        imgEl.width = 48;
        imgEl.height = 48;
      }
    });
    return () => (
      <>
        <div
          class="file-manager__file-item--grid"
          onContextmenu={handleContextMenu}
          onClick={handleSelectFile}
          onDragstart={handleDragStart}
          draggable={unref(draggable)}
          onMousedown={eventStopPropagation}
          data-name={unref(currentFile).name}
        >
          <div class="file-manager__file-item__thumb">
            <img
              src={unref(getCurrentFileThumbnail)}
              alt={unref(currentFile).name}
              id={imageId}
            />
          </div>
          <div class="file-manager__file-item__info">
            <div
              class="file-manager__file-item__name"
              title={unref(currentFile).name}
            >
              {unref(currentFile).name}
            </div>
            {unref(currentFile).status === "completed" ? (
              <div class="file-manager__file-item__time">
                {formatDate(
                  unref(currentFile).uploadTime,
                  "YYYY-MM-DD HH:mm:ss"
                )}
              </div>
            ) : (
              <div class="file-manager__file-item__status">
                {unref(currentFile).status}
              </div>
            )}
            <div class="file-manager__file-item__size">
              {formatSize(unref(currentFile).size)}
            </div>
          </div>
          <div class="darg-area"></div>
          {unref(isSliceFile) && <div class="is-selected"></div>}
          {useUploadProgress(currentFile)}
        </div>
      </>
    );
  },
});
