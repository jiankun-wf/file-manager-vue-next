import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  toRef,
  unref,
} from "vue";
import { NK } from "../enum";
import { useContext } from "../utils/context";
import { eventStopPropagation, eventStop } from "../utils/event";
import { resizeImage } from "../utils/resize";
import { setDragStyle, setDragTransfer } from "../utils/setDragTransfer";
import { FileItem } from "../types";
import { NEllipsis } from "naive-ui";
import { useDragInToggle } from "../hooks/useDragToggle";
import { commandMove } from "../command/file/move";
import { cloneDeep } from "lodash-es";
import { commandDirMove } from "../command/dir/move";

export const FileDir = defineComponent({
  name: "FileDir",
  props: {
    currentFile: {
      type: Object as PropType<FileItem>,
      required: true,
    },
  },
  emits: ["mouseContextMenu"],
  setup(props, { emit }) {
    const elementRef = ref<HTMLDivElement>();
    const imageRef = ref<HTMLImageElement>();

    // 得到变量
    const {
      selectedFiles,
      addSelectFile,
      draggable,
      copyMode,
      latestCopySelectedFiles,
      contextDraggingArgs,
      currentPath,
      fileList,
      dirList,
    } = useContext();

    const currentFile = toRef(() => props.currentFile);

    const isSliceFile = computed(() => {
      return unref(selectedFiles).some(
        (i) => i.name === unref(currentFile).name
      );
    });

    const dirPath = computed(() => {
      return unref(currentFile).path;
    });

    const isCuttingFile = computed(() => {
      return (
        unref(copyMode) === "cut" &&
        unref(latestCopySelectedFiles).some(
          (f) => f.path === unref(currentFile).path
        )
      );
    });

    const hasDraggingFile = computed(() => {
      return (
        !!unref(contextDraggingArgs).dragging &&
        unref(contextDraggingArgs)
          .draggingPath.split(NK.ARRAY_JOIN_SEPARATOR)
          .every((p) => p !== unref(currentFile).path)
      );
    });

    // 点击选取文件
    const handleSelectFile = (e: MouseEvent) => {
      e.stopPropagation();
      addSelectFile(props.currentFile);
    };

    const getCurrentFileThumbnail = computed(() => {
      return new URL("@/lib/assets/folder.png", import.meta.url).href;
    });

    const handleDragStart = (e: DragEvent) => {
      eventStopPropagation(e);
      const paths = !unref(selectedFiles).length
        ? unref(currentFile).path
        : unref(selectedFiles)
            .map((f) => f.path)
            .join(NK.ARRAY_JOIN_SEPARATOR);

      contextDraggingArgs.value.dragging = "mixed";
      contextDraggingArgs.value.draggingPath = paths;
      if (e.dataTransfer) {
        setDragStyle(e, NK.INNER_DRAG_FILE, paths);
        e.dataTransfer.dropEffect = "link";
        e.dataTransfer.effectAllowed = "linkMove";
        setDragTransfer(e, NK.INNER_DRAG_FILE, paths);
      }
    };

    const handleDragEnd = (e: DragEvent) => {
      eventStopPropagation(e);
      contextDraggingArgs.value.dragging = null;
      contextDraggingArgs.value.draggingPath = "";
    };

    const handleContextMenu = (e: MouseEvent) => {
      eventStop(e);
      if (unref(selectedFiles).length <= 1) {
        addSelectFile(props.currentFile);
      }
      emit("mouseContextMenu", e, unref(currentFile));
    };

    const handleOpenFolder = (event: MouseEvent) => {
      eventStop(event);
      currentPath.value = unref(currentFile).path;
    };

    useDragInToggle({
      elementRef,
      dirPath,
      currentPath,
      contextDraggingArgs,
      async onDrop(event) {
        const dragData = event.dataTransfer?.getData(
          NK.DRAG_DATA_TRANSFER_TYPE
        );
        if (!dragData) return;
        try {
          const dragJson = JSON.parse(dragData);
          const isFromInner = dragJson[NK.INNER_DRAG_FLAG],
            path = dragJson[NK.INNER_DRAG_PATH],
            type = dragJson[NK.INNER_DRAG_TYPE];
          if (!isFromInner) return;
          if (type === NK.INNER_DRAG_FILE) {
            const paths = path.split(NK.ARRAY_JOIN_SEPARATOR);
            const dragFileList = unref(fileList).filter((f) =>
              paths.includes(f.path)
            );
            if (dragFileList.length) {
              await commandMove({
                file: cloneDeep(dragFileList),
                path: unref(dirPath),
              });
              fileList.value = unref(fileList).filter(
                (f) => !paths.includes(f.path)
              );
            }
          } else if (type === NK.INNER_DRAG_DIR) {
            // todo 移动文件夹
            await commandDirMove({
              targetDirPath: unref(dirPath),
              fromDirPath: path,
              currentPath,
              dirList,
            });
          }
        } finally {
        }
      },
    });

    onMounted(() => {
      const imgEl = unref(imageRef)!;
      resizeImage(unref(getCurrentFileThumbnail), imgEl, 96, 116);
    });
    return () => (
      <>
        <div
          ref={(_ref) => (elementRef.value = _ref as HTMLDivElement)}
          class={[
            "file-manager__file-item--grid file-manager__dir",
            unref(isSliceFile) && "is-selected",
            unref(isCuttingFile) && "is-cutting",
            unref(hasDraggingFile) && "has-dragging",
          ]}
          onContextmenu={handleContextMenu}
          onClick={handleSelectFile}
          onDragstart={handleDragStart}
          onDragend={handleDragEnd}
          draggable={unref(draggable)}
          onMousedown={eventStopPropagation}
          onDblclick={handleOpenFolder}
          data-path-name={unref(currentFile).path}
        >
          <div class="file-manager__file-item__thumb">
            <img
              src={unref(getCurrentFileThumbnail)}
              alt={unref(currentFile).name}
              ref={(ref) => {
                imageRef.value = ref as HTMLImageElement;
              }}
            />
          </div>
          <div class="file-manager__file-item__info">
            <div
              class="file-manager__file-item__name"
              title={unref(currentFile).name}
            >
              <NEllipsis line-clamp={3}>{unref(currentFile).name}</NEllipsis>
            </div>
          </div>
          <div class="border-state"></div>
        </div>
      </>
    );
  },
});
