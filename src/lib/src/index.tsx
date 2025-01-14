// 其他 utils
import { createContext } from "../utils/context";
import { computed, defineComponent, PropType, reactive, toRefs } from "vue";
import { uid } from "../utils/uid";
// components
import { Content } from "./content";
import { Slider } from "./slider";
import { Toolbar } from "./toolbar";
import { NSplit } from "naive-ui";
import { Provider } from "../components/Provider";
// hooks
import { useFileSelect } from "../hooks/useFileSelect";
import { useImageEdit } from "../hooks/useImageEdit";
import { useBreadcrumb } from "../hooks/useBreadcrumb";
import { useDirFiles } from "../hooks/useDirFiles";
import { useFilePutIn } from "../hooks/useFilePuIn";
import { useChooseFile } from "../hooks/useChooseFile";
import { useFileRename } from "../hooks/useFileRename";
import { useFileChange } from "../hooks/useFileChange";
import { useFileCutAndCopy } from "../hooks/useFileCutAndCopy";
// types
import type { FileManagerOptions } from "../types";
import type { FileManagerSpirit } from "../types/namespace";
import { NK } from "../enum";

import "../style/index.less";
export const FileManager = defineComponent({
  name: "FileManager",
  props: {
    currentPath: {
      type: String as PropType<string>,
      default: "",
    },
    viewType: {
      type: String as PropType<"list" | "grid">,
      default: "grid",
    },
    mode: {
      type: String as PropType<"read" | "write">,
      default: NK.MODE_WRITE,
    },
  },
  emits: ["file-move", "file-select", "path-change"],
  setup(props, { emit, expose }) {
    const id = uid("file-manager");

    const {
      currentPath,
      selectMode,
      selectedFiles,
      viewType,
      draggable,
      dirList,
      contextDraggingArgs,
    } = toRefs(
      reactive<FileManagerOptions>({
        currentPath: props.currentPath,
        selectMode: NK.SELECT_MODE_SINGLE,
        selectedFiles: [],
        fileList: [],
        dirList: [],
        draggable: true,
        contextDraggingArgs: { dragging: null, draggingPath: "" },
        viewType: props.viewType,
      })
    );

    const isOnlyRead = computed(() => {
      return props.mode === NK.MODE_READ;
    });

    const { fileList, loadDirContent } = useDirFiles({
      currentPath,
    });
    // 面包屑
    const { render: renderBreadcrumb, to } = useBreadcrumb({
      currentPath,
      loadDirContent,
    });
    // 文件选择 点击、按住ctrl多选
    const { addSelectFile } = useFileSelect({
      selectedFiles,
      selectMode,
    });
    // 文件加入，用于上传或者文件拖拽进入的文件列表数据改动
    const { handlePutIn } = useFilePutIn({
      fileList,
      currentPath,
    });
    // 公共的文件上传选择器
    const { chooseFile, renderInputUpload } = useChooseFile();
    // 文件重命名插件
    const { renderRenameContext, fileRename } = useFileRename();
    // 文件移动、复制插件
    const { fileChange, renderChangeContext } = useFileChange({
      currentPath,
    });
    // 文件剪切、复制插件
    const { copyMode, latestCopySelectedFiles } = useFileCutAndCopy({
      currentPath,
      selectedFiles,
      fileList,
    });
    // 图片编辑
    const { render: renderImageEditModal, open: handleEditImage } =
      useImageEdit();

    // 悬浮展示文件详情

    createContext({
      isOnlyRead, // 读写模式
      currentPath, // 当前目录路径
      selectMode, // 选择模式，单选/多选
      selectedFiles, // 已选中的文件列表
      viewType, // 视图类型，列表/网格
      draggable, // 文件卡片是否可以拖拽。场景，区域拖动选择时禁止可拖拽元素的文本选择与拖拽事件
      contextDraggingArgs, // 文件卡片是否在拖拽状态。场景：左侧目录监听拖入事件，需禁止目录的子元素的鼠标事件
      fileList, // 当前目录下的所有文件列表
      dirList, // 服务器目录树集合
      addSelectFile, // 根据选择模式进行选中目标文件
      filePutIn: handlePutIn, // 将外部文件加入到当前目录，并自动上传。
      chooseFile, // 公共的文件上传选择器
      openFileChangeModal: fileChange, // 文件移动、复制，打开弹窗
      fileRename, // 文件重命名
      copyMode, // 文件剪切、复制模式
      latestCopySelectedFiles, // 最近复制、剪切的文件列表
      openImageEditor: handleEditImage, // 打开图片编辑器
      goPath: to, // 跳转
      loadDirContent, // 加载目录内容
      emit, // 事件触发器
    });

    expose<FileManagerSpirit.Dispose>({
      currentPath,
      goPath: to,
      filePutIn: handlePutIn,
      chooseFile,
    });

    return () => (
      <Provider mount-id={`#${id}`}>
        <div class="file-manager" id={id}>
          <Toolbar>
            {{
              prefix: () => renderBreadcrumb(),
            }}
          </Toolbar>
          <div class="file-manager-content">
            <NSplit
              default-size={0.15}
              min={0.15}
              max={0.8}
              resizeTriggerSize={1}
            >
              {{
                1: () => <Slider />,
                2: () => <Content />,
              }}
            </NSplit>
          </div>
          {/* 选择文件 */}
          {renderInputUpload()}
          {/* 重命名弹窗 */}
          {renderRenameContext(id)}
          {/* 移动 || 复制 */}
          {renderChangeContext(id)}
          {/* 图像编辑 */}
          {renderImageEditModal()}
        </div>
      </Provider>
    );
  },
});
